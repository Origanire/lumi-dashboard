use axum::{
    extract::{MatchedPath, Request},
    middleware::Next,
    response::Response,
};

pub async fn request_context(request: Request, next: Next) -> Response {
    let started = std::time::Instant::now();
    let method = request.method().to_string();
    let route = request
        .extensions()
        .get::<MatchedPath>()
        .map(|path| path.as_str().to_owned())
        .unwrap_or_else(|| "unmatched".into());
    let request_id = uuid::Uuid::new_v4().to_string();
    let mut response = next.run(request).await;
    eprintln!(
        "{}",
        serde_json::json!({"event":"http_request", "request_id":request_id, "method":method, "route":route, "status":response.status().as_u16(), "duration_ms":started.elapsed().as_millis()})
    );
    response
        .headers_mut()
        .insert("x-request-id", request_id.parse().unwrap());
    response
        .headers_mut()
        .insert("cache-control", "no-store".parse().unwrap());
    for (name, value) in [
        ("x-content-type-options", "nosniff"),
        ("x-frame-options", "DENY"),
        ("referrer-policy", "no-referrer"),
    ] {
        response.headers_mut().insert(name, value.parse().unwrap());
    }
    response
}
