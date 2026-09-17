// Démo des maquettes : charge les deux versions en entier derrière un écran de chargement,
// puis passe de l'une à l'autre instantanément grâce à une pastille discrète.
import '@fontsource-variable/big-shoulders-display'
import '@fontsource-variable/dm-sans'
import './selecteur.css'
import { SOURCE_DEMO } from './protocole'

const VERSIONS = [
  { numero: 1, nom: 'Classique', chemin: 'v1/' },
  { numero: 2, nom: 'Immersive', chemin: 'v2/' },
]

const DUREE_MIN_CHARGEMENT = 900
const DUREE_MAX_CHARGEMENT = 45000

const demo = document.getElementById('demo')!
let actuelle = location.hash === '#2' ? 2 : 1

/* Écran de chargement : le soleil du logo s'allume rayon par rayon */

// Même dessin que src/components/Soleil.tsx
const NB_RAYONS = 22
const r2 = (n: number) => Math.round(n * 100) / 100
function rayon(i: number) {
  const angle = (i / NB_RAYONS) * Math.PI * 2 - Math.PI / 2
  const long = i % 2 === 0
  const debut = 25
  const fin = long ? 47 : 39
  const ondulation = long ? 3.6 : 2.6
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)
  const point = (r: number, decalage: number) => `${r2(50 + ux * r - uy * decalage)} ${r2(50 + uy * r + ux * decalage)}`
  const d = fin - debut
  return `M${point(debut, 0)} C${point(debut + d / 3, ondulation)} ${point(debut + (2 * d) / 3, -ondulation)} ${point(fin, 0)}`
}

const chargement = document.createElement('div')
chargement.className = 'chargement'
chargement.innerHTML = `
  <div class="chargement__contenu" role="progressbar" aria-label="Chargement du site" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
    <svg class="chargement__soleil" viewBox="0 0 100 100" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      ${Array.from({ length: NB_RAYONS }, (_, i) => `<path class="chargement__rayon" d="${rayon(i)}" />`).join('')}
      <g class="chargement__coeur">
        <circle cx="50" cy="50" r="18.5" />
        <g stroke-width="2">
          <path d="M40.5 46.2 Q44 43.4 47.4 46.2 Q44 48.6 40.5 46.2 Z" />
          <path d="M52.6 46.2 Q56 43.4 59.5 46.2 Q56 48.6 52.6 46.2 Z" />
          <path d="M50 46.5 L48.4 53.6 Q50 54.8 51.8 53.6" />
          <path d="M44.6 58 Q50 61.4 55.4 58" />
        </g>
      </g>
    </svg>
    <p class="chargement__nom">Maï-Taï</p>
    <p class="chargement__pourcentage">0 %</p>
  </div>
`
const barre = chargement.querySelector<HTMLElement>('.chargement__contenu')!
const rayons = Array.from(chargement.querySelectorAll<SVGPathElement>('.chargement__rayon'))
const coeur = chargement.querySelector<SVGGElement>('.chargement__coeur')!
const pourcentage = chargement.querySelector<HTMLElement>('.chargement__pourcentage')!

/* Cadres des deux versions */

const cadres = VERSIONS.map((v) => {
  const cadre = document.createElement('iframe')
  cadre.className = 'demo__cadre'
  cadre.title = `Maï-Taï, version ${v.numero} ${v.nom.toLowerCase()}`
  cadre.allow = 'accelerometer; gyroscope; magnetometer'
  return cadre
})

/* Pastille et panneau de choix */

const selecteur = document.createElement('div')
selecteur.className = 'selecteur-version'
selecteur.innerHTML = `
  <div class="selecteur-version__panneau" id="selecteur-version-panneau">
    <p class="selecteur-version__titre">Version du site</p>
    <ul class="selecteur-version__liste">
      ${VERSIONS.map(
        (v) => `
        <li>
          <button type="button" class="selecteur-version__choix" data-version="${v.numero}">
            <span class="selecteur-version__repere" aria-hidden="true"></span>
            <span class="selecteur-version__numero">${v.numero}</span>
            <span class="selecteur-version__nom">${v.nom}</span>
          </button>
        </li>`,
      ).join('')}
    </ul>
  </div>
  <button type="button" class="selecteur-version__pastille" aria-expanded="false"
    aria-controls="selecteur-version-panneau" aria-label="Choisir la version du site"></button>
`
const pastille = selecteur.querySelector<HTMLButtonElement>('.selecteur-version__pastille')!
const choix = Array.from(selecteur.querySelectorAll<HTMLButtonElement>('.selecteur-version__choix'))

demo.append(...cadres, selecteur, chargement)

const envoyer = (cadre: HTMLIFrameElement, message: Record<string, unknown>) =>
  cadre.contentWindow?.postMessage({ source: SOURCE_DEMO, ...message }, location.origin)

/* Messages des versions */

const progression = VERSIONS.map(() => 0)
const pretes = VERSIONS.map(() => false)
const remontees = new Map<HTMLIFrameElement, () => void>()

addEventListener('message', (evenement) => {
  const donnees = evenement.data
  const index = cadres.findIndex((c) => c.contentWindow === evenement.source)
  if (evenement.origin !== location.origin || index < 0 || donnees?.source !== SOURCE_DEMO) return
  if (donnees.type === 'progression') progression[index] = Math.max(progression[index], Number(donnees.valeur) || 0)
  if (donnees.type === 'pret') {
    progression[index] = 1
    pretes[index] = true
  }
  if (donnees.type === 'en-haut') remontees.get(cadres[index])?.()
  if (donnees.type === 'menu' && index === actuelle - 1) demo.classList.toggle('demo--menu-ouvert', Boolean(donnees.ouvert))
})

// Les écouteurs sont en place : les versions peuvent commencer à charger
cadres.forEach((cadre, i) => (cadre.src = `${import.meta.env.BASE_URL}${VERSIONS[i].chemin}`))

/* Affichage d'une version */

/** Remonte une version en haut de page (sans animation) et attend qu'elle l'ait fait. */
function remonter(cadre: HTMLIFrameElement) {
  return new Promise<void>((resoudre) => {
    const fin = () => {
      remontees.delete(cadre)
      resoudre()
    }
    remontees.set(cadre, fin)
    envoyer(cadre, { type: 'haut' })
    setTimeout(fin, 250)
  })
}

function montrer(numero: number) {
  actuelle = numero
  cadres.forEach((cadre, i) => {
    const active = i === numero - 1
    cadre.classList.toggle('demo__cadre--actif', active)
    cadre.inert = !active
    cadre.setAttribute('aria-hidden', String(!active))
    envoyer(cadre, { type: 'visibilite', visible: active })
  })
  choix.forEach((bouton) => bouton.setAttribute('aria-current', String(Number(bouton.dataset.version) === numero)))
  demo.classList.remove('demo--menu-ouvert')
  history.replaceState(null, '', numero === 1 ? location.pathname : '#2')
  cadres[numero - 1].contentWindow?.focus()
}

function basculerPanneau(ouvert: boolean) {
  selecteur.classList.toggle('selecteur-version--ouvert', ouvert)
  pastille.setAttribute('aria-expanded', String(ouvert))
}

pastille.addEventListener('click', () => basculerPanneau(!selecteur.classList.contains('selecteur-version--ouvert')))

choix.forEach((bouton) =>
  bouton.addEventListener('click', async () => {
    const numero = Number(bouton.dataset.version)
    basculerPanneau(false)
    if (numero === actuelle) return
    await remonter(cadres[numero - 1])
    montrer(numero)
  }),
)

// Un clic dans une version (autre document) fait perdre le focus à la démo : on ferme le panneau
addEventListener('blur', () => basculerPanneau(false))
document.addEventListener('pointerdown', (e) => {
  if (!selecteur.contains(e.target as Node)) basculerPanneau(false)
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && selecteur.classList.contains('selecteur-version--ouvert')) {
    basculerPanneau(false)
    pastille.focus()
  }
})

/* Suivi du chargement */

const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches
const debutChargement = performance.now()
let affiche = 0

function animerChargement() {
  const cible = progression.reduce((a, b) => a + b, 0) / progression.length
  const toutPret = pretes.every(Boolean)
  const ecoule = performance.now() - debutChargement
  affiche = reduit ? cible : affiche + (cible - affiche) * 0.08
  if (toutPret && cible - affiche < 0.01) affiche = 1

  const valeur = Math.min(99, Math.floor(affiche * 100))
  pourcentage.textContent = `${affiche === 1 ? 100 : valeur} %`
  barre.setAttribute('aria-valuenow', String(affiche === 1 ? 100 : valeur))
  const allumes = Math.floor(affiche * NB_RAYONS)
  rayons.forEach((r, i) => r.classList.toggle('chargement__rayon--allume', i < allumes))
  chargement.style.setProperty('--lueur', affiche.toFixed(3))

  if ((affiche === 1 && ecoule >= DUREE_MIN_CHARGEMENT) || ecoule > DUREE_MAX_CHARGEMENT) {
    if (!toutPret) console.warn('Démo : une version met trop de temps à charger, affichage quand même.')
    terminerChargement()
    return
  }
  requestAnimationFrame(animerChargement)
}

async function terminerChargement() {
  rayons.forEach((r) => r.classList.add('chargement__rayon--allume'))
  coeur.classList.add('chargement__coeur--allume')
  await Promise.all(cadres.map(remonter))
  montrer(actuelle)
  demo.classList.remove('demo--chargement')
  setTimeout(() => chargement.classList.add('chargement--fini'), reduit ? 0 : 450)
  setTimeout(() => chargement.remove(), reduit ? 100 : 1200)
}

requestAnimationFrame(animerChargement)
