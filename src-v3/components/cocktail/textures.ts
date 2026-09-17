import * as THREE from 'three'

/* Textures procédurales dessinées dans un canvas : aucun fichier image à charger. */

function canvas(largeur: number, hauteur = largeur) {
  const c = document.createElement('canvas')
  c.width = largeur
  c.height = hauteur
  return { c, ctx: c.getContext('2d')! }
}

// Générateur pseudo-aléatoire déterministe (même rendu à chaque chargement)
function aleatoire(graine: number) {
  let s = graine
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Bois clair du comptoir : veines longues et légères variations. */
export function textureBois() {
  const { c, ctx } = canvas(1024, 512)
  const r = aleatoire(7)
  const fond = ctx.createLinearGradient(0, 0, 0, 512)
  fond.addColorStop(0, '#c9a57a')
  fond.addColorStop(0.5, '#d6b48a')
  fond.addColorStop(1, '#c49d70')
  ctx.fillStyle = fond
  ctx.fillRect(0, 0, 1024, 512)

  for (let i = 0; i < 140; i++) {
    const y = r() * 512
    const epaisseur = 0.6 + r() * 2.2
    const amplitude = 2 + r() * 10
    const frequence = 0.002 + r() * 0.01
    const phase = r() * 10
    ctx.beginPath()
    for (let x = 0; x <= 1024; x += 8) {
      const yy = y + Math.sin(x * frequence + phase) * amplitude + Math.sin(x * frequence * 3.1 + phase) * amplitude * 0.3
      if (x === 0) ctx.moveTo(x, yy)
      else ctx.lineTo(x, yy)
    }
    ctx.strokeStyle = r() > 0.5 ? `rgba(120, 78, 40, ${0.05 + r() * 0.12})` : `rgba(240, 214, 176, ${0.05 + r() * 0.1})`
    ctx.lineWidth = epaisseur
    ctx.stroke()
  }
  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

/** Paille en bambou : fibres longitudinales et nœuds sombres. */
export function textureBambou() {
  const { c, ctx } = canvas(128, 512)
  const r = aleatoire(3)
  ctx.fillStyle = '#cfa56b'
  ctx.fillRect(0, 0, 128, 512)
  for (let i = 0; i < 60; i++) {
    const x = r() * 128
    ctx.fillStyle = r() > 0.5 ? 'rgba(140, 96, 48, 0.18)' : 'rgba(236, 206, 150, 0.2)'
    ctx.fillRect(x, 0, 1 + r() * 2, 512)
  }
  ;[96, 256, 418].forEach((y) => {
    const g = ctx.createLinearGradient(0, y - 10, 0, y + 10)
    g.addColorStop(0, 'rgba(90, 60, 30, 0)')
    g.addColorStop(0.5, 'rgba(90, 60, 30, 0.75)')
    g.addColorStop(1, 'rgba(90, 60, 30, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, y - 10, 128, 20)
  })
  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return texture
}

/** Carte de normales de gouttes de condensation (encodage RGB des normales). */
export function textureGouttes() {
  const taille = 512
  const { c, ctx } = canvas(taille)
  const r = aleatoire(11)
  ctx.fillStyle = 'rgb(128, 128, 255)'
  ctx.fillRect(0, 0, taille, taille)
  const image = ctx.getImageData(0, 0, taille, taille)
  const d = image.data

  const goutte = (cx: number, cy: number, rayon: number, etirement: number) => {
    const ry = rayon * etirement
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rayon); x <= cx + rayon; x++) {
        const nx = (x - cx) / rayon
        const ny = (y - cy) / ry
        const q = nx * nx + ny * ny
        if (q >= 1) continue
        const nz = Math.sqrt(1 - q)
        const xx = ((x % taille) + taille) % taille
        const yy = ((y % taille) + taille) % taille
        const k = (yy * taille + xx) * 4
        d[k] = Math.round((nx * 0.5 + 0.5) * 255)
        d[k + 1] = Math.round((-ny * 0.5 + 0.5) * 255)
        d[k + 2] = Math.round(nz * 255)
      }
    }
  }

  for (let i = 0; i < 900; i++) goutte(r() * taille, r() * taille, 1.2 + r() * 2.2, 1 + r() * 0.3)
  for (let i = 0; i < 90; i++) goutte(r() * taille, r() * taille, 3.5 + r() * 4, 1.1 + r() * 0.5)
  ctx.putImageData(image, 0, 0)

  const texture = new THREE.CanvasTexture(c)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.NoColorSpace
  return texture
}
