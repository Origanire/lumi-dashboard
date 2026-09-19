use crate::{AppState, MessageResponse, error::ApiError};
use axum::{
    Json,
    extract::{FromRequestParts, State},
    http::{StatusCode, request::Parts},
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::{FromRow, PgConnection, PgPool};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Clone, Copy, Deserialize, Serialize, ToSchema, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum Role {
    Perso,
    Employe,
    Entreprise,
    Admin,
}

#[derive(Deserialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct RegisterRequest {
    email: String,
    name: String,
    password: String,
    role: Role,
    company_name: Option<String>,
}
#[derive(Deserialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct LoginRequest {
    email: String,
    password: String,
}
#[derive(Serialize, ToSchema)]
pub struct LoginResponse {
    token: String,
    user: UserResponse,
}
#[derive(Serialize, FromRow, ToSchema)]
pub struct CompanyResponse {
    id: Uuid,
    name: String,
}
#[derive(Serialize, ToSchema)]
pub struct UserResponse {
    id: Uuid,
    email: String,
    name: String,
    /// Active role, checked against user_roles by the server.
    role: Role,
    roles: Vec<Role>,
    companies: Vec<CompanyResponse>,
}
#[derive(FromRow)]
struct Account {
    id: Uuid,
    email: String,
    name: String,
    password_hash: String,
}

pub struct AuthUser {
    pub id: Uuid,
    pub role: Role,
    token_hash: String,
}
fn hash_token(token: &str) -> String {
    format!("{:x}", Sha256::digest(token.as_bytes()))
}
fn internal() -> ApiError {
    ApiError(
        StatusCode::INTERNAL_SERVER_ERROR,
        "Erreur interne du serveur.",
    )
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = ApiError;
    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, ApiError> {
        let token = parts
            .headers
            .get("authorization")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "))
            .filter(|v| !v.is_empty())
            .ok_or_else(ApiError::unauthorized)?;
        let token_hash = hash_token(token);
        let (id, role) = sqlx::query_as(
            "SELECT user_id, role FROM sessions WHERE token_hash = $1 AND expires_at > now()",
        )
        .bind(&token_hash)
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(ApiError::unauthorized)?;
        Ok(Self {
            id,
            role,
            token_hash,
        })
    }
}

impl AuthUser {
    /// Use this guard before any future operation restricted to administrators.
    pub fn require_admin(&self) -> Result<(), ApiError> {
        if matches!(self.role, Role::Admin) {
            Ok(())
        } else {
            Err(ApiError(
                StatusCode::FORBIDDEN,
                "Accès administrateur requis.",
            ))
        }
    }
}

async fn response(
    connection: &mut PgConnection,
    account: Account,
    role: Role,
) -> Result<UserResponse, ApiError> {
    let roles = sqlx::query_scalar("SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role")
        .bind(account.id)
        .fetch_all(&mut *connection)
        .await?;
    let companies = sqlx::query_as(
        "SELECT c.id, c.name FROM companies c
         JOIN company_memberships m ON m.company_id = c.id
         WHERE m.user_id = $1 ORDER BY c.id",
    )
    .bind(account.id)
    .fetch_all(&mut *connection)
    .await?;
    Ok(UserResponse {
        id: account.id,
        email: account.email,
        name: account.name,
        role,
        roles,
        companies,
    })
}

#[utoipa::path(post, path = "/api/auth/register", request_body = RegisterRequest, responses((status = 201, body = MessageResponse), (status = 400, body = MessageResponse), (status = 403, body = MessageResponse), (status = 409, body = MessageResponse)))]
pub async fn register(
    State(state): State<AppState>,
    Json(input): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<MessageResponse>), ApiError> {
    if matches!(input.role, Role::Admin) {
        return Err(ApiError(
            StatusCode::FORBIDDEN,
            "Le rôle administrateur ne peut pas être choisi à l'inscription.",
        ));
    }
    let email = input.email.trim().to_lowercase();
    let name = input.name.trim();
    let email_parts: Vec<_> = email.split('@').collect();
    if email.len() > 254
        || email_parts.len() != 2
        || email_parts.iter().any(|p| p.is_empty())
        || email.chars().any(char::is_whitespace)
        || !email_parts[1].contains('.')
    {
        return Err(ApiError::invalid("Adresse e-mail invalide."));
    }
    if name.is_empty() || name.chars().count() > 100 {
        return Err(ApiError::invalid(
            "Le nom doit contenir entre 1 et 100 caractères.",
        ));
    }
    // bcrypt accepts at most 72 bytes; reject longer passwords rather than truncate.
    if input.password.chars().count() < 8 || input.password.len() > 72 {
        return Err(ApiError::invalid(
            "Le mot de passe doit contenir au moins 8 caractères et au plus 72 octets.",
        ));
    }
    let company_name = input.company_name.as_deref().map(str::trim);
    if matches!(input.role, Role::Entreprise) {
        if company_name.is_none_or(|s| s.is_empty() || s.chars().count() > 150) {
            return Err(ApiError::invalid(
                "Le nom de l'entreprise est requis (150 caractères maximum).",
            ));
        }
    } else if company_name.is_some() {
        return Err(ApiError::invalid(
            "Le nom d'entreprise est réservé à l'inscription entreprise.",
        ));
    }
    let hash =
        tokio::task::spawn_blocking(move || bcrypt::hash(input.password, bcrypt::DEFAULT_COST))
            .await
            .map_err(|_| internal())?
            .map_err(|_| internal())?;
    let mut tx = state.pool.begin().await?;
    let id = Uuid::new_v4();
    let inserted: Option<Uuid> = sqlx::query_scalar(
        "INSERT INTO users (id, email, name, password_hash) VALUES ($1,$2,$3,$4)
         ON CONFLICT (lower(email)) DO NOTHING RETURNING id",
    )
    .bind(id)
    .bind(email)
    .bind(name)
    .bind(hash)
    .fetch_optional(&mut *tx)
    .await?;
    if inserted.is_none() {
        return Err(ApiError(
            StatusCode::CONFLICT,
            "Cette adresse e-mail est déjà utilisée.",
        ));
    }
    sqlx::query("INSERT INTO user_roles (user_id, role) VALUES ($1,$2)")
        .bind(id)
        .bind(input.role)
        .execute(&mut *tx)
        .await?;
    if let Some(company_name) = company_name {
        let company_id = Uuid::new_v4();
        sqlx::query("INSERT INTO companies (id, name) VALUES ($1,$2)")
            .bind(company_id)
            .bind(company_name)
            .execute(&mut *tx)
            .await?;
        sqlx::query("INSERT INTO company_memberships (user_id, company_id) VALUES ($1,$2)")
            .bind(id)
            .bind(company_id)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;
    Ok((
        StatusCode::CREATED,
        Json(MessageResponse {
            message: "Compte créé. Vous pouvez vous connecter.",
        }),
    ))
}

#[utoipa::path(post, path = "/api/auth/login", request_body = LoginRequest, responses((status = 200, body = LoginResponse), (status = 401, body = MessageResponse), (status = 403, body = MessageResponse)))]
pub async fn login(
    State(state): State<AppState>,
    Json(input): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, ApiError> {
    let account: Option<Account> = sqlx::query_as(
        "SELECT id, email, name, password_hash FROM users WHERE lower(email) = lower($1)",
    )
    .bind(input.email.trim())
    .fetch_optional(&state.pool)
    .await?;
    let hash = account
        .as_ref()
        .map(|a| a.password_hash.clone())
        .unwrap_or_else(|| crate::DEMO_PASSWORD_HASH.to_owned());
    let valid = tokio::task::spawn_blocking(move || {
        input.password.len() <= 72 && bcrypt::verify(input.password, &hash).unwrap_or(false)
    })
    .await
    .map_err(|_| internal())?;
    let account = account.filter(|_| valid).ok_or(ApiError(
        StatusCode::UNAUTHORIZED,
        "Adresse e-mail ou mot de passe incorrect.",
    ))?;
    // Hold the role row until the session exists so a concurrent revocation cannot race login.
    let mut tx = state.pool.begin().await?;
    let role: Role = sqlx::query_scalar(
        "SELECT role FROM user_roles WHERE user_id = $1
         ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'entreprise' THEN 1 WHEN 'employe' THEN 2 ELSE 3 END
         LIMIT 1 FOR KEY SHARE"
    ).bind(account.id).fetch_optional(&mut *tx).await?
        .ok_or(ApiError(StatusCode::FORBIDDEN, "Aucun rôle n'est attribué à votre compte."))?;
    let user = response(&mut tx, account, role).await?;
    let token = format!("{}{}", Uuid::new_v4().simple(), Uuid::new_v4().simple());
    sqlx::query("INSERT INTO sessions (token_hash, user_id, role) VALUES ($1,$2,$3)")
        .bind(hash_token(&token))
        .bind(user.id)
        .bind(role)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(Json(LoginResponse { token, user }))
}

#[utoipa::path(get, path = "/api/auth/me", security(("bearer" = [])), responses((status = 200, body = UserResponse), (status = 401, body = MessageResponse)))]
pub async fn current_user(
    State(state): State<AppState>,
    user: AuthUser,
) -> Result<Json<UserResponse>, ApiError> {
    let account = sqlx::query_as("SELECT id, email, name, password_hash FROM users WHERE id = $1")
        .bind(user.id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(ApiError::unauthorized)?;
    let mut connection = state.pool.acquire().await?;
    Ok(Json(response(&mut connection, account, user.role).await?))
}
#[utoipa::path(post, path = "/api/auth/logout", security(("bearer" = [])), responses((status = 200, body = MessageResponse), (status = 401, body = MessageResponse)))]
pub async fn logout(
    State(state): State<AppState>,
    user: AuthUser,
) -> Result<Json<MessageResponse>, ApiError> {
    sqlx::query("DELETE FROM sessions WHERE token_hash = $1")
        .bind(user.token_hash)
        .execute(&state.pool)
        .await?;
    Ok(Json(MessageResponse {
        message: "Déconnexion réussie.",
    }))
}

pub async fn seed_demo(pool: &PgPool, email: &str, password_hash: &str) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    let id: Option<Uuid> = sqlx::query_scalar(
        "INSERT INTO users (id, email, name, password_hash) VALUES ($1,$2,'Utilisateur Lumi',$3)
         ON CONFLICT DO NOTHING RETURNING id",
    )
    .bind(Uuid::new_v4())
    .bind(email.trim())
    .bind(password_hash)
    .fetch_optional(&mut *tx)
    .await?;
    if let Some(id) = id {
        sqlx::query("INSERT INTO user_roles (user_id, role) VALUES ($1,'perso')")
            .bind(id)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await
}
