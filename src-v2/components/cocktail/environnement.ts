import * as THREE from 'three'

/*
  Environnement lumineux du bar (softboxes, néon) pour les reflets du verre et du liquide.

  Le filtrage PMREM de three.js (échantillonnage GGX) demande plus d'une seconde de compilation et de calcul
  GPU sur une puce graphique intégrée : la page se figeait au chargement de la scène. Comme cet éclairage ne
  change jamais, il est calculé une fois pour toutes et livré en image WebP sans perte (valeurs HDR encodées en
  logarithme 8 bits).

  Pour la régénérer après avoir modifié sceneEnvironnement() : lancer npm run dev, importer ce module et three
  depuis la console du navigateur, appeler cuireEnvironnement(new THREE.WebGLRenderer()), puis convertir le PNG
  obtenu en WebP sans perte dans public/images/environnement-3d.webp.
*/

export const FICHIER_ENVIRONNEMENT = '/images/environnement-3d.webp'

const K = 2000
const VALEUR_MAX = 8
const ECHELLE = Math.log1p(VALEUR_MAX * K)

const encoder = (valeur: number) => Math.round((Math.log1p(Math.min(VALEUR_MAX, Math.max(0, valeur)) * K) / ECHELLE) * 255)
const decoder = (octet: number) => Math.expm1((octet / 255) * ECHELLE) / K

/** Boîte sombre et panneaux lumineux vus depuis le verre. */
export function sceneEnvironnement() {
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
  return scene
}

/** Calcule la carte PMREM et la renvoie encodée en PNG (outil de développement, absent du site publié). */
export async function cuireEnvironnement(renderer: THREE.WebGLRenderer): Promise<Blob> {
  const pmrem = new THREE.PMREMGenerator(renderer)
  const cible = pmrem.fromScene(sceneEnvironnement(), 0.03)
  const { width, height } = cible
  const brut = new Uint16Array(width * height * 4)
  renderer.readRenderTargetPixels(cible, 0, 0, width, height, brut)
  pmrem.dispose()
  cible.dispose()

  // Lignes gardées dans l'ordre de lecture GPU (bas en haut) : l'image paraît retournée, la texture est juste
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const contexte = canvas.getContext('2d')!
  const image = contexte.createImageData(width, height)
  for (let i = 0; i < brut.length; i += 4) {
    image.data[i] = encoder(THREE.DataUtils.fromHalfFloat(brut[i]))
    image.data[i + 1] = encoder(THREE.DataUtils.fromHalfFloat(brut[i + 1]))
    image.data[i + 2] = encoder(THREE.DataUtils.fromHalfFloat(brut[i + 2]))
    image.data[i + 3] = 255
  }
  contexte.putImageData(image, 0, 0)
  return new Promise((resoudre, rejeter) =>
    canvas.toBlob((blob) => (blob ? resoudre(blob) : rejeter(new Error('Encodage PNG impossible'))), 'image/png'),
  )
}

/** Charge la carte pré-calculée, prête à servir d'environnement (format CubeUV attendu par three.js). */
export async function chargerEnvironnement(): Promise<THREE.DataTexture> {
  const reponse = await fetch(FICHIER_ENVIRONNEMENT)
  if (!reponse.ok) throw new Error(`Environnement 3D introuvable (${reponse.status})`)
  const bitmap = await createImageBitmap(await reponse.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })
  const { width, height } = bitmap
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const contexte = canvas.getContext('2d', { willReadFrequently: true })!
  contexte.drawImage(bitmap, 0, 0)
  bitmap.close()
  const octets = contexte.getImageData(0, 0, width, height).data

  const table = Uint16Array.from({ length: 256 }, (_, octet) => THREE.DataUtils.toHalfFloat(decoder(octet)))
  const un = THREE.DataUtils.toHalfFloat(1)
  const donnees = new Uint16Array(width * height * 4)
  for (let i = 0; i < donnees.length; i += 4) {
    donnees[i] = table[octets[i]]
    donnees[i + 1] = table[octets[i + 1]]
    donnees[i + 2] = table[octets[i + 2]]
    donnees[i + 3] = un
  }

  const texture = new THREE.DataTexture(donnees, width, height, THREE.RGBAFormat, THREE.HalfFloatType)
  texture.mapping = THREE.CubeUVReflectionMapping
  texture.colorSpace = THREE.LinearSRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}
