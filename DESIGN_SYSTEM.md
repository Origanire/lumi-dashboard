# Design system — Lumi

## Principes

L’interface associe la clarté fonctionnelle de Notion, la rigueur graphique de Nothing et une hiérarchie éditoriale premium. Les références servent de principes et ne sont pas reproduites littéralement.

Priorités : lisibilité, hiérarchie, simplicité, identité, puis animation.

## Palette

| Rôle | Couleur | Usage |
|---|---|---|
| Noir principal | `#111111` | Titres, boutons principaux, sections fortes |
| Anthracite | `#242424` | Surfaces secondaires sur fond noir |
| Blanc | `#FFFFFF` | Cards fonctionnelles et texte sur noir |
| Blanc cassé | `#F7F7F5` | Fond principal |
| Gris clair | `#EEEEEB` | Sections secondaires |
| Gris moyen | `#8B8B87` | Métadonnées uniquement |
| Gris texte | `#5F5F5C` | Paragraphes secondaires |
| Accent rouge | `#D3392F` | État ponctuel ou détail de marque |

Le blanc cassé domine les pages. Le noir structure la lecture par des titres, des actions et une section pleine largeur. L’accent rouge reste inférieur à 5 % de la surface visible et ne sert jamais à décorer de grandes zones.

## Typographies

- Police principale : `Inter`, puis les polices système sans-serif, pour le corps et les contrôles.
- Police d'affichage : `Anton`, réservée aux grands titres éditoriaux.
- Police identitaire : `Nothing 5x7`, réservée au logotype, aux numéros et aux micro-détails.
- H1 : 58–92 px, graisse 650, interligne 0,97.
- H2 : 42–66 px, graisse 620, interligne 1,04.
- H3 : 22–25 px, graisse 580.
- Introduction : 18 px, interligne 1,65.
- Corps : 13–16 px, interligne 1,65–1,75.
- Microtexte : 9–11 px, jamais en paragraphes longs.

## Espacement et grille

La largeur utile maximale est de 1196 px. La grille principale utilise deux colonnes avec des espaces de 60 à 130 px. Les grandes sections ont 90 à 150 px de marge verticale. L’échelle courante est : 8, 12, 20, 28, 42, 60, 90 et 150 px.

## Formes

- Boutons et champs : rayon de 5 px.
- Cards principales : rayon de 8 px.
- Badges : rayon de 4 px.
- Bordures : `1px solid #E2E2DD`, seulement lorsqu’elles améliorent la lecture.
- Ombres : diffuses et très faibles, réservées aux éléments fonctionnels au premier plan.

## Composants

### Boutons

Le bouton principal est noir avec un libellé blanc, une hauteur minimale de 48 px et un déplacement vertical de 2 px au survol. Sur une section noire, il devient blanc avec un libellé noir. Une action secondaire prend la forme d’un lien souligné finement.

### Cards

Une card regroupe une seule fonction ou un seul message. Elle dispose d’au moins 28 px de padding sur ordinateur et évite d’imbriquer plusieurs autres cards. Une card éditoriale peut se passer de bordure si sa surface contraste avec la section.

### Navigation

La navigation principale reste horizontale, courte et sans fond distinct. Le logotype occupe la gauche, trois destinations maximum se trouvent au centre, et un état produit discret se place à droite. Sur mobile, les liens secondaires sont masqués jusqu’à l’arrivée du futur menu.

## Animations

- Interaction : 250 ms avec une courbe douce.
- Apparition initiale : 650 ms, fondu et déplacement vertical de 14 px.
- Aucun mouvement permanent.
- Aucun effet dépendant de la souris.
- `prefers-reduced-motion` désactive le défilement fluide et les apparitions.

## Sections de référence

### Hero

Grand message de deux lignes, introduction courte, une action principale, une action secondaire et un seul visuel de produit. Le visuel occupe environ 45 % de la largeur.

### Features

Une introduction éditoriale accompagne une grande démonstration fonctionnelle. Les fonctionnalités suivantes sont présentées en trois colonnes séparées par des traits fins, sans accumulation de cards.

### CTA

Une section noire pleine largeur contient un seul message, une explication et un bouton blanc. Le contraste crée le changement de rythme.

### Footer

Trois colonnes : identité, promesse courte et métadonnées. Le fond gris clair sépare le footer sans produire un second dark mode.
