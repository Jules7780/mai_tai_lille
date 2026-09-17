# Propositions d'effets 3D / scrollytelling

Pistes proposées le 17/09/2026 pour la refonte du site Maï-Taï.

- **Proposition 1** « Allumage du néon » : réalisée sur la branche `refonte-effets-3d`.
- **Proposition 2** « Le Maï Taï se compose » : réalisée sur la branche `maitai-se-compose` (créée à partir de `main`), en SVG.
  - **Version 3D réaliste** : branche `maitai-3d` (créée à partir de `maitai-se-compose`), en Three.js temps réel, avec glaçons.
- **Proposition 3** « Profondeur jungle » : réalisée sur la branche `profondeur-jungle` (créée à partir de `main`).
- **À explorer plus tard** : la proposition 4, décrite ci-dessous.

Règles communes à toutes les pistes :

- **Animations réduites** : si le visiteur a activé « réduire les animations » dans son système, le site s'affiche sans effets, dans une version statique propre.
- **Référencement** : le texte reste dans le HTML, il est lisible par Google et par les lecteurs d'écran.
- **Mobile** : chaque piste a une version pensée pour mobile, pas seulement réduite.
- **Données réelles** : aucune donnée inventée, les contenus viennent de `src/data/infos.ts` et de l'article actu.fr du 28/08/2026.

---

## 1. Allumage du néon (retenue)

La section d'accueil reste épinglée pendant le scroll.

1. **Au chargement** : le soleil et le titre « MAÏ-TAÏ » sont des tubes néon éteints, et la photo de l'enseigne est plongée dans le noir.
2. **Les tubes se dessinent** : le soleil se trace rayon par rayon, puis le visage. Les lettres du titre s'allument une à une.
3. **L'allumage** : l'enseigne grésille puis s'allume, et le dessin cède la place à la vraie photo.
4. **La traversée** : on zoome dans le centre du soleil. Un cercle s'ouvre depuis son visage et révèle l'intérieur du bar en plein écran.
5. **Les trois étapes** : « 24 rue Royale », « Deux amis » et « Jaruwan en cuisine » défilent sur les photos du bar.

- **Outils** : GSAP + ScrollTrigger + Lenis (défilement doux).
- **Reste du site** : petits effets de relief, comme l'inclinaison des photos au survol.

---

## 2. Le Maï Taï se compose (réalisée, branche `maitai-se-compose`)

**Idée** : un scrollytelling centré sur le cocktail signature, qui a donné son nom au bar.

### Déroulé

- **Emplacement** : une section épinglée dans la partie « La carte », à la place ou juste avant le bloc « Cocktail signature » actuel.
- **Le verre** : au centre, un verre dessiné en SVG avec du relief (reflets, épaisseur du verre, ombre portée, légère rotation 3D en CSS `perspective`).
- **Le remplissage** : au scroll, le verre se remplit couche par couche, dans l'ordre de la recette réelle.
  1. Rhum ambré
  2. Rhum blanc
  3. Whisky
  4. Triple sec
  5. Citron vert
  6. Ananas
  7. Orange
  8. Cranberry
  9. Grenadine
  10. Sucre de canne
- **Les étiquettes** : à chaque couche, le nom de l'ingrédient apparaît à côté du verre, relié par un trait fin. Elles s'empilent en colonne sur desktop, et une seule s'affiche à la fois sur mobile, sous le verre.
- **Les couleurs** : chaque couche a sa teinte (ambré, translucide, doré, orangé, rouge cranberry, grenadine qui descend au fond en dégradé). Le mélange final prend une couleur ambre-orangé.
- **La fin** :
  - Une tranche d'ananas et une paille se posent sur le verre.
  - Le nom « MAÏ TAÏ » s'allume en néon avec le prix « 12 € ».
  - Une phrase courte reprend un fait sourcé : Steven a appris à le préparer lors d'un voyage en Thaïlande.
- **Pendant le scroll** : bulles et reflets animés en boucle légère, le verre tourne de quelques degrés.

### Technique

- GSAP ScrollTrigger avec une timeline scrubbée et la section épinglée (environ 250vh sur desktop, 200vh sur mobile).
- Verre et couches en SVG inline :
  - chaque couche est un `rect` ou un `path` découpé par un `clipPath` en forme de verre ;
  - la hauteur de chaque couche est animée ;
  - le reflet est un dégradé blanc semi-transparent.
- Légère 3D en CSS : `rotateY` du verre lié à la progression, ombre elliptique au sol qui s'étire.
- Version statique : verre plein, liste complète des ingrédients sous forme de pastilles (comme la version actuelle).
- Poids ajouté : environ 45 Ko compressés (GSAP + ScrollTrigger), déjà présents si la piste 1 est en place.
- Effort : moyen.

### Version 3D réaliste (branche `maitai-3d`)

- **Rendu** : scène Three.js temps réel, chargée à la demande (environ 150 Ko compressés) quand la section approche.
- **Verre** : tumbler en révolution avec matériau physique (transmission, réfraction, vernis), condensation en carte de normales, bord arrondi et fond épais.
- **Liquide** : shader maison, couches aux transitions organiques, absorption selon l'épaisseur traversée, ménisque, ondes au point d'impact, bulles, glaçons et paille visibles à travers le liquide.
- **Séquence** : filet versé de la couleur de chaque ingrédient, grenadine qui plonge en filaments et se dépose, tourbillon qui fond les couches en dégradé.
- **Mise en scène** : glaçons (à valider avec les gérants), paille en bambou, quartier d'ananas posé sur le bord, comptoir en bois clair, reflets d'un environnement de bar (softbox chaude, néon vert).
- **Synchronisation** : état de la scène calculé par une fonction pure du temps de la timeline (`src/components/cocktail/sequence.ts`), partagée avec le texte et les étiquettes, qui suivent la position réelle des couches à l'écran.
- **Repli** : image fixe `public/images/maitai-3d.webp` générée depuis la scène, affichée si les animations sont réduites, si l'écran est trop bas ou sans WebGL.

### Points d'attention

- Le prix de 12 € et la liste d'ingrédients viennent de l'article, rien à inventer.
- Ne pas afficher de dosages : ils ne sont pas connus.
- Mention Loi Evin déjà présente dans le footer.

---

## 3. Profondeur jungle (réalisée, branche `profondeur-jungle`)

**Idée** : le scroll n'est jamais bloqué. Les effets de relief et de parallaxe sont répartis sur tout le site, pour donner l'impression d'avancer dans le mur végétal du bar.

### Effets

1. **Parallaxe multicouche** sur l'accueil et entre les sections :
   - **Couche avant** : feuilles tropicales en SVG (monstera, palmier, fougère) dessinées à la main en aplats vert très sombre avec un liseré néon discret. Elles défilent plus vite que le contenu (environ ×1,6) et débordent sur les bords de l'écran.
   - **Couche milieu** : le contenu et les photos (vitesse normale).
   - **Couche arrière** : halos verts flous et le soleil en filigrane, plus lents (environ ×0,6).
2. **Photos inclinables (tilt 3D)** :
   - **Desktop** : les photos s'inclinent selon la position de la souris (`perspective` + `rotateX/rotateY`, 8° maximum), avec un reflet lumineux qui suit le curseur.
   - **Mobile** : même effet piloté par le gyroscope (`deviceorientation`). Sur iOS, il faut une autorisation, demandée seulement après un geste de l'utilisateur, sinon l'effet est désactivé.
3. **Carte en menu plié** : la section « La carte » s'affiche comme un menu en carton plié en trois volets. Au scroll, les volets s'ouvrent en 3D (`rotateY` sur les volets latéraux, `transform-origin` sur les charnières) et révèlent les colonnes Tapas / Cocktails / Bières. Sur mobile, un accordéon vertical qui se déplie volet par volet.
4. **Titres en rotation 3D** : chaque titre de section apparaît ligne par ligne avec un léger `rotateX` (effet de panneau qui bascule), déclenché une seule fois à l'entrée dans l'écran.
5. **Cartes horaires et accès** : très léger soulèvement 3D au survol (translateZ + ombre).

### Technique

- Parallaxe : CSS scroll-driven animations (`animation-timeline: view()`) là où c'est supporté, et un fallback JS léger (un seul listener de scroll + `requestAnimationFrame`, transformations `translate3d` uniquement).
- Aucune bibliothèque obligatoire. GSAP est possible pour le menu plié si besoin.
- Les feuilles SVG sont à dessiner (pas de banque d'images), en 4 ou 5 formes réutilisées avec rotations et échelles différentes.
- Poids ajouté : quasi nul sans bibliothèque (moins de 10 Ko de SVG + JS).
- Effort : faible à moyen.

### Points d'attention

- Aucun blocage du scroll, donc la meilleure accessibilité et le moins de risques sur mobile.
- Limiter les couches animées à l'écran pour garder 60 i/s sur les téléphones d'entrée de gamme.

---

## 4. Néon en vraie 3D

**Idée** : le soleil de l'enseigne devient un vrai objet 3D temps réel, en tubes néon lumineux, qui accompagne le visiteur tout au long de la page.

### Déroulé

- **Accueil** : le soleil 3D est grand, de face, avec un halo lumineux (bloom). Il réagit légèrement à la souris (rotation de quelques degrés) et tourne lentement sur lui-même.
- **Au scroll** : il sort du hero et se déplace dans un canvas fixe en arrière-plan.
  - **Le bar** : il pivote pour se montrer de profil, et l'épaisseur des tubes devient visible.
  - **La carte** : il se range sur le côté gauche et devient plus petit.
  - **L'ambiance** : ses rayons ondulent comme des flammes.
  - **Horaires** : il pulse doucement si le bar est ouvert à ce moment (branché sur `statutActuel()`), et reste éteint, tube pâle, s'il est fermé.
  - **Footer** : il revient au centre et s'éteint en grésillant.
- **Le visage** (yeux, nez, sourire) : tracé en tubes plus fins.

### Technique

- Three.js via React Three Fiber (`@react-three/fiber`, `@react-three/drei`) et `@react-three/postprocessing` pour le bloom.
- Géométrie :
  - chaque rayon est un `TubeGeometry` le long d'une courbe (la même fonction de rayons ondulés que `Soleil.tsx`, transposée en 3D) ;
  - le cercle du visage est un `TorusGeometry` ;
  - matériau émissif vert `#4dff88`.
- Chorégraphie liée au scroll : GSAP ScrollTrigger qui pilote les positions et rotations de la caméra et de l'objet, ou `ScrollControls` de drei.
- Mobile et appareils faibles :
  - nombre de segments réduit, bloom désactivé ou simplifié, `dpr` limité à 1,5 ;
  - si WebGL est indisponible ou si les animations sont réduites, on garde le soleil SVG actuel.
- Chargement différé (`React.lazy`) du canvas 3D pour ne pas ralentir le premier affichage.
- Poids ajouté : environ 150 à 200 Ko compressés.
- Effort : élevé.

### Points d'attention

- C'est une interprétation 3D du logo : à valider avec les gérants, ou à refaire à partir de leur fichier officiel s'ils en ont un.
- Surveiller la batterie et la chauffe sur mobile : mettre le rendu en pause quand l'onglet est caché ou que le canvas est hors écran.
