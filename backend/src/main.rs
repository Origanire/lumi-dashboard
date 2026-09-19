use sqlx::postgres::PgPoolOptions;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    let url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL doit être configurée (PostgreSQL)");
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&url)
        .await?;
    lumi_backend::MIGRATOR.run(&pool).await?;
    if std::env::var("LUMI_SEED_DEMO").as_deref() == Ok("true") {
        let email =
            std::env::var("LUMI_DEMO_EMAIL").unwrap_or_else(|_| lumi_backend::DEMO_EMAIL.into());
        let hash = std::env::var("LUMI_DEMO_PASSWORD_HASH")
            .ok()
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| lumi_backend::DEMO_PASSWORD_HASH.into());
        lumi_backend::auth::seed_demo(&pool, &email, &hash).await?;
    }
    let listener = TcpListener::bind("127.0.0.1:3001").await?;
    println!("Backend Rust disponible sur http://127.0.0.1:3001");
    axum::serve(listener, lumi_backend::app(pool)).await?;
    Ok(())
}
