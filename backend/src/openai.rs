use crate::{AppState, auth::AuthUser, error::ApiError};
use axum::{Json, extract::State, http::StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
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
fn key() -> Option<String> {
    std::env::var("OPENAI_API_KEY")
        .ok()
        .filter(|s| !s.trim().is_empty())
}
pub async fn status(_user: AuthUser) -> Json<Value> {
    Json(json!({"configured":key().is_some()}))
}
fn quota_error(data: &Value) -> ApiError {
    let message = match data["error"]["code"].as_str() {
        Some("credit_balance_exhausted") => "Le crédit du compte API OpenAI est épuisé. Ajoutez des crédits dans la facturation OpenAI avant de réessayer.",
        Some("organization_spend_limit_exceeded" | "project_spend_limit_exceeded" | "organization_usage_limit_exceeded") => "La limite de dépense ou d’utilisation du compte API OpenAI est atteinte. Vérifiez les limites du compte avant de réessayer.",
        Some("rate_limit_exceeded" | "slow_down") => "Trop de demandes à OpenAI. Patientez avant de réessayer.",
        _ => "Quota ou crédit OpenAI insuffisant. Vérifiez le compte API ou réessayez plus tard.",
    };
    ApiError(StatusCode::TOO_MANY_REQUESTS, message)
}

fn extract_answer(data: &Value) -> Result<Answer, ApiError> {
    let text = data["output"]
        .as_array()
        .into_iter()
        .flatten()
        .filter(|item| item["type"] == "message")
        .flat_map(|item| item["content"].as_array().into_iter().flatten())
        .filter_map(|item| match item["type"].as_str() {
            Some("output_text") => item["text"].as_str(),
            Some("refusal") => item["refusal"].as_str(),
            _ => None,
        })
        .collect::<Vec<_>>()
        .join("\n");
    if text.trim().is_empty() {
        return Err(ApiError(
            StatusCode::BAD_GATEWAY,
            "Aucune réponse textuelle reçue. Reformulez votre demande.",
        ));
    }
    Ok(Answer {
        text,
        incomplete: data["status"] == "incomplete",
    })
}
#[utoipa::path(post,path="/api/ai/ask",request_body=Ask,responses((status=200,body=Answer),(status=401,description="Session requise"),(status=429,description="Limite atteinte"),(status=503,description="Clé API non configurée")))]
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
    let key=key().ok_or(ApiError(StatusCode::SERVICE_UNAVAILABLE,"Le service OpenAI n’est pas configuré. Renseignez OPENAI_API_KEY côté serveur puis redémarrez le backend."))?;
    let subscribed: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM service_subscriptions WHERE user_id=$1 AND service='openai')",
    )
    .bind(user.id)
    .fetch_one(&state.pool)
    .await?;
    if !subscribed {
        return Err(ApiError(
            StatusCode::FORBIDDEN,
            "Activez OpenAI dans Mon compte → Mes services.",
        ));
    }
    let count:i32=sqlx::query_scalar("INSERT INTO ai_requests(user_id) VALUES($1) ON CONFLICT(user_id) DO UPDATE SET requests=CASE WHEN ai_requests.window_start<now()-interval '1 minute' THEN 1 ELSE ai_requests.requests+1 END, window_start=CASE WHEN ai_requests.window_start<now()-interval '1 minute' THEN now() ELSE ai_requests.window_start END RETURNING requests").bind(user.id).fetch_one(&state.pool).await?;
    if count > 5 {
        return Err(ApiError(
            StatusCode::TOO_MANY_REQUESTS,
            "Maximum cinq demandes par minute. Patientez avant de réessayer.",
        ));
    }
    let model = std::env::var("OPENAI_MODEL")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| "gpt-4.1-mini".into());
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|_| {
            ApiError(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Configuration HTTP indisponible.",
            )
        })?;
    let response=client.post("https://api.openai.com/v1/responses").bearer_auth(key.trim()).json(&json!({"model":model,"input":input.prompt.trim(),"max_output_tokens":1500,"store":false})).send().await.map_err(|error|ApiError(StatusCode::BAD_GATEWAY,if error.is_timeout(){"OpenAI n’a pas répondu à temps. Aucun nouvel envoi automatique n’a été effectué."}else{"Connexion à OpenAI impossible. Réessayez plus tard."}))?;
    if !response.status().is_success() {
        return Err(match response.status().as_u16() {
            401 | 403 => ApiError(
                StatusCode::BAD_GATEWAY,
                "Clé OpenAI invalide ou accès au modèle refusé. Vérifiez la configuration serveur.",
            ),
            429 => quota_error(&response.json::<Value>().await.unwrap_or(Value::Null)),
            400 | 404 => ApiError(
                StatusCode::BAD_GATEWAY,
                "Modèle OpenAI indisponible ou configuration incompatible. Vérifiez OPENAI_MODEL.",
            ),
            _ => ApiError(
                StatusCode::BAD_GATEWAY,
                "OpenAI est momentanément indisponible.",
            ),
        });
    }
    let data: Value = response
        .json()
        .await
        .map_err(|_| ApiError(StatusCode::BAD_GATEWAY, "Réponse OpenAI illisible."))?;
    Ok(Json(extract_answer(&data)?))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn billing_and_temporary_rate_errors_have_distinct_safe_messages() {
        let depleted = quota_error(&json!({"error":{"code":"credit_balance_exhausted","message":"secret-provider-details"}}));
        assert_eq!(depleted.0, StatusCode::TOO_MANY_REQUESTS);
        assert!(depleted.1.contains("crédit"));
        assert!(!depleted.1.contains("secret-provider-details"));
        let rate = quota_error(&json!({"error":{"code":"rate_limit_exceeded"}}));
        assert!(rate.1.contains("Patientez"));
        let limit = quota_error(&json!({"error":{"code":"project_spend_limit_exceeded"}}));
        assert!(limit.1.contains("limite"));
        assert!(quota_error(&Value::Null).1.contains("Quota ou crédit"));
    }

    #[test]
    fn extracts_text_and_refusals_without_reasoning_or_metadata() {
        let data = json!({"status":"completed","output":[{"type":"reasoning","content":[{"type":"output_text","text":"private"}]},{"type":"message","content":[{"type":"output_text","text":"Bonjour"},{"type":"refusal","refusal":"Refus"}]}]});
        let answer = extract_answer(&data).ok().expect("text answer");
        assert_eq!(answer.text, "Bonjour\nRefus");
        assert!(!answer.incomplete);
        assert!(extract_answer(&json!({"output":[]})).is_err());
    }
}
