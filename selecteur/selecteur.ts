// Pastille discrète pour passer d'une maquette à l'autre pendant la démo.
// Indépendante de React : chaque version garde son code d'origine intact.
import './selecteur.css'

const VERSIONS = [
  { numero: '1', nom: 'Épurée', chemin: '' },
  { numero: '2', nom: 'Feuilles et relief', chemin: 'v2/' },
  { numero: '3', nom: 'Cocktail en 3D', chemin: 'v3/' },
]

const actuelle = document.documentElement.dataset.version ?? '1'

const racine = document.createElement('div')
racine.className = 'selecteur-version'
racine.innerHTML = `
  <div class="selecteur-version__panneau" id="selecteur-version-panneau">
    <p class="selecteur-version__titre">Version du site</p>
    <ul class="selecteur-version__liste">
      ${VERSIONS.map(
        (v) => `
        <li>
          <a class="selecteur-version__lien" href="${import.meta.env.BASE_URL}${v.chemin}"${
            v.numero === actuelle ? ' aria-current="page"' : ''
          }>
            <span class="selecteur-version__repere" aria-hidden="true"></span>
            <span class="selecteur-version__numero">${v.numero}</span>
            <span class="selecteur-version__nom">${v.nom}</span>
          </a>
        </li>`,
      ).join('')}
    </ul>
  </div>
  <button type="button" class="selecteur-version__pastille" aria-expanded="false"
    aria-controls="selecteur-version-panneau" aria-label="Choisir la version du site"></button>
`
document.body.append(racine)

const pastille = racine.querySelector<HTMLButtonElement>('.selecteur-version__pastille')!

function basculer(ouvert: boolean) {
  racine.classList.toggle('selecteur-version--ouvert', ouvert)
  pastille.setAttribute('aria-expanded', String(ouvert))
}

pastille.addEventListener('click', () => basculer(!racine.classList.contains('selecteur-version--ouvert')))

racine.querySelector('[aria-current="page"]')?.addEventListener('click', (e) => {
  e.preventDefault()
  basculer(false)
})

document.addEventListener('pointerdown', (e) => {
  if (!racine.contains(e.target as Node)) basculer(false)
})

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && racine.classList.contains('selecteur-version--ouvert')) {
    basculer(false)
    pastille.focus()
  }
})
