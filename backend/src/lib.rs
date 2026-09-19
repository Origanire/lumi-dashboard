use axum::{
    Json, Router,
    http::StatusCode,
    routing::{get, post},
};
use serde::Serialize;
use sqlx::PgPool;
use utoipa::{
    Modify, OpenApi, ToSchema,
    openapi::security::{Http, HttpAuthScheme, SecurityScheme},
};
use utoipa_swagger_ui::SwaggerUi;

pub mod auth;
mod error;

pub const DEMO_EMAIL: &str = "demo@lumi.local";
pub const DEMO_PASSWORD_HASH: &str = "$2b$12$VUVLb5qMxqmDrARbU8ZH6ehBHOxOuja0z4nCTCeFyK2xPWoi8/EJO";
pub static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!();

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
}

#[derive(Serialize, ToSchema)]
pub struct HealthResponse {
    status: &'static str,
    message: &'static str,
}
#[derive(Serialize, ToSchema)]
pub struct MessageResponse {
    message: &'static str,
}

struct Security;
impl Modify for Security {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer",
                SecurityScheme::Http(Http::new(HttpAuthScheme::Bearer)),
            );
        }
    }
}
#[derive(OpenApi)]
#[openapi(
    info(title = "Lumi API", version = "0.3.0"),
    paths(health, auth::register, auth::login, auth::current_user, auth::logout),
    components(schemas(HealthResponse, MessageResponse)),
    modifiers(&Security)
)]
struct ApiDoc;

#[utoipa::path(get, path = "/api/health", responses((status = 200, body = HealthResponse)))]
async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        message: "Connexion réussie ! Le backend Rust répond au frontend React.",
    })
}
async fn not_found() -> (StatusCode, Json<MessageResponse>) {
    (
        StatusCode::NOT_FOUND,
        Json(MessageResponse {
            message: "Route introuvable.",
        }),
    )
}

/// The caller supplies a migrated pool, also allowing isolated databases in tests.
pub fn app(pool: PgPool) -> Router {
    Router::new()
        .route("/api/health", get(health))
        .route("/api/auth/register", post(auth::register))
        .route("/api/auth/login", post(auth::login))
        .route("/api/auth/me", get(auth::current_user))
        .route("/api/auth/logout", post(auth::logout))
        .merge(SwaggerUi::new("/api/docs").url("/api/openapi.json", ApiDoc::openapi()))
        .fallback(not_found)
        .with_state(AppState { pool })
}
