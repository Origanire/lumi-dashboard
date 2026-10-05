//! Local Ollama assistant. Historical module/subscription IDs remain compatible.
use crate::{AppState, auth::AuthUser, error::ApiError};
use axum::{Json, extract::State, http::StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::time::Duration;

#[derive(Deserialize, utoipa::ToSchema)]
#[serde(deny_unknown_fields)]
pub struct Ask {
    prompt: String,
}
#[derive(Serialize, utoipa::ToSchema)]
pub struct Answer {
    text: String,
    incomplete: bool,
}
fn config() -> (String, String) {
    let env = |name, fallback: &str| {
        std::env::var(name)
            .ok()
            .filter(|s| !s.trim().is_empty())
            .unwrap_or_else(|| fallback.into())
    };
    (
        env("OLLAMA_URL", "http://127.0.0.1:11435")
            .trim_end_matches('/')
            .into(),
        env("OLLAMA_MODEL", "qwen2.5:14b"),
    )
}
fn client(timeout: u64) -> Result<reqwest::Client, ApiError> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(timeout))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|_| {
            ApiError(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Configuration HTTP indisponible.",
            )
        })
}
fn model_present(data: &Value, model: &str) -> bool {
    let normalized = if model.contains(':') {
        model.to_owned()
    } else {
        format!("{model}:latest")
    };
    data["models"].as_array().into_iter().flatten().any(|item| {
        item["name"].as_str() == Some(normalized.as_str())
            || item["model"].as_str() == Some(normalized.as_str())
    })
}
pub async fn status(_user: AuthUser) -> Json<Value> {
    let (url, model) = config();
    let data = match client(5) {
        Ok(client) => match client.get(format!("{url}/api/tags")).send().await {
            Ok(response) if response.status().is_success() => response.json::<Value>().await.ok(),
            _ => None,
        },
        Err(_) => None,
    };
    let configured = data
        .as_ref()
        .is_some_and(|data| model_present(data, &model));
    let message = if configured {
        "Le modèle local est prêt."
    } else if data.is_some() {
        "Le modèle local n’est pas encore téléchargé. Son installation peut prendre quelques minutes."
    } else {
        "L’assistant local est indisponible. Vérifiez que le service Ollama est démarré."
    };
    Json(json!({"configured":configured,"provider":"ollama","model":model,"message":message}))
}
fn extract_answer(data: &Value) -> Result<Answer, ApiError> {
    let text = data["message"]["content"].as_str().unwrap_or("");
    if text.trim().is_empty() || data["done"] != true {
        return Err(ApiError(
            StatusCode::BAD_GATEWAY,
            "Aucune réponse complète reçue. Reformulez votre demande.",
        ));
    }
    Ok(Answer {
        text: text.into(),
        incomplete: data["done_reason"] == "length",
    })
}
const SYSTEM_PROMPT: &str = "Tu es l’assistant de Lumi. Réponds en français, clairement et brièvement, sauf si une autre langue est demandée. Réponds aux questions générales à partir de tes connaissances. N’invente pas de faits, de chiffres, de citations ni de sources. Si tu ne sais pas, dis-le ; si la question est ambiguë, demande une précision. Tu n’as pas accès à Internet, aux autres widgets, aux comptes ni aux fichiers de l’utilisateur. Pour la météo actuelle, les actualités, les prix, les scores, les horaires ou toute information demandée en temps réel, explique que tu ne peux pas vérifier les données actuelles et ne donne pas de valeur présentée comme actuelle. Ne prétends pas avoir consulté une source ou exécuté une action. Pour les calculs, vérifie le résultat avant de répondre. Chaque demande est indépendante des précédentes.";

async fn generate(url: &str, model: &str, prompt: &str) -> Result<Answer, ApiError> {
    if crate::calculator::is_expression(prompt) {
        return crate::calculator::evaluate(prompt)
            .map(calculation_answer)
            .map_err(ApiError::invalid);
    }
    let calculate = crate::calculator::wants_calculation(prompt);
    let system = if calculate {
        "Traduis la demande en une expression arithmétique, sans calculer le résultat. Utilise uniquement les nombres présents dans la demande, dans le bon ordre, et les opérateurs + - * / avec des parenthèses si nécessaire. Conserve chaque nombre et ses décimales exactement. Retourne uniquement le JSON demandé. Si la demande est ambiguë, ne relève pas de ces opérations ou nécessite d’inventer des nombres, retourne une expression vide. Exemple : multiplier 12, 3.1 et 2 puis soustraire 31.4 donne {\"expression\":\"12 * 3.1 * 2 - 31.4\"}."
    } else {
        SYSTEM_PROMPT
    };
    let mut body = json!({
        "model":model,"stream":false,"think":false,"keep_alive":"5m",
        "messages":[{"role":"system","content":system},{"role":"user","content":prompt}],
        "options":{"num_ctx":4096,"num_predict":if calculate {256} else {384},"temperature":0.1}
    });
    if calculate {
        body["format"] = json!({"type":"object","properties":{"expression":{"type":"string"}},"required":["expression"],"additionalProperties":false});
    }
    let response = client(300)?.post(format!("{url}/api/chat")).json(&body).send().await.map_err(|error| ApiError(StatusCode::SERVICE_UNAVAILABLE, if error.is_timeout() { "Le modèle local n’a pas répondu à temps. Aucun nouvel envoi automatique n’a été effectué." } else { "Connexion à l’assistant local impossible. Vérifiez que le service Ollama est démarré." }))?;
    if !response.status().is_success() {
        return Err(ApiError(
            StatusCode::SERVICE_UNAVAILABLE,
            if response.status().as_u16() == 404 {
                "Le modèle local n’est pas encore téléchargé. Réessayez après son installation."
            } else {
                "Le modèle local est momentanément indisponible. Réessayez plus tard."
            },
        ));
    }
    let data: Value = response.json().await.map_err(|_| {
        ApiError(
            StatusCode::BAD_GATEWAY,
            "Réponse du modèle local illisible.",
        )
    })?;
    let answer = extract_answer(&data)?;
    if calculate {
        #[derive(Deserialize)]
        #[serde(deny_unknown_fields)]
        struct Plan {
            expression: String,
        }
        let invalid = || {
            ApiError::invalid(
                "Je n’ai pas pu interpréter ce calcul. Écrivez une expression avec +, -, *, / et des parenthèses.",
            )
        };
        let plan: Plan = serde_json::from_str(&answer.text).map_err(|_| invalid())?;
        if answer.incomplete || !crate::calculator::same_numbers(prompt, &plan.expression) {
            return Err(invalid());
        }
        let calculation =
            crate::calculator::evaluate(&plan.expression).map_err(ApiError::invalid)?;
        return Ok(calculation_answer(calculation));
    }
    Ok(answer)
}
fn calculation_answer(calculation: crate::calculator::Calculation) -> Answer {
    Answer {
        text: format!(
            "Expression interprétée : {}\nRésultat calculé{} : {}",
            calculation.expression,
            if calculation.approximate {
                " (arrondi)"
            } else {
                ""
            },
            calculation.result
        ),
        incomplete: false,
    }
}
#[utoipa::path(post,path="/api/ai/ask",request_body=Ask,responses((status=200,body=Answer),(status=401,description="Session requise"),(status=429,description="Limite atteinte"),(status=503,description="Modèle local indisponible")))]
pub async fn ask(
    user: AuthUser,
    State(state): State<AppState>,
    Json(input): Json<Ask>,
) -> Result<Json<Answer>, ApiError> {
    if input.prompt.trim().is_empty() || input.prompt.chars().count() > 8000 {
        return Err(ApiError::invalid(
            "Saisissez une demande de 1 à 8 000 caractères.",
        ));
    }
    let subscribed: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM service_subscriptions WHERE user_id=$1 AND service='openai')",
    )
    .bind(user.id)
    .fetch_one(&state.pool)
    .await?;
    if !subscribed {
        return Err(ApiError(
            StatusCode::FORBIDDEN,
            "Activez l’assistant IA local dans Mon compte → Mes services.",
        ));
    }
    let count:i32=sqlx::query_scalar("INSERT INTO ai_requests(user_id) VALUES($1) ON CONFLICT(user_id) DO UPDATE SET requests=CASE WHEN ai_requests.window_start<now()-interval '1 minute' THEN 1 ELSE ai_requests.requests+1 END, window_start=CASE WHEN ai_requests.window_start<now()-interval '1 minute' THEN now() ELSE ai_requests.window_start END RETURNING requests").bind(user.id).fetch_one(&state.pool).await?;
    if count > 5 {
        return Err(ApiError(
            StatusCode::TOO_MANY_REQUESTS,
            "Maximum cinq demandes par minute. Patientez avant de réessayer.",
        ));
    }
    static GENERATION: tokio::sync::Semaphore = tokio::sync::Semaphore::const_new(1);
    let _permit = GENERATION.try_acquire().map_err(|_| {
        ApiError(
            StatusCode::TOO_MANY_REQUESTS,
            "L’assistant local répond déjà à une demande. Patientez avant de réessayer.",
        )
    })?;
    let (url, model) = config();
    Ok(Json(generate(&url, &model, input.prompt.trim()).await?))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn only_returns_visible_content_and_marks_truncation() {
        let answer = extract_answer(&json!({"message":{"content":"Bonjour","thinking":"private"},"done":true,"done_reason":"length"})).ok().unwrap();
        assert_eq!(answer.text, "Bonjour");
        assert!(answer.incomplete);
        assert!(extract_answer(&json!({"message":{"content":""},"done":true})).is_err());
        assert!(extract_answer(&json!({"message":{"content":"partial"},"done":false})).is_err());
    }
    #[test]
    fn readiness_checks_the_selected_model() {
        let tags = json!({"models":[{"name":"qwen2.5:14b"},{"model":"other:latest"}]});
        assert!(model_present(&tags, "qwen2.5:14b"));
        assert!(model_present(&tags, "other"));
        assert!(!model_present(&tags, "qwen3:8b"));
        assert!(!model_present(&Value::Null, "qwen2.5:14b"));
    }
    #[tokio::test]
    async fn natural_language_calculation_is_computed_and_invented_operands_are_rejected() {
        use axum::{Router, routing::post};
        let app = Router::new().route("/api/chat", post(|Json(body):Json<Value>| async move {
            assert_eq!(body["format"]["type"], "object");
            let expression = if body["model"] == "invented" { "123.1 - 31.4" } else { "12 * 3.1 * 2 - 31.4" };
            Json(json!({"done":true,"message":{"content":json!({"expression":expression}).to_string()}}))
        }));
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://{}", listener.local_addr().unwrap());
        let server = tokio::spawn(async move {
            axum::serve(listener, app).await.unwrap();
        });
        let question = "fais moi la multiplication des nombres 12 3.1 et 2 puis tu soustrait 31.4";
        let answer = generate(&url, "local", question).await.ok().unwrap();
        assert!(answer.text.ends_with("Résultat calculé : 43"));
        assert_eq!(
            generate(&url, "invented", question).await.err().unwrap().0,
            StatusCode::BAD_REQUEST
        );
        assert_eq!(
            generate("http://127.0.0.1:1", "unused", "1 / 0")
                .await
                .err()
                .unwrap()
                .0,
            StatusCode::BAD_REQUEST
        );
        // An explicit expression works without any model/network connection.
        assert!(
            generate("http://127.0.0.1:1", "unused", "12 * 3.1 * 2 - 31.4")
                .await
                .ok()
                .unwrap()
                .text
                .ends_with("43")
        );
        server.abort();
    }
    #[tokio::test]
    async fn sends_local_chat_without_key_or_thinking_and_handles_missing_model() {
        use axum::{Router, http::HeaderMap, routing::post};
        let app = Router::new().route(
            "/api/chat",
            post(|headers: HeaderMap, Json(body): Json<Value>| async move {
                assert!(!headers.contains_key("authorization"));
                assert_eq!(body["stream"], false);
                assert_eq!(body["think"], false);
                assert_eq!(body["options"]["temperature"], 0.1);
                assert!(
                    body["messages"][0]["content"]
                        .as_str()
                        .unwrap()
                        .contains("temps réel")
                );
                assert_eq!(body["messages"][1]["content"], "Bonjour");
                if body["model"] == "missing" {
                    return (
                        StatusCode::NOT_FOUND,
                        Json(json!({"error":"internal-detail"})),
                    );
                }
                (
                    StatusCode::OK,
                    Json(json!({"done":true,"message":{"content":"Salut"}})),
                )
            }),
        );
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://{}", listener.local_addr().unwrap());
        let server = tokio::spawn(async move {
            axum::serve(listener, app).await.unwrap();
        });
        assert_eq!(
            generate(&url, "qwen2.5:14b", "Bonjour")
                .await
                .ok()
                .unwrap()
                .text,
            "Salut"
        );
        let error = generate(&url, "missing", "Bonjour").await.err().unwrap();
        assert_eq!(error.0, StatusCode::SERVICE_UNAVAILABLE);
        assert!(!error.1.contains("internal-detail"));
        server.abort();
    }
}
