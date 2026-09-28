# To-do list du projet Lumi

État revu le 28 septembre 2026 à partir du sujet PDF, du code et des vérifications effectuées en session.

`[x]` : réalisé dans le périmètre indiqué. `[ ]` : absent ou encore partiel ; les réserves sont précisées sur la ligne. Une interface de widget présente ne suffit pas à valider un service connecté.

Le classement des fonctionnalités obligatoires suit le PDF. Les sections suivantes regroupent les travaux de qualité et les extensions ; elles ne constituent pas toutes des exigences explicites du sujet.

**X = nombre de membres du groupe : [à compléter].**
Le projet doit proposer au minimum **1 + X services** et **3 × X widgets au total**.

## Must have — obligatoire

### Fonctionnalités

- [x] Création de compte. Inscription publique personnel/employé/entreprise ; administrateur attribué hors formulaire.
- [x] Confirmation de l’inscription. Lien à usage unique par e-mail, expiration et limitation des renvois ; connexion bloquée avant confirmation. Tests backend présents.
- [x] Connexion et déconnexion.
- [x] Protection des pages accessibles uniquement aux utilisateurs connectés. Session vérifiée via `/api/auth/me` ; routes privées protégées côté serveur.
- [ ] Gestion des services auxquels l'utilisateur est abonné. Pas encore de catalogue ni de gestion des abonnements depuis le compte.
- [ ] Au moins 1 + X services. Effectif à renseigner ; Spotify, Gmail et Google Calendar sont codés, encore à valider de bout en bout avec les fournisseurs.
- [ ] Au moins 3 × X widgets au total. Neuf types dans le catalogue UI : six intégrations de widgets Spotify/Gmail/Calendar, météo de démonstration et Notes/Focus locaux. Validation OAuth réelle restante.
- [x] Au moins un paramètre configurable pour chaque widget. Paramètres présents pour les neuf types actuels ; ne valide pas leur source de données.
- [x] Ajout d'un widget au dashboard.
- [x] Configuration d'un widget avant son ajout.
- [ ] Définition de la fréquence de rafraîchissement d'un widget. Partiel : configurable pour Spotify lecture en cours uniquement.
- [x] Modification d'un widget existant.
- [x] Déplacement d'un widget.
- [x] Suppression d'un widget.
- [ ] Plusieurs instances du même widget avec des configurations différentes. Pris en charge dans le dashboard ; validation des données distinctes à terminer pour chaque service réel.
- [ ] Rafraîchissement automatique des données. Partiel : lecture Spotify et Gmail actualisés périodiquement ; pas de mécanisme généralisé ni de timer pour Spotify Top Titres.
- [x] Interface responsive. Affichage desktop/mobile sans débordement vérifié.
- [x] Interface compréhensible et accessible. Parcours principaux vérifiés au clavier, dialogues natifs et focus visibles ; poursuivre les contrôles pour les futures fonctionnalités.

### Livraison technique — obligatoire dans le PDF

- [x] Livrer `docker-compose.yml` à la racine pour construire et lancer l’application complète. React/Nginx, Rust, PostgreSQL et Mailpit ; images construites et stack démarrée.
- [ ] Vérifier `docker-compose build` et `docker-compose up` depuis un clone vierge. `docker compose build` et `up -d --wait` validés dans le workspace ; clone vierge encore à tester.
- [x] Exposer l’application sur `http://localhost:8080`. Frontend, route SPA `/dashboard` et API vérifiés par HTTP.
- [x] Implémenter `GET /about.json` : IP du client, heure Unix du serveur et catalogue des services/widgets avec paramètres de type `integer` ou `string`. Test automatisé et appel via Nginx validés ; Docker Desktop peut présenter l’IP de sa passerelle NAT.
- [ ] Préparer la présentation et une démonstration des fonctionnalités obligatoires.
- [ ] Vérifier le contenu livré : sources et ressources nécessaires, sans fichiers temporaires ni artefacts de compilation ; fichiers de bonus identifiés selon le sujet.

### Sécurité

- [x] Ne jamais stocker les mots de passe en clair. Hashes bcrypt en base ; les identifiants publics du README sont uniquement des comptes de test locaux.
- [ ] Protéger les données personnelles. En-têtes anti-framing, nosniff, no-referrer et no-store API en place ; jetons externes en mémoire. Dashboards locaux et durcissement global (CSP, limitation des tentatives de connexion) à finaliser.
- [ ] Protéger les tokens OAuth et les identifiants externes. Spotify et GitHub conservent désormais leurs jetons uniquement en mémoire, liés à la session Lumi ; anciens stockages purgés. OAuth Spotify lié à la session initiatrice et URLs sortantes restreintes. Validation OAuth réelle et protection XSS complète restantes.
- [ ] Associer chaque donnée à l'utilisateur connecté. Comptes/sessions en base et dashboards locaux isolés ; jetons Spotify/GitHub isolés par session ; persistance serveur des dashboards encore à réaliser.
- [x] Vérifier côté backend que l'utilisateur a le droit d'accéder à une ressource.
- [x] Ne jamais faire confiance uniquement aux contrôles du frontend.
- [x] Prévoir un système de variables d'environnement pour les secrets. `.env` chargé côté backend ; modèle de configuration incomplet, voir documentation.

### Documentation — contenu du README

- [x] Expliquer le but de l'application.
- [x] Présenter les fonctionnalités principales.
- [x] Décrire les services et widgets disponibles. Inventaire, paramètres, connexions et limites dans le README.
- [x] Indiquer les technologies utilisées.
- [x] Expliquer l'organisation générale du projet.
- [ ] Documenter l'installation. Instructions présentes, mais parcours de clone vierge à corriger et vérifier.
- [x] Documenter la configuration. PostgreSQL, SMTP, origine Docker et identifiants OAuth documentés ; guide Gmail corrigé pour le `.env` racine.
- [x] Documenter le lancement en développement.
- [x] Documenter le lancement en production. Construction et lancement Docker complets documentés ; SMTP réel et HTTPS à configurer pour un hébergement public.
- [x] Documenter l'exécution des tests.
- [x] Expliquer l'utilisation de l'application.

## Should have — fortement recommandé

- [ ] Une page de profil pour gérer les abonnements aux services. « Mon compte » affiche les informations, sans gestion des abonnements.
- [ ] Une interface d'administration des utilisateurs. Rôle admin présent, sans interface de gestion.
- [ ] Une gestion claire des erreurs d'API. Authentification et Spotify partiellement couverts ; à homogénéiser avec les services réels.
- [ ] Des états de chargement pour les widgets. Présents sur Spotify ; à généraliser aux autres services.
- [ ] Un affichage explicite lorsqu'un service externe est indisponible. Partiellement présent sur Spotify, non validé pour tous les services.
- [x] Une option pour modifier la taille des widgets.
- [ ] Une sauvegarde persistante de la position des widgets. Sauvegarde locale fonctionnelle ; persistance serveur et synchronisation entre appareils à réaliser.
- [ ] Un dashboard différent pour chaque utilisateur. Isolation locale par identifiant utilisateur fonctionnelle ; stockage serveur à réaliser.
- [ ] Une validation complète des formulaires. Validations auth côté serveur et champs widget présents ; contrôle complet des paramètres de services à terminer.
- [ ] Un système de logs côté backend. Quelques messages console ; pas de journalisation structurée.
- [x] Des tests backend pour l'authentification et les permissions. 12 tests comptes et parcours e-mail passent, avec bases SQLx isolées ; un test supplémentaire couvre `/about.json`.
- [ ] Des tests frontend pour les actions principales. 23 tests unitaires Calendar, Gmail et tailles passent ; script corrigé pour inclure .test.mjs. Suite de parcours navigateur à intégrer.
- [ ] Une démonstration vidéo de quelques minutes.
- [x] Une documentation des choix d’architecture avec un schéma simple dans le README.

## Could have — bonus possibles

- [ ] Connexion avec Google, GitHub ou un autre fournisseur OIDC.
- [x] Thèmes clair et sombre. Préférence mémorisée, système et synchronisation entre onglets vérifiés.
- [x] Réorganisation des widgets par glisser-déposer.
- [x] Redimensionnement visuel des widgets.
- [ ] Export et import d'un dashboard.
- [ ] Plusieurs dashboards par utilisateur.
- [ ] Notifications.
- [ ] Recherche dans les services et widgets.
- [ ] Cache des données externes.
- [ ] Historique des valeurs pour les widgets statistiques.
- [ ] Interface d'administration plus complète.
- [ ] Mode mobile avancé.
- [ ] Gestion de quotas et de limites d'API.

## Ordre de travail retenu

1. Confirmation e-mail implémentée et tests de non-régression validés.
2. Docker complet, port 8080 et `/about.json` livrés et vérifiés dans le workspace ; reproduire depuis un clone vierge.
3. Persister les dashboards et rattacher les connexions aux services aux utilisateurs.
4. Atteindre le nombre requis de services et widgets réels, puis généraliser le rafraîchissement par instance.
5. Finaliser les tests reproductibles, le README et la démonstration.

## Vérifications du 28 septembre 2026

- `npm run test -w frontend` : 23 tests réussis.
- `npm run build -w frontend` : réussi.
- `cargo test --manifest-path backend/Cargo.toml` : 13 tests réussis.
- `docker compose build` et `docker compose up -d --wait` : réussis.
- HTTP : `/dashboard`, `/api/health` et `/about.json` répondent sur le port 8080.
- `cargo fmt` indisponible : composant rustfmt absent de la toolchain locale.
- Les validations OAuth réelles, l’effectif du groupe, la persistance serveur, les abonnements, les rafraîchissements généralisés et la démonstration restent ouverts ; aucune validation fournisseur n’est déduite des tests unitaires.

### Sécurité — vérifications complémentaires

- 31 tests frontend réussis, dont isolation des jetons Spotify/GitHub, suppression du stockage historique et refus des URLs Spotify externes.
- Compilation frontend réussie. Les essais OAuth avec fournisseurs réels restent à effectuer.
