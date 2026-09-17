import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import {
  EPAISSEUR_COUCHE,
  INDEX_GRENADINE,
  INGREDIENTS,
  VERRE,
  etatSequence,
  milieuCouche,
  rayonExterieur,
  rayonInterieur,
} from './sequence'
import * as S from './shaders'
import { textureBambou, textureBois, textureGouttes } from './textures'

export type Scene3D = {
  rendre: (temps: number) => void
  redimensionner: (largeur: number, hauteur: number) => void
  ancres: () => Array<{ x: number; y: number }>
  detruire: () => void
}

const couleurLineaire = (hex: string) => new THREE.Color(hex)

const IMPACT = new THREE.Vector2(0.45, 0.35)
const PAILLE = { bas: new THREE.Vector3(-0.9, 1.7, -0.55), haut: new THREE.Vector3(-3.7, 17.2, 0.95), rayon: 0.24 }

/** Profil du verre (rayon, hauteur) : paroi extérieure, bord arrondi, paroi intérieure, fond épais. */
function profilVerre() {
  const { hauteur, rayonBas, rayonHaut, paroi, fond } = VERRE
  const pts: THREE.Vector2[] = []
  const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n: number) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n
      pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r))
    }
  }
  pts.push(new THREE.Vector2(0.001, 0))
  pts.push(new THREE.Vector2(rayonBas - 0.4, 0))
  arc(rayonBas - 0.4, 0.4, 0.4, -Math.PI / 2, 0, 6)
  for (let i = 1; i <= 16; i++) {
    const y = 0.4 + ((hauteur - 0.4) * i) / 16
    pts.push(new THREE.Vector2(rayonExterieur(y), y))
  }
  arc(rayonHaut - paroi / 2, hauteur, paroi / 2, 0, Math.PI, 8)
  for (let i = 1; i <= 16; i++) {
    const y = hauteur - ((hauteur - fond - 0.3) * i) / 16
    pts.push(new THREE.Vector2(rayonInterieur(y) + 0.02, y))
  }
  arc(rayonInterieur(fond) + 0.02 - 0.3, fond + 0.3, 0.3, 0, -Math.PI / 2, 6)
  pts.push(new THREE.Vector2(0.001, fond))
  return pts
}

/** Tranche d'ananas en quartier, fendue pour se poser sur le bord. */
function geometrieAnanas(R: number) {
  const forme = new THREE.Shape()
  const a0 = THREE.MathUtils.degToRad(-34)
  const a1 = THREE.MathUtils.degToRad(34)
  const coeur = 0.32
  const fente = 0.07
  forme.moveTo(Math.cos(a0) * coeur, Math.sin(a0) * coeur)
  forme.lineTo(Math.cos(a0) * R, Math.sin(a0) * R)
  forme.absarc(0, 0, R, a0, a1, false)
  forme.lineTo(Math.cos(a1) * coeur, Math.sin(a1) * coeur)
  forme.lineTo(coeur, fente)
  forme.lineTo(1.35, fente)
  forme.lineTo(1.35, -fente)
  forme.lineTo(coeur, -fente)
  forme.lineTo(Math.cos(a0) * coeur, Math.sin(a0) * coeur)
  const geo = new THREE.ExtrudeGeometry(forme, {
    depth: 0.7,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.06,
    bevelSegments: 3,
    curveSegments: 36,
  })
  geo.translate(0, 0, -0.35)
  return geo
}

function environnement(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene()
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(80, 50, 80), new THREE.MeshBasicMaterial({ color: '#07130c', side: THREE.BackSide })))
  const panneau = (l: number, h: number, couleur: string, intensite: number, pos: [number, number, number]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(l, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(couleur).multiplyScalar(intensite), side: THREE.DoubleSide }),
    )
    m.position.set(...pos)
    m.lookAt(0, 6, 0)
    scene.add(m)
  }
  panneau(7, 30, '#ffe6c4', 7, [-20, 12, 16]) // grande source verticale chaude, avant gauche
  panneau(2.2, 30, '#ffffff', 5, [16, 12, 20]) // fine bande blanche, avant droite
  panneau(2.5, 28, '#4dff88', 3, [24, 8, -14]) // néon vert, arrière droit
  panneau(30, 1.6, '#fff4e6', 3, [0, 24, 2]) // bandeau au plafond
  panneau(5, 5, '#ff9a3c', 3, [-22, 6, -18]) // lampe ambrée, arrière gauche
  const pmrem = new THREE.PMREMGenerator(renderer)
  const cible = pmrem.fromScene(scene, 0.03)
  pmrem.dispose()
  return cible
}

export function creerScene(canvas: HTMLCanvasElement, options: { mobile: boolean }): Scene3D {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, options.mobile ? 1.5 : 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping
  renderer.transmissionResolutionScale = options.mobile ? 0.6 : 0.85

  const fondScene = couleurLineaire('#091910')
  const neon = couleurLineaire('#4dff88')
  const lumiere = new THREE.Vector3(-0.55, 0.7, 0.45).normalize()

  const scene = new THREE.Scene()
  scene.background = fondScene.clone()
  const env = environnement(renderer)
  scene.environment = env.texture

  const camera = new THREE.PerspectiveCamera(24, 1, 1, 200)
  const cibleCamera = new THREE.Vector3(0, 7.6, 0)

  const cle = new THREE.DirectionalLight('#ffe3c2', 2.4)
  cle.position.set(-12, 20, 14)
  const contre = new THREE.DirectionalLight('#4dff88', 1.1)
  contre.position.set(14, 8, -14)
  scene.add(cle, contre, new THREE.AmbientLight('#1d3326', 0.6))

  const aJeter: Array<{ dispose: () => void }> = [env]

  // Définitions nécessaires pour échantillonner la carte PMREM dans les shaders maison
  const hauteurEnv = (env.texture.image as { height: number }).height
  const mipMax = Math.log2(hauteurEnv) - 2
  const definesEnv = {
    ENVMAP_TYPE_CUBE_UV: '',
    CUBEUV_TEXEL_WIDTH: 1 / (3 * Math.max(Math.pow(2, mipMax), 7 * 16)),
    CUBEUV_TEXEL_HEIGHT: 1 / hauteurEnv,
    CUBEUV_MAX_MIP: mipMax.toFixed(1),
  }

  /* Fond et comptoir */
  const bois = textureBois()
  aJeter.push(bois)
  const uniformsComptoir = {
    uBois: { value: bois },
    uTeinte: { value: new THREE.Color('#e5722b') },
    uRemplissage: { value: 0 },
    uNeon: { value: neon },
    uFondScene: { value: fondScene },
  }
  const comptoir = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 90).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({ uniforms: uniformsComptoir, vertexShader: S.comptoirVertex, fragmentShader: S.comptoirFragment }),
  )
  comptoir.position.z = -20
  const fond = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 110),
    new THREE.ShaderMaterial({
      uniforms: { uFondScene: { value: fondScene }, uNeon: { value: neon } },
      vertexShader: S.fondVertex,
      fragmentShader: S.fondFragment,
      toneMapped: false,
    }),
  )
  fond.position.set(0, 30, -60)
  scene.add(comptoir, fond)

  /* Glaçons : répartis en couronne pour laisser passer le filet et la paille */
  const glaces: THREE.Mesh[] = []
  const demiGlace = 0.82
  const placements: Array<[number, number, number]> = []
  const hasard = (i: number) => {
    const x = Math.sin(i * 91.345 + 7.13) * 43758.5453
    return x - Math.floor(x)
  }
  const parEtage = [3, 3, 3, 2, 3, 2]
  parEtage.forEach((nb, etage) => {
    const y = 2.1 + etage * 1.6 + (hasard(etage) - 0.5) * 0.15
    for (let k = 0; k < nb; k++) {
      const angle = (k / nb) * Math.PI * 2 + etage * 1.05 + (hasard(etage * 7 + k) - 0.5) * 0.5
      const rayon = rayonInterieur(y) - 1.08 - hasard(etage * 13 + k) * 0.2
      placements.push([Math.cos(angle) * rayon, y + (hasard(etage * 5 + k) - 0.5) * 0.25, Math.sin(angle) * rayon])
    }
  })
  const aleat = (i: number) => Math.sin(i * 12.9898) * 43758.5453 - Math.floor(Math.sin(i * 12.9898) * 43758.5453)
  const glaceInv = Array.from({ length: S.NB_GLACONS }, () => new THREE.Matrix4().makeTranslation(0, -100, 0))

  /* Uniforms partagés du liquide */
  const couleurs = INGREDIENTS.map((i) => couleurLineaire(i.couleur))
  const couleursActives = couleurs.map((c) => c.clone())
  const grenadineFondue = couleurLineaire('#d2562c')
  const liquide = {
    uCouleurs: { value: couleursActives },
    uClartes: { value: INGREDIENTS.map((i) => i.clarte) },
    uFond: { value: VERRE.fond },
    uPasCouche: { value: EPAISSEUR_COUCHE },
    uNiveauMax: { value: VERRE.niveauMax },
    uNiveau: { value: VERRE.fond },
    uAgitation: { value: 0 },
    uGrenadine: { value: 0 },
    uMelange: { value: 0 },
    uTemps: { value: 0 },
    uRayonFond: { value: rayonInterieur(VERRE.fond) },
    uPenteRayon: { value: (rayonInterieur(VERRE.hauteur) - rayonInterieur(VERRE.fond)) / (VERRE.hauteur - VERRE.fond) },
    uGrenadineCouleur: { value: couleurs[INDEX_GRENADINE].clone() },
    uRouge: { value: couleurLineaire('#a3221e') },
    uOrange: { value: couleurLineaire('#e3702a') },
    uAmbre: { value: couleurLineaire('#f2aa46') },
    uFondScene: { value: fondScene },
    uNeon: { value: neon },
    uLumiere: { value: lumiere },
    uGlaceInv: { value: glaceInv },
    uGlaceDemi: { value: demiGlace },
    uPailleA: { value: PAILLE.bas.clone() },
    uPailleB: { value: PAILLE.haut.clone() },
    uPailleR: { value: PAILLE.rayon },
    uPailleVisible: { value: 0 },
    uEnv: { value: env.texture },
  }

  const geoGlace = new RoundedBoxGeometry(demiGlace * 2, demiGlace * 2, demiGlace * 2, 3, 0.22)
  const matGlace = new THREE.ShaderMaterial({
    uniforms: { ...liquide, uDemiLocal: { value: demiGlace } },
    vertexShader: S.glaceVertex,
    fragmentShader: S.glaceFragment,
    defines: definesEnv,
  })
  aJeter.push(geoGlace, matGlace)
  placements.forEach((pos, i) => {
    const m = new THREE.Mesh(geoGlace, matGlace)
    m.position.set(...pos)
    m.rotation.set(aleat(i + 1) * 0.8 - 0.4, aleat(i + 7) * Math.PI, aleat(i + 13) * 0.8 - 0.4)
    m.scale.setScalar(0.94 + aleat(i + 21) * 0.1)
    m.updateMatrixWorld()
    glaceInv[i].copy(m.matrixWorld).invert()
    glaces.push(m)
    scene.add(m)
  })
  // Le lancer de rayon du shader suppose des cubes non déformés : on compense l'échelle dans la matrice inverse
  glaces.forEach((m, i) => {
    const sans = new THREE.Matrix4().compose(m.position, m.quaternion, new THREE.Vector3(1, 1, 1))
    glaceInv[i].copy(sans).invert()
  })
  liquide.uGlaceDemi.value = demiGlace

  /* Liquide : paroi (cylindre ouvert qui épouse le verre) et surface */
  const profilLiquide: THREE.Vector2[] = []
  for (let i = 0; i <= 40; i++) {
    const y = VERRE.fond + ((VERRE.niveauMax + 0.2 - VERRE.fond) * i) / 40
    profilLiquide.push(new THREE.Vector2(rayonInterieur(y), y))
  }
  const matParoi = new THREE.ShaderMaterial({
    uniforms: liquide,
    vertexShader: S.liquideVertex,
    fragmentShader: S.liquideFragment,
    side: THREE.DoubleSide,
    defines: definesEnv,
  })
  const paroiLiquide = new THREE.Mesh(new THREE.LatheGeometry(profilLiquide, 96), matParoi)
  const matSurface = new THREE.ShaderMaterial({
    uniforms: { ...liquide, uImpact: { value: IMPACT } },
    vertexShader: S.surfaceVertex,
    fragmentShader: S.surfaceFragment,
    side: THREE.DoubleSide,
    defines: definesEnv,
  })
  const surface = new THREE.Mesh(new THREE.RingGeometry(0.001, 1, 96, 12).rotateX(-Math.PI / 2), matSurface)
  scene.add(paroiLiquide, surface)
  aJeter.push(paroiLiquide.geometry, matParoi, surface.geometry, matSurface)

  /* Verre */
  const gouttes = textureGouttes()
  gouttes.repeat.set(8, 11)
  const buee = { value: 0.3 }
  const matVerre = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0,
    roughness: 0.02,
    transmission: 1,
    thickness: 0.9,
    ior: 1.52,
    envMapIntensity: 1.9,
    specularIntensity: 1,
    attenuationColor: new THREE.Color('#e6fff0'),
    attenuationDistance: 24,
    normalMap: gouttes,
    normalScale: new THREE.Vector2(0.38, 0.38),
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    clearcoatNormalMap: gouttes,
    clearcoatNormalScale: new THREE.Vector2(0.8, 0.8),
  })
  matVerre.onBeforeCompile = (shader) => {
    shader.uniforms.uBuee = buee
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uBuee;')
      .replace(
        'mapN.xy *= normalScale;',
        `mapN.xy *= normalScale * uBuee * (1.0 - smoothstep(${(VERRE.hauteur - 0.9).toFixed(2)}, ${(VERRE.hauteur - 0.3).toFixed(2)}, vWorldPosition.y));`,
      )
      .replace(
        'clearcoatMapN.xy *= clearcoatNormalScale;',
        `clearcoatMapN.xy *= clearcoatNormalScale * uBuee * (1.0 - smoothstep(${(VERRE.hauteur - 0.9).toFixed(2)}, ${(VERRE.hauteur - 0.3).toFixed(2)}, vWorldPosition.y));`,
      )
  }
  const verre = new THREE.Mesh(new THREE.LatheGeometry(profilVerre(), 128), matVerre)
  scene.add(verre)
  aJeter.push(gouttes, verre.geometry, matVerre)

  /* Filet versé */
  const uniformsFlux = {
    uCouleur: { value: new THREE.Color() },
    uClarte: { value: 0 },
    uTemps: liquide.uTemps,
    uLumiere: { value: lumiere },
    uFondScene: { value: fondScene },
  }
  const flux = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 1, 20, 40, true),
    new THREE.ShaderMaterial({ uniforms: uniformsFlux, vertexShader: S.fluxVertex, fragmentShader: S.fluxFragment }),
  )
  flux.visible = false
  scene.add(flux)
  aJeter.push(flux.geometry, flux.material as THREE.Material)

  /* Paille en bambou */
  const bambou = textureBambou()
  bambou.repeat.set(1, 2)
  const longueurPaille = PAILLE.bas.distanceTo(PAILLE.haut)
  const paille = new THREE.Mesh(
    new THREE.CylinderGeometry(PAILLE.rayon, PAILLE.rayon, longueurPaille, 28, 1, false),
    new THREE.MeshStandardMaterial({ map: bambou, roughness: 0.62, metalness: 0 }),
  )
  const milieuPaille = PAILLE.bas.clone().add(PAILLE.haut).multiplyScalar(0.5)
  paille.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), PAILLE.haut.clone().sub(PAILLE.bas).normalize())
  paille.visible = false
  scene.add(paille)
  aJeter.push(bambou, paille.geometry, paille.material as THREE.Material)

  /* Tranche d'ananas posée sur le bord */
  const R_ANANAS = 2.5
  const matAnanas = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.4, clearcoat: 0.55, clearcoatRoughness: 0.3 })
  matAnanas.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vLocal;\n${S.BRUIT}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float rr = length(vLocal.xy);
        float ang = atan(vLocal.y, vLocal.x);
        float ecorce = smoothstep(${(R_ANANAS - 0.3).toFixed(2)}, ${(R_ANANAS - 0.2).toFixed(2)}, rr);
        float fibres = 0.86 + 0.14 * sin(ang * 170.0 + bruit(vLocal * 7.0) * 4.0);
        vec3 chair = mix(vec3(0.85, 0.42, 0.02), vec3(0.96, 0.66, 0.06), smoothstep(0.3, 1.8, rr)) * fibres;
        chair = mix(chair, vec3(0.98, 0.8, 0.28), smoothstep(${(R_ANANAS - 0.6).toFixed(2)}, ${(R_ANANAS - 0.38).toFixed(2)}, rr) * (1.0 - ecorce));
        chair *= 0.8 + 0.2 * bruit(vLocal * 18.0);
        float yeux = smoothstep(0.5, 0.95, sin(ang * 32.0 + vLocal.z * 9.0) * sin(ang * 32.0 - vLocal.z * 9.0));
        vec3 teinteEcorce = mix(vec3(0.16, 0.08, 0.02), vec3(0.1, 0.14, 0.03), bruit(vLocal * 5.0)) * (1.0 - 0.55 * yeux);
        diffuseColor.rgb = mix(chair, teinteEcorce, ecorce);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.3, 0.9, smoothstep(${(R_ANANAS - 0.3).toFixed(2)}, ${(R_ANANAS - 0.2).toFixed(2)}, length(vLocal.xy)));`,
      )
  }
  const ananas = new THREE.Group()
  const quartier = new THREE.Mesh(geometrieAnanas(R_ANANAS), matAnanas)
  // Fente orientée vers le haut et l'extérieur, le bord du verre s'y loge à 0,8 du cœur
  const ANGLE_ANANAS = THREE.MathUtils.degToRad(52)
  quartier.rotation.z = ANGLE_ANANAS
  const directionFente = new THREE.Vector3(Math.cos(ANGLE_ANANAS), Math.sin(ANGLE_ANANAS), 0)
  const bord = new THREE.Vector3(VERRE.rayonHaut - VERRE.paroi / 2, VERRE.hauteur, 0)
  quartier.position.copy(bord).addScaledVector(directionFente, -0.8)
  ananas.add(quartier)
  ananas.rotation.y = THREE.MathUtils.degToRad(-18)
  ananas.visible = false
  scene.add(ananas)
  aJeter.push(quartier.geometry, matAnanas)

  /* Cadrage */
  let largeur = 1
  let hauteur = 1
  let distanceBase = 50

  const redimensionner = (l: number, h: number) => {
    largeur = Math.max(1, l)
    hauteur = Math.max(1, h)
    renderer.setSize(largeur, hauteur, false)
    camera.aspect = largeur / hauteur
    const demiV = THREE.MathUtils.degToRad(camera.fov / 2)
    const demiH = Math.atan(Math.tan(demiV) * camera.aspect)
    distanceBase = Math.max(9.4 / Math.tan(demiV), 6.9 / Math.tan(demiH))
    camera.updateProjectionMatrix()
  }

  const couleurTeinte = new THREE.Color()
  const orangeFinal = couleurLineaire('#e3702a')
  const origine = performance.now()

  const rendre = (t: number) => {
    const e = etatSequence(t)
    const temps = (performance.now() - origine) / 1000

    liquide.uTemps.value = temps
    liquide.uNiveau.value = e.niveau
    liquide.uAgitation.value = e.agitation
    liquide.uGrenadine.value = e.grenadine
    liquide.uMelange.value = e.melange
    couleursActives[INDEX_GRENADINE].copy(couleurs[INDEX_GRENADINE]).lerp(grenadineFondue, e.grenadine)

    const plein = e.niveau > VERRE.fond + 0.02
    paroiLiquide.visible = plein
    surface.visible = plein
    const rayon = rayonInterieur(e.niveau)
    surface.position.y = e.niveau
    surface.scale.set(rayon, 1, rayon)

    // Filet
    if (e.flux.intensite > 0.01 && e.flux.index >= 0) {
      const ingredient = INGREDIENTS[e.flux.index]
      uniformsFlux.uCouleur.value.copy(couleurs[e.flux.index])
      uniformsFlux.uClarte.value = ingredient.clarte
      const haut = 34
      const r = 0.13 * Math.pow(e.flux.intensite, 0.6)
      flux.visible = true
      flux.position.set(IMPACT.x, (haut + e.niveau) / 2, IMPACT.y)
      flux.scale.set(r, haut - e.niveau, r)
    } else {
      flux.visible = false
    }

    // Paille qui descend dans le verre
    paille.visible = e.paille > 0.001
    const decalagePaille = (1 - e.paille) * 14
    paille.position.copy(milieuPaille).y += decalagePaille
    liquide.uPailleVisible.value = paille.visible ? 1 : 0
    liquide.uPailleA.value.copy(PAILLE.bas).y += decalagePaille
    liquide.uPailleB.value.copy(PAILLE.haut).y += decalagePaille

    // Ananas qui se pose sur le bord
    ananas.visible = e.ananas > 0.001
    ananas.position.y = (1 - e.ananas) * 7
    quartier.rotation.z = ANGLE_ANANAS - (1 - e.ananas) * 0.5

    // Légère respiration des glaçons près de la surface quand on verse
    glaces.forEach((m, i) => {
      const proche = Math.exp(-Math.abs(m.position.y - e.niveau) * 0.8)
      m.rotation.y += Math.sin(temps * 1.7 + i) * 0.0006 * e.agitation * proche
    })

    // Condensation et lumière colorée sur le comptoir
    buee.value = 0.25 + 0.75 * Math.min(1, t / 3)
    const remplissage = (e.niveau - VERRE.fond) / (VERRE.niveauMax - VERRE.fond)
    uniformsComptoir.uRemplissage.value = remplissage
    const indexHaut = Math.min(INGREDIENTS.length - 1, Math.max(0, Math.floor((e.niveau - VERRE.fond) / EPAISSEUR_COUCHE - 0.001)))
    couleurTeinte.copy(couleursActives[Math.max(0, indexHaut - 2)]).lerp(orangeFinal, Math.max(e.melange, e.grenadine * 0.5))
    uniformsComptoir.uTeinte.value.copy(couleurTeinte)

    // Caméra : lente rotation autour du verre, léger rapprochement final
    const angle = THREE.MathUtils.lerp(-0.42, 0.3, e.camera)
    const distance = distanceBase * (1 - 0.05 * e.finale)
    const elevation = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(10, 7, e.camera))
    camera.position.set(
      Math.sin(angle) * Math.cos(elevation) * distance,
      cibleCamera.y + Math.sin(elevation) * distance,
      Math.cos(angle) * Math.cos(elevation) * distance,
    )
    camera.lookAt(cibleCamera)

    renderer.render(scene, camera)
  }

  const droite = new THREE.Vector3()
  const point = new THREE.Vector3()
  const ancres = () => {
    droite.set(1, 0, 0).applyQuaternion(camera.quaternion)
    return INGREDIENTS.map((_, i) => {
      const y = milieuCouche(i)
      point.set(0, y, 0).addScaledVector(droite, rayonExterieur(y) + 0.15).project(camera)
      return { x: ((point.x + 1) / 2) * largeur, y: ((1 - point.y) / 2) * hauteur }
    })
  }

  const detruire = () => {
    aJeter.forEach((o) => o.dispose())
    comptoir.geometry.dispose()
    ;(comptoir.material as THREE.Material).dispose()
    fond.geometry.dispose()
    ;(fond.material as THREE.Material).dispose()
    renderer.dispose()
  }

  return { rendre, redimensionner, ancres, detruire }
}
