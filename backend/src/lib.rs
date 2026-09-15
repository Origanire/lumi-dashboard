use axum::{Json, Router, http::StatusCode, routing::get};
use serde::Serialize;
use utoipa::{OpenApi, ToSchema};
use utoipa_swagger_ui::SwaggerUi;

#[derive(Serialize, ToSchema)]
pub struct HealthResponse {
    /// État courant de l'API.
    #[schema(example = "ok")]
    status: &'static str,
    /// Message destiné à l'interface.
    #[schema(example = "Connexion réussie ! Le backend Rust répond au frontend React.")]
    message: &'static str,
}

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Dashboard API",
        version = "0.1.0",
        description = "API Rust du projet Dashboard."
    ),
    paths(health),
    components(schemas(HealthResponse)),
    tags((name = "État du serveur", description = "Disponibilité de l'API"))
)]
struct ApiDoc;

#[utoipa::path(
    get,
    path = "/api/health",
    tag = "État du serveur",
    summary = "Vérifier que le backend répond",
    responses(
        (status = 200, description = "Le backend est disponible.", body = HealthResponse)
    )
)]
async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        message: "Connexion réussie ! Le backend Rust répond au frontend React.",
    })
}

async fn not_found() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::NOT_FOUND,
        Json(serde_json::json!({ "message": "Route introuvable." })),
    )
}

pub fn app() -> Router {
    Router::new()
        .route("/api/health", get(health))
        .merge(SwaggerUi::new("/api/docs").url("/api/openapi.json", ApiDoc::openapi()))
        .fallback(not_found)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::Request};
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    #[tokio::test]
    async fn health_and_documentation_are_available() {
        let response = app()
            .oneshot(
                Request::builder()
                    .uri("/api/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["status"], "ok");
        assert!(json["message"].as_str().unwrap().contains("Rust"));

        for uri in ["/api/openapi.json", "/api/docs/"] {
            let response = app()
                .oneshot(Request::builder().uri(uri).body(Body::empty()).unwrap())
                .await
                .unwrap();
            assert_eq!(response.status(), StatusCode::OK, "{uri}");
        }

        let response = app()
            .oneshot(
                Request::builder()
                    .uri("/api/missing")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }
}
