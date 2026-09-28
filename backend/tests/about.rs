use axum::{body::Body, extract::ConnectInfo, http::Request};
use http_body_util::BodyExt;
use sqlx::postgres::PgPoolOptions;
use tower::ServiceExt;

#[tokio::test]
async fn public_catalog_has_client_time_and_typed_parameters() {
    let pool = PgPoolOptions::new().connect_lazy("postgres://unused:unused@localhost/unused").unwrap();
    let mut request = Request::builder().uri("/about.json")
        .header("x-real-ip", "198.51.100.9").body(Body::empty()).unwrap();
    request.extensions_mut().insert(ConnectInfo("192.0.2.42:1234".parse::<std::net::SocketAddr>().unwrap()));
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
    assert_eq!(services.len(), 4);
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
    assert_eq!(count, 9);
}
