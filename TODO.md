# To-do list du projet Lumi

Cocher une tâche lorsqu'elle est terminée et vérifiée.

**X = nombre de membres du groupe : [à compléter].**
Le projet doit proposer au minimum **1 + X services** et **3 × X widgets au total**.

## Must have — obligatoire

### Fonctionnalités

- [ ] Création de compte.
- [ ] Confirmation de l'inscription.
- [x] Connexion et déconnexion.
- [x] Protection des pages accessibles uniquement aux utilisateurs connectés.
- [ ] Gestion des services auxquels l'utilisateur est abonné.
- [ ] Au moins 1 + X services.
- [ ] Au moins 3 × X widgets au total.
- [ ] Au moins un paramètre configurable pour chaque widget.
- [ ] Ajout d'un widget au dashboard.
- [ ] Configuration d'un widget avant son ajout.
- [ ] Définition de la fréquence de rafraîchissement d'un widget.
- [ ] Modification d'un widget existant.
- [ ] Déplacement d'un widget.
- [ ] Suppression d'un widget.
- [ ] Plusieurs instances du même widget avec des configurations différentes.
- [ ] Rafraîchissement automatique des données.
- [ ] Interface responsive.
- [ ] Interface compréhensible et accessible.

### Sécurité

- [x] Ne jamais stocker les mots de passe en clair.
- [ ] Protéger les données personnelles.
- [ ] Protéger les tokens OAuth et les identifiants externes.
- [ ] Associer chaque donnée à l'utilisateur connecté.
- [x] Vérifier côté backend que l'utilisateur a le droit d'accéder à une ressource.
- [x] Ne jamais faire confiance uniquement aux contrôles du frontend.
- [ ] Prévoir un système de variables d'environnement pour les secrets.

### Documentation — contenu du README

- [ ] Expliquer le but de l'application.
- [ ] Présenter les fonctionnalités principales.
- [ ] Décrire les services et widgets disponibles.
- [ ] Indiquer les technologies utilisées.
- [ ] Expliquer l'organisation générale du projet.
- [ ] Documenter l'installation.
- [ ] Documenter la configuration.
- [ ] Documenter le lancement en développement.
- [ ] Documenter le lancement en production.
- [ ] Documenter l'exécution des tests.
- [ ] Expliquer l'utilisation de l'application.

## Should have — fortement recommandé

- [ ] Une page de profil pour gérer les abonnements aux services.
- [ ] Une interface d'administration des utilisateurs.
- [ ] Une gestion claire des erreurs d'API.
- [ ] Des états de chargement pour les widgets.
- [ ] Un affichage explicite lorsqu'un service externe est indisponible.
- [ ] Une option pour modifier la taille des widgets.
- [ ] Une sauvegarde persistante de la position des widgets.
- [ ] Un dashboard différent pour chaque utilisateur.
- [ ] Une validation complète des formulaires.
- [ ] Un système de logs côté backend.
- [ ] Des tests backend pour l'authentification et les permissions.
- [ ] Des tests frontend pour les actions principales.
- [ ] Une démonstration vidéo de quelques minutes.
- [ ] Une documentation des choix d'architecture avec un schéma simple.

## Could have — bonus possibles

- [ ] Connexion avec Google, GitHub ou un autre fournisseur OIDC.
- [ ] Thèmes clair et sombre.
- [ ] Réorganisation des widgets par glisser-déposer.
- [ ] Redimensionnement visuel des widgets.
- [ ] Export et import d'un dashboard.
- [ ] Plusieurs dashboards par utilisateur.
- [ ] Notifications.
- [ ] Recherche dans les services et widgets.
- [ ] Cache des données externes.
- [ ] Historique des valeurs pour les widgets statistiques.
- [ ] Interface d'administration plus complète.
- [ ] Mode mobile avancé.
- [ ] Gestion de quotas et de limites d'API.
