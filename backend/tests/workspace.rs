use axum::{Router, body::Body, http::Request};
use http_body_util::BodyExt;
use serde_json::{Value, json};
use sqlx::PgPool;
use tower::ServiceExt;
async fn request(app: &Router, method: &str, path: &str, token: &str, body: Value) -> (u16, Value) {
    let mut req = Request::builder()
        .method(method)
        .uri(path)
        .header("content-type", "application/json");
    if !token.is_empty() {
        req = req.header("authorization", format!("Bearer {token}"));
    }
    let res = app
        .clone()
        .oneshot(req.body(Body::from(body.to_string())).unwrap())
        .await
        .unwrap();
    let status = res.status().as_u16();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (
        status,
        serde_json::from_slice(&bytes).unwrap_or(Value::Null),
    )
}
async fn account(pool: &PgPool, app: &Router, email: &str) -> (String, String) {
    let (status, _) = request(
        app,
        "POST",
        "/api/auth/register",
        "",
        json!({"email":email,"name":"Test","password":"test-password","role":"perso"}),
    )
    .await;
    assert_eq!(status, 201);
    sqlx::query("UPDATE users SET email_verified_at=now() WHERE email=$1")
        .bind(email)
        .execute(pool)
        .await
        .unwrap();
    let (status, data) = request(
        app,
        "POST",
        "/api/auth/login",
        "",
        json!({"email":email,"password":"test-password"}),
    )
    .await;
    assert_eq!(status, 200);
    (
        data["token"].as_str().unwrap().into(),
        data["user"]["id"].as_str().unwrap().into(),
    )
}
#[sqlx::test]
async fn dashboards_isolate_accounts_validate_and_detect_conflicts(pool: PgPool) {
    let app = lumi_backend::app(pool.clone());
    let (a, _) = account(&pool, &app, "a@test.local").await;
    let (b, _) = account(&pool, &app, "b@test.local").await;
    assert_eq!(
        request(&app, "GET", "/api/dashboards", "", Value::Null)
            .await
            .0,
        401
    );
    let body = json!({"name":"Travail","widgets":[{"id":"note","type":"notes","title":"Notes","x":1,"y":1,"width":6,"height":2,"content":"Privé"}]});
    let (status, item) = request(&app, "POST", "/api/dashboards", &a, body.clone()).await;
    assert_eq!(status, 201, "{item}");
    let path = format!("/api/dashboards/{}", item["id"].as_str().unwrap());
    assert_eq!(
        request(&app, "GET", "/api/dashboards", &b, Value::Null)
            .await
            .1,
        json!([])
    );
    let mut edit = body.clone();
    edit["revision"] = json!(0);
    assert_eq!(request(&app, "PUT", &path, &b, edit.clone()).await.0, 409);
    assert_eq!(request(&app, "DELETE", &path, &b, Value::Null).await.0, 204);
    assert_eq!(request(&app, "PUT", &path, &a, edit.clone()).await.0, 200);
    assert_eq!(request(&app, "PUT", &path, &a, edit).await.0, 409);
    let mut invalid = body.clone();
    invalid["widgets"][0]["token"] = json!("secret");
    assert_eq!(
        request(&app, "POST", "/api/dashboards", &a, invalid)
            .await
            .0,
        400
    );
    let mut invalid = body;
    invalid["widgets"][0]["x"] = json!(12);
    assert_eq!(
        request(&app, "POST", "/api/dashboards", &a, invalid)
            .await
            .0,
        400
    );
    assert_eq!(
        request(&app, "GET", "/api/dashboards", &a, Value::Null)
            .await
            .1[0]["widgets"][0]["content"],
        "Privé"
    );
    assert_eq!(request(&app, "DELETE", &path, &a, Value::Null).await.0, 204);
    assert_eq!(
        request(&app, "GET", "/api/dashboards", &a, Value::Null)
            .await
            .1,
        json!([])
    );
}
#[sqlx::test]
async fn subscriptions_and_admin_permissions(pool: PgPool) {
    let app = lumi_backend::app(pool.clone());
    let (a, aid) = account(&pool, &app, "a@test.local").await;
    let (b, bid) = account(&pool, &app, "b@test.local").await;
    assert_eq!(
        request(&app, "PUT", "/api/services/github", &a, Value::Null)
            .await
            .0,
        204
    );
    assert_eq!(
        request(&app, "GET", "/api/services", &a, Value::Null)
            .await
            .1,
        json!(["github"])
    );
    assert_eq!(
        request(&app, "GET", "/api/services", &b, Value::Null)
            .await
            .1,
        json!([])
    );
    assert_eq!(
        request(&app, "PUT", "/api/services/unknown", &a, Value::Null)
            .await
            .0,
        400
    );
    assert_eq!(
        request(&app, "GET", "/api/admin/users", &a, Value::Null)
            .await
            .0,
        403
    );
    sqlx::query("INSERT INTO user_roles(user_id,role) VALUES($1::uuid,'admin')")
        .bind(&aid)
        .execute(&pool)
        .await
        .unwrap();
    sqlx::query("UPDATE sessions SET role='admin' WHERE user_id=$1::uuid")
        .bind(&aid)
        .execute(&pool)
        .await
        .unwrap();
    assert_eq!(
        request(&app, "GET", "/api/admin/users", &a, Value::Null)
            .await
            .0,
        200
    );
    assert_eq!(
        request(
            &app,
            "PUT",
            &format!("/api/admin/users/{aid}/roles"),
            &a,
            json!({"roles":["perso"]})
        )
        .await
        .0,
        400
    );
    assert_eq!(
        request(
            &app,
            "PUT",
            &format!("/api/admin/users/{bid}/roles"),
            &a,
            json!({"roles":["employe"]})
        )
        .await
        .0,
        204
    );
    assert_eq!(
        request(&app, "GET", "/api/auth/me", &b, Value::Null)
            .await
            .0,
        401
    );
}
#[sqlx::test]
async fn login_attempts_are_limited_before_password_work(pool: PgPool) {
    let app = lumi_backend::app(pool.clone());
    let (token, _) = account(&pool, &app, "limit@test.local").await;
    assert!(!token.is_empty());
    use sha2::{Digest, Sha256};
    let hash = format!("{:x}", Sha256::digest(b"limit@test.local"));
    sqlx::query("INSERT INTO login_attempts(address_hash,attempts) VALUES($1,10)")
        .bind(&hash)
        .execute(&pool)
        .await
        .unwrap();
    assert_eq!(
        request(
            &app,
            "POST",
            "/api/auth/login",
            "",
            json!({"email":"limit@test.local","password":"test-password"})
        )
        .await
        .0,
        429
    );
    sqlx::query(
        "UPDATE login_attempts SET window_start=now()-interval '16 minutes' WHERE address_hash=$1",
    )
    .bind(hash)
    .execute(&pool)
    .await
    .unwrap();
    assert_eq!(
        request(
            &app,
            "POST",
            "/api/auth/login",
            "",
            json!({"email":"limit@test.local","password":"test-password"})
        )
        .await
        .0,
        200
    );
}

#[sqlx::test]
async fn openai_subscription_and_prompt_validation(pool: PgPool) {
    let app = lumi_backend::app(pool.clone());
    assert_eq!(request(&app, "POST", "/api/ai/ask", "", json!({"prompt":"Bonjour"})).await.0, 401);
    assert_eq!(request(&app, "GET", "/api/ai/status", "", Value::Null).await.0, 401);
    let (token, user) = account(&pool, &app, "ai@test.local").await;
    sqlx::query("INSERT INTO service_subscriptions(user_id,service) VALUES($1,'openai')")
        .bind(uuid::Uuid::parse_str(&user).unwrap()).execute(&pool).await.unwrap();
    assert_eq!(request(&app, "GET", "/api/ai/status", &token, Value::Null).await.0, 200);
    for prompt in [" ".to_string(), "a".repeat(8001)] {
        assert_eq!(request(&app, "POST", "/api/ai/ask", &token, json!({"prompt":prompt})).await.0, 400);
    }
}
