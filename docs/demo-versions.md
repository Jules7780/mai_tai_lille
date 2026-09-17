# Démo des maquettes (branche `demo-versions`)

Un seul déploiement pour présenter deux versions du site aux gérants.

| Adresse | Rôle | Code |
|---|---|---|
| `/` | Page de démo : écran de chargement, les deux versions, pastille de choix | `index.html`, `selecteur/` |
| `/v1/` | Version 1, Classique : identique à `main` (9c6b0d5) | `src/` |
| `/v2/` | Version 2, Immersive : `profondeur-jungle` (fd251eb) + cocktail 3D de `maitai-3d` (c45b40e) | `src-v2/` |

## Version immersive

Base `profondeur-jungle` (feuilles en parallaxe, titres qui basculent, relief des photos, menu plié en 3D),
avec la séquence 3D du Maï Taï à la place de l'encart « Cocktail signature », juste avant le menu plié.

Différences avec `maitai-3d` pour le cocktail (`src-v2/components/Composition.tsx`) :

- la scène 3D est préparée dès l'ouverture du site, et non à l'approche de la section ;
- elle ne se dessine pas quand la version est cachée derrière l'autre (classe `cadre-masque`) ;
- la scène 3D et le compteur suivent le temps de la timeline elle-même : avant, ils restaient figés
  un peu en retard quand on arrêtait de défiler (correctif à reporter sur `maitai-3d` si besoin).

## Fonctionnement de la démo

- `index.html` + `selecteur/selecteur.ts` : ouvre `/v1/` et `/v2/` dans deux cadres plein écran superposés,
  affiche le soleil qui s'allume pendant le chargement, puis la version 1 (ou la 2 avec l'adresse `/#2`).
- `selecteur/cadre.ts`, chargé par chaque version : force le chargement immédiat des images et du plan,
  attend les polices et la scène 3D, envoie sa progression à la démo, et obéit à ses commandes
  (retour en haut, version cachée ou visible). Ouverte seule, une version fonctionne normalement.
- Changer de version remonte la version choisie en haut de page puis l'affiche : rien n'est rechargé.
- La pastille (bas à gauche, 30 % d'opacité) se masque pendant le chargement et quand le menu mobile est ouvert.

## Mise en ligne

- Commande de build `npm run build`, dossier publié `dist` (Vercel ou Netlify, sans configuration particulière).
- Ne pas ajouter de règle de réécriture de toutes les adresses vers `/index.html`.
- Les pages ont une balise `noindex` pour que la démo n'apparaisse pas dans Google : elle ne doit pas être reprise sur le site définitif.
