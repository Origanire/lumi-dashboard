# Design system — Lumi

Direction proche de Nothing : palette monochrome, typographie en matrice de points pour l'identité et certains repères, boutons sobres, traits fins et angles peu arrondis. Le mode nuit s'inspire du contraste de SpaceX : fond noir profond, texte blanc et surfaces anthracite.

## Thèmes

| Usage | Jour | Nuit |
| --- | --- | --- |
| Fond | `#F5F5F5` | `#000000` |
| Surface | `#FFFFFF` | `#0B0B0B` |
| Surface secondaire | `#EAEAEA` | `#171717` |
| Texte | `#121212` | `#F4F4F4` |
| Texte secondaire | `#626262` | `#A1A1A1` |
| Bordures | `#D9D9D9` | `#282828` |

Les couleurs sont définies par variables CSS et partagées par les widgets, dialogues, formulaires et états interactifs. Le rouge est réservé aux erreurs et aux actions destructrices. Les images de services externes conservent leurs couleurs.

Le bouton **Jour / Nuit** est disponible dans la barre supérieure, sur l'accueil et après connexion. Le choix est conservé dans `localStorage` sous `lumi_theme`, appliqué avant le premier affichage et synchronisé entre onglets. Sans choix explicite, le thème suit la préférence du système. Si le stockage est indisponible, le bouton reste fonctionnel pour la page courante.

## Typographie et composition

- Police système pour le texte courant, les formulaires et les contrôles.
- Police locale **Nothing 5x7** pour le logo, la seconde ligne du titre d'accueil, les métadonnées et les grands chiffres.
- Titres d'accueil en capitales ; chiffres et petits détails évoquant un instrument de mesure.
- Rayons de 2–3 px et bordures fines. Les titres et les notes restent lisibles dans les deux thèmes.

La navigation du dashboard est **horizontale, en haut** : logo, tableau de bord, compte, thème et déconnexion. Elle reste visible au défilement. Sur mobile, elle se répartit sur deux lignes et les widgets s'affichent dans une colonne sans débordement horizontal.

## Interactions conservées

La connexion demande uniquement l'e-mail et le mot de passe. Le profil est choisi à l'inscription. Les fenêtres utilisent un dialogue natif avec fermeture par Échap et restauration du focus. Les onglets répondent aux flèches, à Début et à Fin.

Les notes sont éditables directement. Le minuteur peut être démarré, mis en pause et réinitialisé. **Organiser** active le déplacement par l'en-tête et le redimensionnement sur ordinateur. **Modifier** propose également les champs de taille et de position. La dernière suppression peut être annulée.

La disposition et les notes sont sauvegardées localement, par compte. Les contenus d'exemple sont distingués des services synchronisés. Les animations respectent `prefers-reduced-motion`.
