# To-do list du projet Lumi

État revu le 19 septembre 2026 à partir du sujet PDF, du code et des vérifications effectuées en session.

`[x]` : réalisé dans le périmètre indiqué. `[ ]` : absent ou encore partiel ; les réserves sont précisées sur la ligne. Une interface de widget présente ne suffit pas à valider un service connecté.

Le classement des fonctionnalités obligatoires suit le PDF. Les sections suivantes regroupent les travaux de qualité et les extensions ; elles ne constituent pas toutes des exigences explicites du sujet.

**X = nombre de membres du groupe : [à compléter].**
Le projet doit proposer au minimum **1 + X services** et **3 × X widgets au total**.

## Must have — obligatoire

### Fonctionnalités

- [x] Création de compte. Inscription publique personnel/employé/entreprise ; administrateur attribué hors formulaire.
- [ ] Confirmation de l'inscription. À développer : le compte peut actuellement se connecter immédiatement après inscription.
- [x] Connexion et déconnexion.
- [x] Protection des pages accessibles uniquement aux utilisateurs connectés. Session vérifiée via `/api/auth/me` ; routes privées protégées côté serveur.
- [ ] Gestion des services auxquels l'utilisateur est abonné. Pas encore de catalogue ni de gestion des abonnements depuis le compte.
- [ ] Au moins 1 + X services. Effectif à renseigner ; Spotify est la seule intégration externe codée, encore à valider de bout en bout.
- [ ] Au moins 3 × X widgets au total. Six types dans le catalogue UI ; météo/agenda sont des exemples ou saisies locales, Notes/Focus des outils locaux. Ne pas les compter comme six widgets connectés validés.
- [x] Au moins un paramètre configurable pour chaque widget. Paramètres présents pour les six types actuels ; ne valide pas leur source de données.
- [x] Ajout d'un widget au dashboard.
- [x] Configuration d'un widget avant son ajout.
- [ ] Définition de la fréquence de rafraîchissement d'un widget. Partiel : configurable pour Spotify lecture en cours uniquement.
- [x] Modification d'un widget existant.
- [x] Déplacement d'un widget.
- [x] Suppression d'un widget.
- [ ] Plusieurs instances du même widget avec des configurations différentes. Pris en charge dans le dashboard ; validation des données distinctes à terminer pour chaque service réel.
- [ ] Rafraîchissement automatique des données. Partiel : lecture Spotify actualisée périodiquement ; pas de mécanisme généralisé ni de timer pour Spotify Top Titres.
- [x] Interface responsive. Affichage desktop/mobile sans débordement vérifié.
- [x] Interface compréhensible et accessible. Parcours principaux vérifiés au clavier, dialogues natifs et focus visibles ; poursuivre les contrôles pour les futures fonctionnalités.

### Livraison technique — obligatoire dans le PDF

- [ ] Livrer `docker-compose.yml` à la racine pour construire et lancer l’application complète. `compose.yaml` ne lance actuellement que PostgreSQL.
- [ ] Vérifier `docker-compose build` et `docker-compose up` depuis un clone vierge.
- [ ] Exposer l’application sur `http://localhost:8080`.
- [ ] Implémenter `GET /about.json` : IP du client, heure Unix du serveur et catalogue des services/widgets avec paramètres de type `integer` ou `string`.
- [ ] Préparer la présentation et une démonstration des fonctionnalités obligatoires.
- [ ] Vérifier le contenu livré : sources et ressources nécessaires, sans fichiers temporaires ni artefacts de compilation ; fichiers de bonus identifiés selon le sujet.

### Sécurité

- [x] Ne jamais stocker les mots de passe en clair. Hashes bcrypt en base ; les identifiants publics du README sont uniquement des comptes de test locaux.
- [ ] Protéger les données personnelles. Authentification en place ; connexions aux services et données du dashboard à finaliser.
- [ ] Protéger les tokens OAuth et les identifiants externes. Spotify utilise un stockage navigateur commun, à isoler par compte et à sécuriser.
- [ ] Associer chaque donnée à l'utilisateur connecté. Comptes/sessions en base et dashboards locaux isolés ; session Spotify encore commune au navigateur.
- [x] Vérifier côté backend que l'utilisateur a le droit d'accéder à une ressource.
- [x] Ne jamais faire confiance uniquement aux contrôles du frontend.
- [x] Prévoir un système de variables d'environnement pour les secrets. `.env` chargé côté backend ; modèle de configuration incomplet, voir documentation.

### Documentation — contenu du README

- [x] Expliquer le but de l'application.
- [x] Présenter les fonctionnalités principales.
- [ ] Décrire les services et widgets disponibles. Présentation partielle ; ajouter un inventaire clair avec paramètres, connexions et limites.
- [x] Indiquer les technologies utilisées.
- [x] Expliquer l'organisation générale du projet.
- [ ] Documenter l'installation. Instructions présentes, mais parcours de clone vierge à corriger et vérifier.
- [ ] Documenter la configuration. `DATABASE_URL` manque dans `.env.example` ; configuration des services à compléter.
- [x] Documenter le lancement en développement.
- [ ] Documenter le lancement en production. Commandes locales décrites ; lancement Docker complet obligatoire non livré.
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
- [x] Des tests backend pour l'authentification et les permissions. Cinq tests automatisés validés, avec bases SQLx isolées.
- [ ] Des tests frontend pour les actions principales. Parcours Playwright exécutés en session ; suite reproductible non intégrée au dépôt.
- [ ] Une démonstration vidéo de quelques minutes.
- [ ] Une documentation des choix d'architecture avec un schéma simple.

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

1. Préciser le parcours e-mail souhaité, puis implémenter et tester la confirmation d’inscription et/ou le parcours de connexion retenu. Ne cocher la confirmation exigée par le PDF que lorsqu’elle est effective.
2. Livrer le lancement Docker complet, le port 8080 et `/about.json`.
3. Persister les dashboards et rattacher les connexions aux services aux utilisateurs.
4. Atteindre le nombre requis de services et widgets réels, puis généraliser le rafraîchissement par instance.
5. Finaliser les tests reproductibles, le README et la démonstration.
