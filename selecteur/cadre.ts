// Chargé dans chaque version : quand la page est affichée dans la démo (selecteur.ts), elle charge tout
// d'avance (images, plan, polices, scène 3D), signale sa progression, puis obéit aux commandes du parent.
// Ouverte seule, la page fonctionne normalement et ce script ne fait rien.
import { SOURCE_DEMO } from './protocole'

const version = document.documentElement.dataset.version ?? '1'
const dansLaDemo = window.parent !== window

const envoyer = (message: Record<string, unknown>) =>
  window.parent.postMessage({ source: SOURCE_DEMO, version, ...message }, location.origin)

const attendre = (ms: number) => new Promise<void>((resoudre) => setTimeout(resoudre, ms))
const auPlusTard = (promesse: Promise<unknown>, ms: number) => Promise.race([promesse.catch(() => {}), attendre(ms)])

function quandClasse(element: Element, classes: string[]) {
  return new Promise<void>((resoudre) => {
    const atteint = () => classes.some((c) => element.classList.contains(c))
    if (atteint()) return resoudre()
    const observateur = new MutationObserver(() => {
      if (!atteint()) return
      observateur.disconnect()
      resoudre()
    })
    observateur.observe(element, { attributes: true, attributeFilter: ['class'] })
  })
}

async function toutCharger() {
  envoyer({ type: 'progression', valeur: 0.05 })
  if (document.readyState !== 'complete') await new Promise((resoudre) => addEventListener('load', resoudre, { once: true }))
  // Attend le premier rendu de l'application et la pose des classes par ses effets
  const racine = document.getElementById('root')
  while (racine && racine.childElementCount === 0) await attendre(20)
  await attendre(80)

  const images = Array.from(document.images)
  const plans = Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe[loading="lazy"]'))
  const scene3d = document.querySelector('.composition--anime')
  const POIDS_3D = 8
  const total = images.length + plans.length + 1 + (scene3d ? POIDS_3D : 0)
  let fait = 0
  const suivre = (promesse: Promise<unknown>, poids = 1) =>
    promesse.then(() => {
      fait += poids
      envoyer({ type: 'progression', valeur: 0.05 + (0.95 * fait) / total })
    })

  const taches = [
    ...images.map((image) => {
      image.loading = 'eager'
      return suivre(auPlusTard(image.decode(), 20000))
    }),
    ...plans.map((plan) => {
      const charge = new Promise((resoudre) => plan.addEventListener('load', resoudre, { once: true }))
      plan.loading = 'eager'
      return suivre(auPlusTard(charge, 8000))
    }),
    suivre(auPlusTard(document.fonts.ready, 8000)),
  ]
  if (scene3d) taches.push(suivre(auPlusTard(quandClasse(scene3d, ['composition--prete', 'composition--sans-3d']), 30000), POIDS_3D))

  await Promise.all(taches)
  envoyer({ type: 'pret' })
}

if (dansLaDemo) {
  addEventListener('message', (evenement) => {
    const donnees = evenement.data
    if (evenement.origin !== location.origin || evenement.source !== window.parent || donnees?.source !== SOURCE_DEMO) return
    if (donnees.type === 'visibilite') {
      document.documentElement.classList.toggle('cadre-masque', !donnees.visible)
    }
    if (donnees.type === 'haut') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      setTimeout(() => envoyer({ type: 'en-haut' }), 60)
    }
  })

  // Menu mobile ouvert : le parent masque la pastille pour ne pas gêner
  let menuOuvert = false
  new MutationObserver(() => {
    const ouvert = document.body.classList.contains('menu-ouvert')
    if (ouvert === menuOuvert) return
    menuOuvert = ouvert
    envoyer({ type: 'menu', ouvert })
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] })

  toutCharger()
}
