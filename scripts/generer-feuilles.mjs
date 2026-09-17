// Génère les tracés SVG des feuilles tropicales.
// Usage : node scripts/generer-feuilles.mjs src-v2/data/feuilles.ts
import { writeFileSync } from 'node:fs'

const r1 = (n) => Math.round(n * 10) / 10
const pt = (p) => `${r1(p[0])} ${r1(p[1])}`
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
const mul = (a, k) => [a[0] * k, a[1] * k]
const norm = (a) => {
  const l = Math.hypot(a[0], a[1]) || 1
  return [a[0] / l, a[1] / l]
}
const perp = (a) => [-a[1], a[0]]
const polygone = (pts) => 'M' + pts.map(pt).join('L') + 'Z'
const bez2 = (p0, p1, p2, t) => add(add(mul(p0, (1 - t) ** 2), mul(p1, 2 * (1 - t) * t)), mul(p2, t * t))
const bez2d = (p0, p1, p2, t) => norm(add(mul(add(p1, mul(p0, -1)), 2 * (1 - t)), mul(add(p2, mul(p1, -1)), 2 * t)))

// 1. Monstera : feuille en cœur fendue, avec quelques trous -------------------------
function monstera() {
  const C = [100, 108]
  const rx = 90
  const ry = 96
  const R = (th) => {
    const s = Math.sin(th)
    const c = Math.cos(th)
    let r = 1 / Math.sqrt((s / rx) ** 2 + (c / ry) ** 2)
    r *= 1 - 0.34 * Math.exp(-(((Math.abs(th) - Math.PI) / 0.32) ** 2)) // échancrure du pétiole
    r *= 1 + 0.07 * Math.exp(-((th / 0.22) ** 2)) // pointe
    return r
  }
  const P = (th, f = 1) => [C[0] + Math.sin(th) * R(th) * f, C[1] - Math.cos(th) * R(th) * f]
  const fentes = [0.5, 0.92, 1.34, 1.78, 2.24]
  const profondeurs = [0.5, 0.4, 0.36, 0.38, 0.46]
  const demi = (signe) => {
    const pts = []
    const pas = 0.02
    for (let th = 0; th <= Math.PI - 0.02; th += pas) {
      const i = fentes.findIndex((f) => Math.abs(th - f) < pas / 2 + 1e-9)
      if (i >= 0) {
        const f = fentes[i]
        pts.push(P(signe * (f - 0.02)))
        // fente fine, légèrement courbée vers la nervure
        pts.push(P(signe * (f + 0.03), 0.72))
        pts.push(P(signe * (f + 0.06), profondeurs[i]))
        pts.push(P(signe * (f + 0.055), 0.72))
        pts.push(P(signe * (f + 0.045)))
        th = f + 0.045
        continue
      }
      pts.push(P(signe * th))
    }
    return pts
  }
  const droite = demi(1)
  const gauche = demi(-1).reverse()
  const contour = polygone([...droite, ...gauche])
  // trous ovales entre les fentes, près de la nervure
  const trous = []
  ;[0.72, 1.14, 1.56, 2.0].forEach((th, i) => {
    ;[1, -1].forEach((signe) => {
      if (i === 3 && signe === -1) return
      const centre = P(signe * th, 0.3 + (i % 2) * 0.04)
      const dir = norm(add(centre, mul(C, -1)))
      const n = perp(dir)
      const a = 7.5
      const b = 3.2
      const pts = []
      for (let k = 0; k < 10; k++) {
        const ang = (k / 10) * Math.PI * 2
        pts.push(add(centre, add(mul(dir, Math.cos(ang) * a), mul(n, Math.sin(ang) * b))))
      }
      trous.push(polygone(pts))
    })
  })
  const bas = P(Math.PI - 0.001)
  const haut = P(0)
  const nervures = [`M${pt(bas)}L${pt(haut)}`]
  ;[0.3, 0.72, 1.14, 1.56, 2.0, 2.5].forEach((th) => {
    ;[1, -1].forEach((signe) => {
      const depart = [C[0], C[1] + (th - 1.4) * 38]
      nervures.push(`M${pt(depart)}L${pt(P(signe * th, 0.93))}`)
    })
  })
  return { viewBox: '0 0 200 210', limbe: contour + trous.join(''), nervures: nervures.join('') }
}

// Folioles le long d'un rachis courbe (palme, fougère) --------------------------------
function penne({ base, controle, pointe, n, longueur, angle, largeur, retombee, debut = 0.06, fin = 0.99 }) {
  const folioles = []
  for (let i = 0; i < n; i++) {
    const t = debut + ((fin - debut) * i) / (n - 1)
    const P = bez2(base, controle, pointe, t)
    const T = bez2d(base, controle, pointe, t)
    const N = perp(T)
    const L = longueur(t)
    ;[1, -1].forEach((signe) => {
      const dir = norm(add(mul(T, Math.cos(angle)), mul(N, signe * Math.sin(angle))))
      let bout = add(P, mul(dir, L))
      bout = add(bout, mul(N, signe * L * retombee))
      const milieu = add(P, mul(dir, L * 0.5))
      const w = largeur(t)
      const b1 = add(P, mul(T, w * 0.5))
      const b2 = add(P, mul(T, -w * 0.5))
      const c1 = add(milieu, mul(perp(dir), w))
      const c2 = add(milieu, mul(perp(dir), -w))
      folioles.push(`M${pt(b1)}Q${pt(c1)} ${pt(bout)}Q${pt(c2)} ${pt(b2)}Z`)
    })
  }
  const rachis = `M${pt(base)}Q${pt(controle)} ${pt(pointe)}`
  return { folioles: folioles.join(''), rachis }
}

function palme() {
  const { folioles, rachis } = penne({
    base: [62, 318],
    controle: [34, 150],
    pointe: [86, 8],
    n: 26,
    longueur: (t) => 8 + 62 * Math.sin(Math.PI * Math.min(1, t * 1.05)) ** 0.75,
    angle: 0.95,
    largeur: (t) => 3.2 + 2.2 * Math.sin(Math.PI * t),
    retombee: 0.35,
    debut: 0.12,
  })
  return { viewBox: '0 0 130 325', limbe: folioles, nervures: rachis }
}

function fougere() {
  const { folioles, rachis } = penne({
    base: [58, 296],
    controle: [78, 140],
    pointe: [44, 6],
    n: 30,
    longueur: (t) => 4 + 34 * Math.sin(Math.PI * (0.08 + t * 0.9)) ** 1.1 * (1 - t * 0.35),
    angle: 1.2,
    largeur: (t) => 4.2 + 2 * (1 - t),
    retombee: 0.12,
    debut: 0.08,
  })
  return { viewBox: '0 0 120 300', limbe: folioles, nervures: rachis }
}

// Bananier : grande feuille allongée, déchirée, nervures parallèles -------------------
function bananier() {
  const base = [56, 338]
  const controle = [70, 170]
  const pointe = [48, 8]
  const largeur = (t) => 44 * Math.sin(Math.PI * Math.min(1, t ** 0.9)) ** 0.55 * Math.min(1, t / 0.16) ** 0.8
  const dechirures = { 1: [0.34, 0.58, 0.8], [-1]: [0.46, 0.7] }
  const bord = (signe) => {
    const pts = []
    for (let i = 0; i <= 60; i++) {
      const t = 0.01 + (0.99 * i) / 60
      const P = bez2(base, controle, pointe, t)
      const N = perp(bez2d(base, controle, pointe, t))
      const cut = dechirures[signe].find((d) => Math.abs(t - d) < 0.008)
      if (cut) {
        pts.push(add(P, mul(N, signe * largeur(t))))
        pts.push(add(P, mul(N, signe * largeur(t) * 0.12)))
        pts.push(add(bez2(base, controle, pointe, t + 0.012), mul(N, signe * largeur(t + 0.012))))
        continue
      }
      pts.push(add(P, mul(N, signe * largeur(t))))
    }
    return pts
  }
  const contour = polygone([...bord(1), ...bord(-1).reverse()])
  const nervures = [`M${pt(bez2(base, controle, pointe, 0.02))}Q${pt(controle)} ${pt(pointe)}`]
  for (let i = 1; i < 16; i++) {
    const t = 0.06 + (0.88 * i) / 16
    const P = bez2(base, controle, pointe, t)
    const T = bez2d(base, controle, pointe, t)
    const N = perp(T)
    ;[1, -1].forEach((signe) => {
      const L = largeur(t + 0.05) * 0.92
      const bout = add(add(P, mul(N, signe * L)), mul(T, L * 0.55))
      nervures.push(`M${pt(P)}L${pt(bout)}`)
    })
  }
  return { viewBox: '0 0 115 345', limbe: contour, nervures: nervures.join('') }
}

// Feuille simple lancéolée ---------------------------------------------------------------
function lanceolee() {
  const base = [40, 196]
  const controle = [30, 100]
  const pointe = [44, 4]
  const largeur = (t) => 30 * Math.sin(Math.PI * t ** 0.8) ** 0.8 * Math.min(1, t / 0.14) ** 0.7
  const bord = (signe) => {
    const pts = []
    for (let i = 0; i <= 36; i++) {
      const t = 0.01 + (0.99 * i) / 36
      const P = bez2(base, controle, pointe, t)
      const N = perp(bez2d(base, controle, pointe, t))
      pts.push(add(P, mul(N, signe * largeur(t))))
    }
    return pts
  }
  const contour = polygone([...bord(1), ...bord(-1).reverse()])
  const nervures = [`M${pt(base)}Q${pt(controle)} ${pt(pointe)}`]
  for (let i = 1; i < 8; i++) {
    const t = 0.1 + (0.8 * i) / 8
    const P = bez2(base, controle, pointe, t)
    const T = bez2d(base, controle, pointe, t)
    const N = perp(T)
    ;[1, -1].forEach((signe) => {
      const L = largeur(t) * 0.85
      nervures.push(`M${pt(P)}Q${pt(add(P, mul(N, signe * L * 0.6)))} ${pt(add(add(P, mul(N, signe * L)), mul(T, L * 0.6)))}`)
    })
  }
  return { viewBox: '0 0 80 200', limbe: contour, nervures: nervures.join('') }
}

const formes = { monstera: monstera(), palme: palme(), fougere: fougere(), bananier: bananier(), lanceolee: lanceolee() }

let ts = `// Fichier généré par scripts/generer-feuilles.mjs : tracés SVG des feuilles tropicales (aplats + nervures).\n\n`
ts += `export type FormeFeuille = ${Object.keys(formes).map((k) => `'${k}'`).join(' | ')}\n\n`
ts += `export const FORMES: Record<FormeFeuille, { viewBox: string; limbe: string; nervures: string }> = {\n`
for (const [nom, f] of Object.entries(formes)) {
  ts += `  ${nom}: {\n    viewBox: '${f.viewBox}',\n    limbe:\n      '${f.limbe}',\n    nervures:\n      '${f.nervures}',\n  },\n`
}
ts += `}\n`
writeFileSync(process.argv[2], ts)
for (const [nom, f] of Object.entries(formes)) console.log(nom, f.limbe.length + f.nervures.length)
