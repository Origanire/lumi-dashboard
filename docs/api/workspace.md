# API des dashboards, services et utilisateurs

Toutes les routes ci-dessous exigent `Authorization: Bearer <session Lumi>`, sauf `/about.json` et l’initialisation/connexion Google. Les routes figurent aussi dans `/api/docs`.

| Méthode | Route | Usage |
| --- | --- | --- |
| GET | `/api/dashboards` | Dashboards de l’utilisateur connecté |
| POST | `/api/dashboards` | Création avec `{name, widgets}` ; 201 |
| PUT | `/api/dashboards/{id}` | Sauvegarde avec `{name, widgets, revision}` ; 409 si version obsolète ou objet inaccessible |
| DELETE | `/api/dashboards/{id}` | Suppression dans le périmètre utilisateur ; 204 |
| GET | `/api/services` | Identifiants des abonnements du compte |
| PUT / DELETE | `/api/services/{service}` | Activation/désactivation ; 204 |
| GET | `/api/admin/users` | Liste des 500 premiers utilisateurs, admin uniquement |
| PUT | `/api/admin/users/{id}/roles` | `{roles:["perso",...]}` ; admin uniquement, interdiction de modifier ses propres rôles |
| DELETE | `/api/admin/users/{id}/sessions` | Révocation, admin uniquement |
| POST | `/api/auth/google/challenge` | Client ID et nonce à usage unique |
| POST | `/api/auth/google/login` | `{credential: <ID token Google>}` ; session Lumi |
| POST | `/api/auth/google/link` | Association explicite au compte connecté, même adresse requise |

Un dashboard contient au maximum 100 widgets et un compte 20 dashboards. Les paramètres sont limités à une liste autorisée par type, les positions et valeurs numériques sont validées. Aucun jeton fournisseur n’est accepté dans les paramètres. Les changements de rôle suppriment les sessions associées par la contrainte de clé étrangère.

La révision commence à zéro et augmente à chaque sauvegarde. Le client conserve ses modifications lors d’un conflit et propose export ou rechargement ; il ne force pas de remplacement. Les suppressions sont définitives et l’interface les confirme.
