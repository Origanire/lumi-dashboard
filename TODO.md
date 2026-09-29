# To-do list du projet Lumi

État du 29 septembre 2026. `[x]` signifie implémenté et vérifié dans le périmètre décrit ; `[ ]` désigne une validation encore nécessaire. Les tests simulés ne valent pas validation OAuth réelle.

**Équipe : Milo Bousquet et Nathan Muzay, contribution commune à l’ensemble du projet. X = 2.**
Objectif du sujet : **3 services minimum et 6 widgets de services minimum**. Le code contient 4 intégrations externes, 8 widgets externes et 3 outils/démonstrations locaux, soit 11 types.

## Must have — obligatoire

### Fonctionnalités

- [x] Création de compte avec rôles personnel/employé/entreprise ; administrateur attribué hors inscription publique.
- [x] Confirmation de l’inscription par e-mail : usage unique, expiration, limitation des renvois et connexion bloquée avant confirmation.
- [x] Connexion et déconnexion ; liens de connexion et réinitialisation également disponibles.
- [x] Protection des pages privées et vérification de session côté serveur.
- [x] Gestion des abonnements aux services dans Mon compte ; préférences stockées en PostgreSQL et catalogue filtré. Les connexions fournisseurs restent distinctes des abonnements.
- [ ] Valider réellement au moins 3 services. Spotify, Gmail, Calendar et GitHub codés ; GitHub public testé réellement. Comptes OAuth déclarés prêts par l’équipe, essais Google/Spotify à consigner dans [RECETTE.md](docs/RECETTE.md).
- [ ] Valider réellement au moins 6 widgets externes. Huit implémentés ; deux GitHub vérifiés sur dépôt public, validation des six Google/Spotify restante.
- [x] Au moins un paramètre configurable pour chaque widget : titre, paramètres métier, taille et/ou fréquence.
- [x] Ajout d’un widget et configuration avant ajout.
- [x] Fréquence de rafraîchissement par instance : Spotify lecture 5–120 s, Gmail/Calendar/Spotify Top 30–3600 s, GitHub 300–3600 s. Les outils locaux et l’envoi Gmail n’effectuent pas de polling.
- [x] Modification, déplacement et suppression d’un widget ; annulation de la dernière suppression.
- [x] Plusieurs instances du même type avec des configurations différentes ; parcours Notes testé, paramètres distincts transmis aux clients des services. Résultats des instances OAuth à vérifier dans la recette fournisseur.
- [x] Rafraîchissement automatique des widgets de données ; réduction du polling quand la page est cachée pour Gmail, Calendar, GitHub et Spotify Top.
- [x] Interface responsive : parcours desktop et mobile 390 px testés sans débordement horizontal.
- [x] Dialogues natifs, libellés, états de chargement/erreur, navigation clavier et commandes de déplacement accessibles. Un audit d’accessibilité exhaustif reste hors de cette validation.

### Livraison technique

- [x] Stack Docker complète à la racine : React/Nginx, Rust, PostgreSQL et Mailpit.
- [x] Construction et démarrage depuis un clone propre : `npm run check:clean` valide le clone, les tests, les builds Docker, les migrations et les endpoints HTTP.
- [ ] Vérification finale de l’application sur `http://localhost:8080` après reconstruction.
- [x] `GET /about.json` : IP client, heure Unix, catalogue des 11 widgets et paramètres typés ; test de cohérence frontend/backend ajouté.
- [x] Présentation et scénario de démonstration préparés dans [PRESENTATION.md](docs/PRESENTATION.md). Répétition des parcours OAuth à effectuer avec les comptes de l’équipe.
- [x] Vérification finale du contenu livré et des artefacts ; bonus identifiés dans [BONUS.md](docs/BONUS.md).

### Sécurité

- [x] Mots de passe hachés avec bcrypt ; identifiants de démonstration limités au développement.
- [x] Données des dashboards rattachées au compte en PostgreSQL, contrôles de propriétaire et détection des conflits de sauvegarde.
- [x] Jetons externes en mémoire ; isolation Spotify/GitHub par session, purge des anciens stockages de jetons et protection du retour PKCE.
- [x] Autorisations et rôles vérifiés côté serveur ; tests de refus d’accès intercomptes et administrateur.
- [x] Validation des configurations côté serveur et à l’import : types autorisés, positions, tailles, limites, absence de jetons dans les paramètres.
- [x] En-têtes de sécurité, no-store API et CSP Nginx ; dix tentatives de connexion par adresse sur quinze minutes. HTTPS à configurer pour un hébergement public.
- [x] Variables d’environnement documentées et exclues du dépôt. Les Client IDs OAuth sont publics ; aucun secret ne doit être mis dans une variable `VITE_*`.

### Documentation

- [x] But de l’application et fonctionnalités principales.
- [x] Inventaire complet des services/widgets, paramètres, limites et connexions.
- [x] Technologies, organisation, architecture et schéma du README.
- [x] Installation, configuration, développement et lancement Docker documentés.
- [x] Commandes de tests unitaires, backend et navigateur documentées.
- [x] Utilisation : abonnements, dashboards multiples, sauvegarde, conflits, import/export, administration et mobile.
- [x] Documentation des nouvelles API dans Swagger et [workspace.md](backend/docs/workspace.md).

## Should have — fortement recommandé

- [x] Page de profil avec gestion des abonnements.
- [x] Administration des utilisateurs : recherche, rôles et révocation des sessions ; interdiction de modifier ses propres rôles.
- [x] Erreurs API explicites et états de chargement sur les quatre intégrations ; panne GitHub et conflit de sauvegarde vérifiés dans le navigateur.
- [x] Modification de la taille des widgets.
- [x] Sauvegarde serveur persistante des configurations et positions ; récupération sur un autre appareil au rechargement, conflits détectés.
- [x] Dashboards différents pour chaque utilisateur ; tests d’isolation en PostgreSQL.
- [x] Validation des formulaires et imports, complétée par les contrôles serveur.
- [x] Logs backend JSON : route générique, statut, durée et identifiant de requête, sans corps ni jeton.
- [x] Tests backend : authentification, confirmation, permissions, persistance, conflits, abonnements, administration, limitation des connexions et OIDC.
- [x] Tests frontend unitaires et parcours navigateur : ajout, modification, position, suppression/annulation, persistance, import/export, services, mobile et erreurs.
- [ ] Vidéo de démonstration : enregistrement final en cours, sortie prévue dans `docs/demo/lumi-demo.mp4`.
- [x] Documentation des choix d’architecture et des limites.

## Could have — bonus

- [ ] Connexion Google OIDC : code livré, signature/audience/émetteur/expiration/nonce testés ; association explicite d’un compte existant. Validation Google réelle restante.
- [x] Thèmes clair/sombre.
- [x] Glisser-déposer et redimensionnement visuel.
- [x] Export/import JSON sans jetons et avec validation.
- [x] Plusieurs dashboards par utilisateur (20 maximum).
- [x] Notifications de session : créations de dashboards et fin du minuteur Focus, 20 messages maximum.
- [x] Recherche dans les services et le catalogue de widgets.
- [x] Cache GitHub en mémoire pendant 30 secondes, isolé par jeton et vidé au changement de session.
- [x] Historique GitHub : 24 observations du nombre d’éléments dans l’aperçu chargé, limité à la session du widget.
- [x] Administration avec recherche, rôles et révocation ; contrôles serveur testés.
- [x] Mode mobile : affichage en colonne, cibles tactiles et boutons Monter/Descendre utilisables aussi au clavier.
- [x] Quotas : affichage des erreurs, pause GitHub après quota, cache et fréquences bornées ; Spotify dispose déjà d’un traitement 429/Retry-After.

## Écarts identifiés lors de la revue initiale

- [x] Ajouter GitHub à `/about.json` et au README, et tester la cohérence du catalogue.
- [x] Remplacer le polling Spotify fixé à une seconde par le paramètre de l’instance.
- [x] Corriger le texte GitHub qui annonçait une conservation du jeton après rechargement.
- [x] Renseigner les membres et l’effectif.

## Vérifications

- 35 tests frontend réussis et compilation Vite réussie.
- 20 tests backend réussis, dont validation de signatures Google et refus de réutilisation du nonce.
- 4 parcours navigateur réussis ; scénario vidéo exécuté séparément.
- Construction Docker réussie ; contrôle du clone propre et démarrage final à consigner.
- `npm audit --omit=dev` : aucune vulnérabilité signalée. Ce résultat ne constitue pas un audit de sécurité complet.
- Détails et limites : [VALIDATION.md](docs/VALIDATION.md).

## Validation nécessitant les comptes de l’équipe

Les applications OAuth sont déclarées prêtes sur `http://localhost:5174`. Gmail/Calendar peuvent utiliser cette origine. Spotify exige `http://127.0.0.1:5174/` comme retour, à autoriser chez le fournisseur. Aucun navigateur connecté aux comptes de l’équipe n’est accessible à l’agent.

Terminer les essais de [RECETTE.md](docs/RECETTE.md), puis fermer les trois cases fournisseurs ci-dessus. Aucun envoi Gmail, événement privé ou consentement externe n’est déclaré validé sans essai réel.
