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
- Base de données : à choisir ultérieurement.

## Prérequis

Node.js 20.19 ou supérieur, npm et Rust avec Cargo.

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

Aucun secret ni fichier `.env` ne sont nécessaires pour cette démonstration. Le compte provisoire est `demo@lumi.local` avec le mot de passe `lumi-demo`. Le backend conserve uniquement un hash bcrypt du mot de passe et les sessions restent en mémoire. Les variables `LUMI_DEMO_EMAIL` et `LUMI_DEMO_PASSWORD_HASH` permettent de remplacer ce compte. Le backend écoute sur `127.0.0.1:3001` et le frontend sur `localhost:5174`. En développement, Vite transmet les requêtes `/api` au backend via le proxy défini dans `frontend/vite.config.js`.

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

La spécification OpenAPI est disponible sur `/api/openapi.json`. Elle est définie à partir des annotations Rust dans `backend/src/lib.rs` et devra être complétée lors de l'ajout de nouvelles routes. Les fichiers Swagger UI sont servis localement par le backend, sans CDN.

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

Les tests backend vérifient les routes publiques, la documentation OpenAPI ainsi que la connexion, la protection de session et la déconnexion.

## Équipe

- [Nom du membre — rôle]

## Licence

La licence reste à définir. Voir [LICENCE.md](./LICENCE.md).
