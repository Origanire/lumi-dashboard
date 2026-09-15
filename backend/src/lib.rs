use axum::{
    Json, Router,
    extract::State,
    http::{HeaderMap, StatusCode},
    routing::{get, post},
};
use bcrypt::verify;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    sync::{Arc, Mutex},
};
use utoipa::{OpenApi, ToSchema};
use utoipa_swagger_ui::SwaggerUi;
use uuid::Uuid;

const DEMO_EMAIL: &str = "demo@lumi.local";
const DEMO_PASSWORD_HASH: &str = "$2b$12$VUVLb5qMxqmDrARbU8ZH6ehBHOxOuja0z4nCTCeFyK2xPWoi8/EJO";

#[derive(Clone)]
pub struct AppState {
    sessions: Arc<Mutex<HashSet<String>>>,
    email: Arc<String>,
    password_hash: Arc<String>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashSet::new())),
            email: Arc::new(std::env::var("LUMI_DEMO_EMAIL").unwrap_or_else(|_| DEMO_EMAIL.into())),
            password_hash: Arc::new(
                std::env::var("LUMI_DEMO_PASSWORD_HASH")
                    .unwrap_or_else(|_| DEMO_PASSWORD_HASH.into()),
            ),
        }
    }
}
#[derive(Serialize, ToSchema)]
pub struct HealthResponse {
    status: &'static str,
    message: &'static str,
}
#[derive(Deserialize, ToSchema)]
pub struct LoginRequest {
    email: String,
    password: String,
}
#[derive(Serialize, ToSchema)]
pub struct LoginResponse {
    token: String,
    user: UserResponse,
}
#[derive(Serialize, ToSchema)]
pub struct UserResponse {
    email: String,
    name: &'static str,
}
#[derive(Serialize, ToSchema)]
pub struct MessageResponse {
    message: &'static str,
}

#[derive(OpenApi)]
#[openapi(
    info(title = "Lumi API", version = "0.2.0"),
    paths(health, login, current_user, logout),
    components(schemas(
        HealthResponse,
        LoginRequest,
        LoginResponse,
        UserResponse,
        MessageResponse
    ))
)]
struct ApiDoc;

#[utoipa::path(get, path = "/api/health", responses((status = 200, body = HealthResponse)))]
async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        message: "Connexion réussie ! Le backend Rust répond au frontend React.",
    })
}

#[utoipa::path(post, path = "/api/auth/login", request_body = LoginRequest, responses((status = 200, body = LoginResponse), (status = 401, body = MessageResponse)))]
async fn login(
    State(state): State<AppState>,
    Json(input): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, Json<MessageResponse>)> {
    if !input.email.eq_ignore_ascii_case(&state.email)
        || !verify(input.password, &state.password_hash).unwrap_or(false)
    {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(MessageResponse {
                message: "Adresse e-mail ou mot de passe incorrect.",
            }),
        ));
    }
    let token = Uuid::new_v4().to_string();
    state
        .sessions
        .lock()
        .expect("sessions accessibles")
        .insert(token.clone());
    Ok(Json(LoginResponse {
        token,
        user: UserResponse {
            email: state.email.to_string(),
            name: "Utilisateur Lumi",
        },
    }))
}

fn bearer(headers: &HeaderMap) -> Option<&str> {
    headers
        .get("authorization")?
        .to_str()
        .ok()?
        .strip_prefix("Bearer ")
}
fn unauthorized() -> (StatusCode, Json<MessageResponse>) {
    (
        StatusCode::UNAUTHORIZED,
        Json(MessageResponse {
            message: "Authentification requise.",
        }),
    )
}

#[utoipa::path(get, path = "/api/auth/me", responses((status = 200, body = UserResponse), (status = 401, body = MessageResponse)))]
async fn current_user(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<UserResponse>, (StatusCode, Json<MessageResponse>)> {
    if !bearer(&headers).is_some_and(|token| {
        state
            .sessions
            .lock()
            .expect("sessions accessibles")
            .contains(token)
    }) {
        return Err(unauthorized());
    }
    Ok(Json(UserResponse {
        email: state.email.to_string(),
        name: "Utilisateur Lumi",
    }))
}

#[utoipa::path(post, path = "/api/auth/logout", responses((status = 200, body = MessageResponse), (status = 401, body = MessageResponse)))]
async fn logout(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<MessageResponse>, (StatusCode, Json<MessageResponse>)> {
    let Some(token) = bearer(&headers) else {
        return Err(unauthorized());
    };
    if !state
        .sessions
        .lock()
        .expect("sessions accessibles")
        .remove(token)
    {
        return Err(unauthorized());
    }
    Ok(Json(MessageResponse {
        message: "Déconnexion réussie.",
    }))
}

async fn not_found() -> (StatusCode, Json<MessageResponse>) {
    (
        StatusCode::NOT_FOUND,
        Json(MessageResponse {
            message: "Route introuvable.",
        }),
    )
}

pub fn app() -> Router {
    Router::new()
        .route("/api/health", get(health))
        .route("/api/auth/login", post(login))
        .route("/api/auth/me", get(current_user))
        .route("/api/auth/logout", post(logout))
        .merge(SwaggerUi::new("/api/docs").url("/api/openapi.json", ApiDoc::openapi()))
        .fallback(not_found)
        .with_state(AppState::default())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::Request};
    use http_body_util::BodyExt;
    use tower::ServiceExt;
    async fn json(response: axum::response::Response) -> serde_json::Value {
        serde_json::from_slice(&response.into_body().collect().await.unwrap().to_bytes()).unwrap()
    }
    #[tokio::test]
    async fn login_protects_the_session() {
        let app = app();
        assert_eq!(
            app.clone()
                .oneshot(
                    Request::builder()
                        .uri("/api/auth/me")
                        .body(Body::empty())
                        .unwrap()
                )
                .await
                .unwrap()
                .status(),
            StatusCode::UNAUTHORIZED
        );
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/auth/login")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"email":"demo@lumi.local","password":"lumi-demo"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let token = json(response).await["token"].as_str().unwrap().to_owned();
        let authenticated = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/auth/me")
                    .header("authorization", format!("Bearer {token}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(authenticated.status(), StatusCode::OK);
        let logout = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/auth/logout")
                    .header("authorization", format!("Bearer {token}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(logout.status(), StatusCode::OK);
    }
    #[tokio::test]
    async fn public_routes_work() {
        for uri in ["/api/health", "/api/openapi.json", "/api/docs/"] {
            assert_eq!(
                app()
                    .oneshot(Request::builder().uri(uri).body(Body::empty()).unwrap())
                    .await
                    .unwrap()
                    .status(),
                StatusCode::OK
            );
        }
    }
}
