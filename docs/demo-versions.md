# Démo des trois maquettes (branche `demo-versions`)

Un seul déploiement regroupe les trois versions du site, pour les présenter aux gérants.

| Adresse | Version | Branche d'origine | Code |
|---|---|---|---|
| `/` | 1, Épurée | `main` (9c6b0d5) | `src/` |
| `/v2/` | 2, Feuilles et relief | `profondeur-jungle` (fd251eb) | `src-v2/` |
| `/v3/` | 3, Cocktail en 3D | `maitai-3d` (c45b40e) | `src-v3/` |

Chaque dossier est une copie exacte du `src/` de sa branche : les versions ne partagent aucun code et ne peuvent pas se perturber.

## Sélecteur de version

- Pastille ronde discrète en bas à gauche (30 % d'opacité), qui ouvre un panneau avec les trois versions.
- Code dans `selecteur/`, sans React, chargé par les trois `index.html` (`index.html`, `v2/index.html`, `v3/index.html`).
- La version courante vient de l'attribut `data-version` de la balise `<html>`.
- Changer de version ouvre la nouvelle page en haut.
- La pastille se masque quand le menu mobile est ouvert.

## Mettre une version à jour depuis sa branche

Exemple pour la version 3 :

```bash
rm -rf src-v3 && mkdir -p tmp && git archive maitai-3d src | tar -x -C tmp && mv tmp/src src-v3 && rm -rf tmp
```

Penser aussi aux fichiers hors `src` (images de `public/`, dépendances de `package.json`).

## Mise en ligne

- Commande de build `npm run build`, dossier publié `dist` (Vercel ou Netlify, sans configuration particulière).
- Ne pas ajouter de règle de réécriture de toutes les adresses vers `/index.html`.
- Les trois pages ont une balise `noindex` pour que la démo n'apparaisse pas dans Google : elle ne doit pas être reprise sur le site définitif.
