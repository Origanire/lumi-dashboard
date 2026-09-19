use crate::MessageResponse;
use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};

pub struct ApiError(pub StatusCode, pub &'static str);
impl ApiError {
    pub fn unauthorized() -> Self {
        Self(StatusCode::UNAUTHORIZED, "Authentification requise.")
    }
    pub fn invalid(message: &'static str) -> Self {
        Self(StatusCode::BAD_REQUEST, message)
    }
}
impl From<sqlx::Error> for ApiError {
    fn from(error: sqlx::Error) -> Self {
        eprintln!("Database operation failed: {error}");
        Self(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Erreur interne du serveur.",
        )
    }
}
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.0, Json(MessageResponse { message: self.1 })).into_response()
    }
}
