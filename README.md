# Lumi

Projet de tableau de bord réalisé dans le cadre du module G-WEB-500.

> Ce README est un modèle à compléter au fur et à mesure du développement.

## Présentation

L'application proposera un tableau de bord personnalisable avec des services et des widgets.

Pour cette première étape, une page React permet de tester la communication avec une API Rust via le bouton **Tester la connexion**.

Le sujet du projet est disponible dans [dashboard-project.pdf](./dashboard-project.pdf).

La liste des tâches et des priorités est disponible dans [TODO.md](./TODO.md).

Les règles visuelles et les composants de référence sont décrits dans [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

## Technologies utilisées

- Frontend : React en JavaScript (JSX), avec Vite.
- Backend : Rust avec le framework Axum.
- Base de données : PostgreSQL, requêtes et migrations SQLx (sans Prisma).

## Prérequis

Node.js 20.19 ou supérieur, npm, Rust avec Cargo et PostgreSQL 16 (ou Docker Compose pour la base locale).

## Organisation

- `frontend/` : interface React et configuration Vite.
- `backend/` : API Rust avec Axum, documentation OpenAPI et tests.
- `package.json` : commandes communes et workspaces npm.

## Installation

1. Cloner le dépôt et ouvrir le dossier du projet.
2. Installer toutes les dépendances depuis la racine :

```bash
npm install
```

## Configuration

Copier la configuration locale puis démarrer PostgreSQL :

```bash
cp .env.example .env
docker compose up -d --wait postgres
```

`DATABASE_URL` est obligatoire. Le backend charge `.env` et applique les migrations SQLx au démarrage. Le volume Docker conserve les données entre les redémarrages.

En développement, `LUMI_SEED_DEMO=true` crée le compte `demo@lumi.local` / `lumi-demo` s'il n'existe pas. Les variables `LUMI_DEMO_EMAIL` et `LUMI_DEMO_PASSWORD_HASH` permettent de personnaliser le compte lors de sa création. Désactiver ce bootstrap hors développement. Les comptes et sessions sont désormais stockés dans PostgreSQL.

Le backend écoute sur `127.0.0.1:3001` et le frontend sur `localhost:5174`. Vite transmet `/api` au backend via son proxy.

Le périmètre actuel couvre la création de compte et la connexion avec les rôles `perso`, `employe`, `entreprise` et `admin`. Les rôles sont cumulables et contrôlés côté serveur. L'inscription publique ne permet pas de s'attribuer le rôle administrateur.

Le formulaire propose l'inscription et le choix du profil de connexion. Les widgets sont reportés : leur affichage et leurs endpoints backend sont retirés pour le moment.

Voir le [contrat API des comptes](backend/docs/accounts.md) pour le modèle relationnel, les exemples de requêtes et la migration depuis la première version.

## Lancement

### Développement

Depuis la racine :

```bash
npm run dev
```

Ouvrir http://localhost:5174 puis cliquer sur **Tester la connexion**. Le message « Connexion réussie ! » confirme la réponse du backend. Les deux serveurs se relancent automatiquement lors des modifications. Utiliser `Ctrl+C` pour les arrêter.

L’API est aussi accessible directement : http://127.0.0.1:3001/api/health.

### Documentation interactive — Swagger UI

Avec `npm run dev` lancé, ouvrir http://localhost:5174/api/docs (ou directement http://127.0.0.1:3001/api/docs).

Déplier **GET /api/health**, cliquer sur **Try it out**, puis **Execute** pour envoyer une requête et afficher la réponse du backend.

La spécification OpenAPI est disponible sur `/api/openapi.json`. Elle est définie à partir des annotations Rust dans `backend/src/lib.rs`, `auth.rs`. Les routes privées sont testables avec le bouton **Authorize** et le jeton reçu à la connexion. Les fichiers Swagger UI sont servis localement par le backend, sans CDN.

### Compilation et production

```bash
npm run build
npm start
```

`npm start` lance uniquement le backend compilé. Pour déployer le frontend, servir les fichiers de `frontend/dist/` avec un serveur web et configurer ce serveur pour transmettre `/api` au backend. Le déploiement complet sera mis en place dans une prochaine étape.

## Tests

```bash
npm test
```

Les tests backend utilisent `DATABASE_URL` et une base PostgreSQL isolée par scénario ; le compte de test doit pouvoir créer des bases. Ils vérifient l’inscription, les rôles cumulables, le contrôle du rôle de connexion, les sessions et l’unicité des comptes. Voir les [instructions détaillées](backend/docs/accounts.md#vérifications).

## Équipe

- [Nom du membre — rôle]

## Licence

La licence reste à définir. Voir [LICENCE.md](./LICENCE.md).
