use tokio::net::TcpListener;

#[tokio::main]
async fn main() {
    let listener = TcpListener::bind("127.0.0.1:3001")
        .await
        .expect("impossible d'ouvrir le port 3001");
    println!("Backend Rust disponible sur http://127.0.0.1:3001");
    axum::serve(listener, dashboard_backend::app())
        .await
        .expect("erreur du serveur HTTP");
}
