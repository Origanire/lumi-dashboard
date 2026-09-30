# Bonus et fichiers associés

Les fonctionnalités sont intégrées à l’application ; ce document identifie leurs sources pour la livraison.

| Bonus | Sources principales | Périmètre |
| --- | --- | --- |
| Connexion Google OIDC | `backend/src/google_auth.rs`, `frontend/src/components/GoogleSignIn.jsx` | Signature, audience, émetteur, expiration et nonce ; consentement réel à valider |
| Thèmes | `frontend/src/components/ThemeToggle.jsx`, `frontend/public/theme-init.js`, `frontend/src/styles/theme.css` | Clair/sombre et préférence locale |
| Glisser-déposer, redimensionnement | `frontend/src/dashboard/DashboardWidgets.jsx` | Grille desktop ; commandes clavier/toucher |
| Dashboards multiples, import/export | `frontend/src/components/DashboardWorkspace.jsx`, `frontend/src/dashboardModel.js`, `backend/src/workspace.rs` | Stockage PostgreSQL, versions, format JSON validé |
| Notifications | `frontend/src/components/Notifications.jsx`, `frontend/src/widgets/FocusWidget.jsx` | Vingt messages au maximum par session |
| Recherche | `frontend/src/dashboard/WidgetEditor.jsx`, `frontend/src/components/ServiceSubscriptions.jsx` | Filtrage des widgets et services |
| Cache et quotas | `frontend/src/widgets/github/githubCache.js`, `githubClient.js`, `frontend/src/hooks/useRefresh.js` | Cache GitHub mémoire, pause après quota, polling visible et borné |
| Historique | `frontend/src/widgets/github/GitHubWidget.jsx` | 24 observations du nombre d’éléments chargés, en session |
| Administration | `backend/src/admin.rs`, `frontend/src/components/AdminUsers.jsx` | Recherche, rôles, révocation des sessions, contrôle serveur |
| Mobile | `frontend/src/styles/responsive.css`, `frontend/src/dashboard/DashboardWidgets.jsx` | Colonne mobile et déplacement tactile/clavier |

Les répertoires `node_modules`, `target`, `dist`, les rapports Playwright et les fichiers `.env` sont exclus par `.gitignore`. La clé RSA dans `backend/tests/fixtures` est une clé publique de test au sens de sa divulgation : sa partie privée est volontairement fournie pour signer des jetons de test, et n’a aucun usage de production.
