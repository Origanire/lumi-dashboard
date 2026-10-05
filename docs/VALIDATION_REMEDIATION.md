# Vérification des corrections de soutenance

Date : 5 octobre 2026. Résultats observés pendant la modification du dépôt, sans commit ni publication externe.

| Vérification | Résultat constaté |
| --- | --- |
| `npm run test -w frontend` | 10 fichiers de tests passent, dont les nouveaux cas météo : deux villes, 0 °C, ville absente, quota, réponse incomplète et validation d’intervalle |
| Tests Rust complets avec PostgreSQL local | 24 tests passent lors de la première suite complète ; un test supplémentaire du catalogue météo a ensuite été ajouté et validé (4 tests `about` passent) |
| `npm run poc` | Réussite : jeu de données partagé, import/export frontend, compilation React, contrat public, rejet 413, création/lecture PostgreSQL de deux météos et rejet d’un intervalle invalide |
| Build frontend de production | Réussite ; mêmes sources compilées dans l’image Docker |
| Suite Playwright complète finale | 13 tests passent ; 1 démonstration vidéo volontairement ignorée par défaut |
| Nouveaux parcours Playwright | Deux météos à valeurs simulées distinctes, panne explicite, 320/390/768 px, texte agrandi, contraste, Tab/Échap, restauration des préférences et page des données |
| Inspection visuelle | Captures dashboard et compte mobile examinées ; commandes en colonne, villes et source météo lisibles ; réglage d’accessibilité placé dans le flux pour éviter de couvrir les commandes |
| Appels Open-Meteo réels | Deux appels du client avec géocodage réussissent : Paris, Île-de-France et Lyon, Rhône-Alpes ; températures numériques, horodatage et fuseau `Europe/Paris` reçus |
| Test du proxy Docker sur 18080 | Réussite : accueil/about 200, 7 services/12 widgets, corps 413, session absente 401, quotas API/auth 429, CSP météo et version Nginx masquée |
| Chromium sur le frontend Docker | Réussite : accès réel au géocodage et aux conditions météo avec la CSP, texte agrandi actif et accueil à 390 px sans débordement |
| Images Docker | Compilation frontend et backend réussie avec les Dockerfiles du projet |
| Contrôle des différences | `git diff --check` sans erreur |

## Corrections révélées par les essais

Le premier parcours clavier pouvait envoyer le focus hors du dialogue après la dernière case. `Dialog.jsx` boucle désormais explicitement Tab et Maj+Tab entre ses contrôles ; Échap et le retour au déclencheur passent dans les nouveaux tests.

Le test existant de panne GitHub restaurait des widgets avant d’installer sa simulation. Un quota réseau réel pouvait donc remplacer le message de panne attendu. La simulation est désormais installée avant la connexion ; la suite complète finale passe.

L’essai de déploiement a détecté un doublon des en-têtes `X-Content-Type-Options`, `X-Frame-Options` et `Referrer-Policy` entre Axum et Nginx. Le proxy masque les valeurs amont puis émet une seule valeur ; l’API directe conserve ses propres protections.

## Déploiement local et portée des preuves

Le port 8080 était déjà occupé : le démarrage de la stack à ce port a échoué sans arrêter le service existant. La configuration livrée conserve bien `127.0.0.1:8080:80`. Un frontend temporaire accessible sur `http://127.0.0.1:18080` a été utilisé sur `127.0.0.1:18080` avec le backend du projet, afin de vérifier le proxy sans modifier ce port.

Le script [deployment-smoke.mjs](../poc/deployment-smoke.mjs) vérifie, sur une origine locale uniquement : accueil public, CSP météo, version Nginx masquée, contrat `about.json`, rejet 413, route privée 401 et limitations 429 API/authentification. Il déclenche des rafales de GET sans création de compte ni modification de dashboard. Attendre le renouvellement des quotas ou redémarrer le proxy de test avant de le rejouer immédiatement.

```bash
node poc/deployment-smoke.mjs http://127.0.0.1:8080
```

Les tests frontend et fournisseur Playwright utilisent des réponses simulées ; le POC SQL utilise PostgreSQL réel avec bases isolées. Les appels Open-Meteo réels vérifient le client et le fournisseur au moment de l’essai, sans garantir leur disponibilité future. Les températures ne sont pas copiées dans le code.

Les consentements OAuth réels, les mails reçus par une boîte externe, l’appel OpenAI payant, les tests de charge et les audits complets d’accessibilité/sécurité ne sont pas déclarés validés par ces travaux. La recette correspondante reste dans [RECETTE.md](RECETTE.md).

## Complément sur les doublons

Après la correction de la comparaison des textes, les tests frontend et le build de production passent. Le parcours navigateur dédié passe : doublons insensibles à la casse bloqués à la création/modification et édition du widget lui-même autorisée. Il a été exécuté avec un serveur frontend isolé sur 5185 et des API simulées, car le port backend habituel était occupé.


## Complément sur OpenAI

Le lecteur dotenvy a confirmé qu’une ligne `MAIL_FROM` mal formée interrompait le chargement avant `OPENAI_API_KEY`. Après correction, le fichier se charge entièrement et la clé est présente, sans affichage de sa valeur. Les identifiants SMTP ont été conservés commentés pour le mode Mailpit local, puis les serveurs de développement ont été relancés.

Les tests dédiés vérifient la syntaxe du modèle `.env.example`, le refus d’un fichier mal formé sans fuite de valeurs et la distinction entre crédit épuisé, limites de dépenses et limitation temporaire. L’appel OpenAI de diagnostic réel a reçu HTTP 429 / `credit_balance_exhausted` ; aucune réponse générée n’est donc déclarée validée et aucun crédit n’a été acheté.
