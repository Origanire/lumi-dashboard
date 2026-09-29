use axum::{body::Body, extract::ConnectInfo, http::Request};
use http_body_util::BodyExt;
use sqlx::postgres::PgPoolOptions;
use tower::ServiceExt;

#[tokio::test]
async fn public_catalog_has_client_time_and_typed_parameters() {
    let pool = PgPoolOptions::new()
        .connect_lazy("postgres://unused:unused@localhost/unused")
        .unwrap();
    let mut request = Request::builder()
        .uri("/about.json")
        .header("x-real-ip", "198.51.100.9")
        .body(Body::empty())
        .unwrap();
    request.extensions_mut().insert(ConnectInfo(
        "192.0.2.42:1234".parse::<std::net::SocketAddr>().unwrap(),
    ));
    let response = lumi_backend::app(pool).oneshot(request).await.unwrap();
    assert_eq!(response.status(), 200);
    assert_eq!(response.headers()["x-content-type-options"], "nosniff");
    assert_eq!(response.headers()["x-frame-options"], "DENY");
    assert_eq!(response.headers()["referrer-policy"], "no-referrer");
    assert_eq!(response.headers()["cache-control"], "no-store");
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let value: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(value["client"]["host"], "192.0.2.42");
    assert!(value["server"]["current_time"].as_u64().unwrap() > 1_700_000_000);
    let services = value["server"]["services"].as_array().unwrap();
    assert_eq!(services.len(), 5);
    let mut count = 0;
    for service in services {
        for widget in service["widgets"].as_array().unwrap() {
            count += 1;
            assert!(!widget["description"].as_str().unwrap().is_empty());
            for param in widget["params"].as_array().unwrap() {
                assert!(matches!(param["type"].as_str(), Some("integer" | "string")));
            }
        }
    }
    assert_eq!(count, 11);
}

#[test]
fn catalog_matches_frontend_widget_types() {
    let source = include_str!("../../frontend/src/widgets/index.jsx");
    let types = source
        .split("export const WIDGET_TYPES = {")
        .nth(1)
        .unwrap()
        .split("export const WIDGET_CONFIG_KEYS")
        .next()
        .unwrap();
    let mut frontend: Vec<_> = types
        .lines()
        .filter_map(|line| {
            if line.starts_with("  ") && !line.starts_with("   ") {
                line.trim()
                    .split_once(": {")
                    .map(|(name, _)| name.to_owned())
            } else {
                None
            }
        })
        .collect();
    let catalog = lumi_backend::about::catalog();
    let mut backend: Vec<_> = catalog
        .as_array()
        .unwrap()
        .iter()
        .flat_map(|service| service["widgets"].as_array().unwrap())
        .map(|widget| widget["name"].as_str().unwrap().to_owned())
        .collect();
    frontend.sort();
    backend.sort();
    assert_eq!(frontend, backend);
}
