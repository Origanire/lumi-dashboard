# Organisation du dépôt

La racine contient les commandes du workspace, la configuration Docker et le guide de démarrage. Les guides fonctionnels, contrats API et supports du projet sont regroupés dans `docs/`.

## Frontend

- `src/App.jsx` : restauration de session, connexion, déconnexion et choix de la page.
- `src/pages/` : accueil, tableau de bord et compte utilisateur.
- `src/components/` : composants partagés et interfaces de gestion des comptes/services. `DashboardWorkspace` gère la synchronisation des dashboards avec le serveur.
- `src/dashboard/` : composition du dashboard, cartes, formulaire de configuration, placement et widgets initiaux. `layout.js` calcule le placement sans dépendre de React.
- `src/widgets/catalog.js` : métadonnées et clés de configuration des widgets.
- `src/widgets/WidgetContent.jsx` : sélection du composant selon le type de widget.
- `src/widgets/WidgetEditorFields.jsx` : champs de configuration propres à chaque type.
- `src/widgets/<service>/` : affichage, clients et sessions propres à chaque intégration.
- `src/hooks/` : comportements React réutilisables.
- `src/dashboardModel.js` : validation et import/export des dashboards.
- `src/styles/` : styles par domaine, importés depuis `src/style.css`.
- `tests/` : tests unitaires ; `e2e/` : parcours navigateur Playwright.

## Backend

- `src/main.rs` : démarrage du serveur et initialisation.
- `src/lib.rs` : état partagé, assemblage des routes et documentation OpenAPI.
- `src/middleware.rs` : journalisation HTTP et en-têtes de réponse.
- Les modules `auth`, `email_auth`, `google_auth`, `admin`, `workspace`, `openai` et `about` portent leurs API respectives ; `mail` et `error` fournissent les services communs.
- `migrations/` conserve l’historique SQL nécessaire aux bases existantes et aux nouvelles installations.
- `tests/fixtures/` contient les clés de test OIDC ; elles sont nécessaires aux tests de signature.

## Vérification

```bash
npm run services
npm test
npm run build -w frontend
npm run test:e2e -w frontend
```

Les prérequis des tests navigateur sont dans le [README](../README.md#tests-navigateur-reproductibles). `npm run check:clean` effectue une installation et un démarrage Docker dans un répertoire temporaire, nettoyé automatiquement après exécution.
