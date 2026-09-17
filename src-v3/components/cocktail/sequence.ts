import { SIGNATURE } from '../../data/infos'

/*
  Modèle de la séquence « Le Maï Taï se compose ».
  Tout l'état visuel est une fonction pure du temps de la timeline GSAP (piloté par le scroll),
  partagée par la scène 3D et par les éléments HTML (étiquettes, compteur, textes).
  Couleurs et « clarté » (0 = jus opaque, 1 = alcool limpide) sont des choix d'illustration,
  aucun dosage n'est représenté.
*/

const TEINTES: Record<string, { couleur: string; clarte: number }> = {
  'Rhum ambré': { couleur: '#a4541a', clarte: 0.45 },
  'Rhum blanc': { couleur: '#eef3ec', clarte: 0.95 },
  Whisky: { couleur: '#c4862f', clarte: 0.55 },
  'Triple sec': { couleur: '#f7dcae', clarte: 0.85 },
  'Citron vert': { couleur: '#d3dc86', clarte: 0.25 },
  Ananas: { couleur: '#f2c54b', clarte: 0.1 },
  Orange: { couleur: '#ef8f28', clarte: 0.06 },
  Cranberry: { couleur: '#b52a45', clarte: 0.3 },
  Grenadine: { couleur: '#8c0a27', clarte: 0.2 },
  'Sucre de canne': { couleur: '#f4e7c9', clarte: 0.8 },
}

export const INGREDIENTS = SIGNATURE.ingredients.map((nom) => ({
  nom,
  ...(TEINTES[nom] ?? { couleur: '#e0782a', clarte: 0.2 }),
}))

export const INDEX_GRENADINE = SIGNATURE.ingredients.indexOf('Grenadine')

// Repères de la timeline (unités arbitraires réparties sur la distance de scroll)
export const T0 = 0.35
export const PAS = 0.62
export const VERSER = 0.42
export const debut = (i: number) => T0 + i * PAS
export const T_MELANGE = debut(INGREDIENTS.length) + 0.1
export const T_FINALE = T_MELANGE + 0.8
export const DUREE = T_FINALE + 1.46

// Géométrie du verre (unités ≈ cm)
export const VERRE = {
  hauteur: 12,
  rayonBas: 3.35,
  rayonHaut: 4,
  paroi: 0.22,
  fond: 1.25,
  niveauMax: 10.75,
}

export const rayonInterieur = (y: number) => {
  const { rayonBas, rayonHaut, paroi, fond, hauteur } = VERRE
  const k = (y - fond) / (hauteur - fond)
  return rayonBas - paroi + (rayonHaut - rayonBas) * Math.min(1, Math.max(0, k)) - 0.02
}

export const rayonExterieur = (y: number) => {
  const { rayonBas, rayonHaut, hauteur } = VERRE
  return rayonBas + (rayonHaut - rayonBas) * Math.min(1, Math.max(0, y / hauteur))
}

export const EPAISSEUR_COUCHE = (VERRE.niveauMax - VERRE.fond) / INGREDIENTS.length
export const milieuCouche = (i: number) => VERRE.fond + (i + 0.5) * EPAISSEUR_COUCHE

const borne = (v: number) => Math.min(1, Math.max(0, v))
const sortieDouce = (p: number) => 1 - (1 - p) * (1 - p)
const douce = (p: number) => p * p * (3 - 2 * p)

export type EtatSequence = {
  niveau: number
  flux: { intensite: number; index: number }
  agitation: number
  grenadine: number
  melange: number
  ananas: number
  paille: number
  camera: number
  finale: number
}

export function etatSequence(t: number): EtatSequence {
  let remplies = 0
  let fluxIntensite = 0
  let fluxIndex = -1
  let agitation = 0

  INGREDIENTS.forEach((_, i) => {
    const s = debut(i)
    remplies += sortieDouce(borne((t - s - 0.08) / VERSER))
    const entree = borne((t - s) / 0.06)
    const sortie = 1 - borne((t - s - VERSER) / 0.1)
    const intensite = Math.min(entree, sortie)
    if (intensite > fluxIntensite) {
      fluxIntensite = intensite
      fluxIndex = i
    }
    // Remous : montent avec le filet puis retombent doucement
    const remous = t < s ? 0 : t < s + VERSER ? borne((t - s) / 0.1) : Math.exp(-(t - s - VERSER) * 5)
    agitation = Math.max(agitation, remous)
  })

  return {
    niveau: VERRE.fond + remplies * EPAISSEUR_COUCHE,
    flux: { intensite: fluxIntensite, index: fluxIndex },
    agitation,
    grenadine: douce(borne((t - debut(INDEX_GRENADINE) - VERSER - 0.02) / 0.95)),
    melange: douce(borne((t - T_MELANGE) / 0.75)),
    ananas: sortieDouce(borne((t - T_FINALE) / 0.45)),
    paille: sortieDouce(borne((t - T_FINALE - 0.1) / 0.45)),
    camera: t / DUREE,
    finale: douce(borne((t - T_FINALE) / 1)),
  }
}
