import { useRef, type CSSProperties } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { SIGNATURE } from '../data/infos'
import { INGREDIENTS, PAS, T0, T_FINALE, T_MELANGE, VERSER, debut } from './cocktail/sequence'
import type { Scene3D } from './cocktail/scene3d'

gsap.registerPlugin(ScrollTrigger, useGSAP)
ScrollTrigger.config({ ignoreMobileResize: true })

/*
  « Le Maï Taï se compose », version 3D temps réel (Three.js, chargé à la demande).
  La timeline GSAP pilote le texte et les étiquettes ; la scène 3D lit le même temps
  (voir cocktail/sequence.ts) pour rester synchronisée.
*/

const NOM = 'Maï Taï'

function webglDisponible() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    // Libère tout de suite ce contexte de test : le navigateur limite le nombre de contextes actifs
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!gl
  } catch {
    return false
  }
}

export default function Composition() {
  const racine = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          anime: '(prefers-reduced-motion: no-preference) and (min-height: 560px)',
          mobile: '(max-width: 760px)',
        },
        (contexte) => {
          const { anime, mobile } = contexte.conditions as { anime: boolean; mobile: boolean }
          const bloc = racine.current
          if (!anime || !bloc || !webglDisponible()) return

          bloc.classList.add('composition--anime')
          const q = gsap.utils.selector(bloc)
          const scene = q('.composition__scene')[0]
          const plateau = q('.composition__stage')[0] as HTMLElement
          const canvas = q('.composition__canvas')[0] as HTMLCanvasElement
          const etiquettes = q('.etiquette') as HTMLElement[]
          const compteur = q('.composition__compteur-valeur')[0]

          let temps = 0
          let scene3d: Scene3D | null = null
          let raf = 0
          let annule = false
          let chargement = false
          let generation = 0

          const tl = gsap.timeline({
            defaults: { ease: 'none', immediateRender: false },
            scrollTrigger: {
              trigger: scene,
              start: 'top top',
              end: () => `+=${window.innerHeight * (mobile ? 2.4 : 3)}`,
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: () => {
                temps = tl.time()
                const verses = temps < T0 + 0.08 ? 0 : Math.min(INGREDIENTS.length, Math.floor((temps - T0 - 0.08) / PAS) + 1)
                compteur.textContent = String(verses).padStart(2, '0')
              },
            },
          })

          tl.to(q('.composition__indice'), { autoAlpha: 0, duration: 0.3 }, 0)

          INGREDIENTS.forEach((_, i) => {
            const s = debut(i)
            const etiquette = etiquettes[i]
            if (mobile) {
              tl.fromTo(etiquette, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.22 }, s + 0.12)
              tl.to(etiquette, { autoAlpha: 0, y: -12, duration: 0.18 }, i < INGREDIENTS.length - 1 ? debut(i + 1) : T_MELANGE)
            } else {
              tl.fromTo(etiquette, { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.3 }, s + 0.14)
              tl.fromTo(etiquette.querySelector('.etiquette__trait'), { scaleX: 0 }, { scaleX: 1, duration: 0.3 }, s + 0.08)
              tl.to(etiquette, { opacity: 0.45, duration: 0.2 }, i < INGREDIENTS.length - 1 ? debut(i + 1) + VERSER / 3 : T_MELANGE)
            }
          })

          tl.to(q('.composition__compteur'), { autoAlpha: 0, duration: 0.25 }, T_FINALE)
          tl.fromTo(q('.cm-lettre'), { '--a': 0 }, { '--a': 1, duration: 0.25, stagger: 0.07, ease: 'power1.in' }, T_FINALE + 0.1)
          tl.fromTo(
            q('.composition__prix, .composition__phrase, .composition__fin-mobile'),
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.08, ease: 'power2.out' },
            T_FINALE + 0.45,
          )
          if (!mobile) tl.to(etiquettes, { opacity: 0.25, duration: 0.4 }, T_FINALE)
          tl.to({}, { duration: 0.5 })

          // Rendu : uniquement quand le plateau est à l'écran
          let dernierePosition = ''
          const placerEtiquettes = (s3d: Scene3D) => {
            const points = s3d.ancres()
            const cle = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(';')
            if (cle === dernierePosition) return // caméra immobile : pas de mise en page inutile
            dernierePosition = cle
            const colonne = Math.max(...points.map((p) => p.x)) + 46
            etiquettes.forEach((el, i) => {
              el.style.left = `${points[i].x.toFixed(1)}px`
              el.style.top = `${points[i].y.toFixed(1)}px`
              el.style.setProperty('--trait', `${(colonne - points[i].x).toFixed(1)}px`)
            })
          }
          const boucle = () => {
            raf = requestAnimationFrame(boucle)
            if (!scene3d) return
            scene3d.rendre(temps)
            if (!mobile) placerEtiquettes(scene3d)
          }
          const demarrer = () => {
            if (!raf) raf = requestAnimationFrame(boucle)
          }
          const arreter = () => {
            cancelAnimationFrame(raf)
            raf = 0
          }

          // La scène n'apparaît qu'une fois entièrement préparée (shaders compilés) ; l'image fixe reste en secours
          const charger = () => {
            chargement = true
            const numero = ++generation
            const abandon = () => annule || numero !== generation
            import('./cocktail/scene3d')
              .then(({ creerScene }) =>
                creerScene(canvas, { mobile, largeur: plateau.clientWidth, hauteur: plateau.clientHeight, abandon }),
              )
              .then((prete) => {
                if (abandon()) {
                  prete.detruire()
                  return
                }
                scene3d = prete
                scene3d.redimensionner(plateau.clientWidth, plateau.clientHeight)
                bloc.classList.remove('composition--sans-3d')
                bloc.classList.add('composition--prete')
              })
              .catch((erreur) => {
                if (abandon()) return
                console.warn('Scène 3D indisponible, image fixe affichée à la place.', erreur)
                bloc.classList.add('composition--sans-3d')
              })
          }

          // Contexte WebGL perdu (pilote graphique réinitialisé, mémoire saturée) : image fixe, puis reconstruction
          const surPerteContexte = (evenement: Event) => {
            evenement.preventDefault() // autorise le navigateur à restaurer le contexte
            generation++
            scene3d?.detruire()
            scene3d = null
            bloc.classList.remove('composition--prete')
            bloc.classList.add('composition--sans-3d')
          }
          const surRestaurationContexte = () => {
            if (!annule && chargement) charger()
          }
          canvas.addEventListener('webglcontextlost', surPerteContexte)
          canvas.addEventListener('webglcontextrestored', surRestaurationContexte)

          const redimension = new ResizeObserver(() => scene3d?.redimensionner(plateau.clientWidth, plateau.clientHeight))
          redimension.observe(plateau)

          // Chargement anticipé (≈ 1,5 écran avant), rendu seulement quand visible
          const approche = new IntersectionObserver(
            ([entree]) => {
              if (entree.isIntersecting && !chargement) charger()
            },
            { rootMargin: '150% 0px' },
          )
          const vue = new IntersectionObserver(([entree]) => (entree.isIntersecting ? demarrer() : arreter()), {
            rootMargin: '10% 0px',
          })
          approche.observe(plateau)
          vue.observe(plateau)

          document.fonts?.ready.then(() => ScrollTrigger.refresh())

          return () => {
            annule = true
            arreter()
            approche.disconnect()
            vue.disconnect()
            redimension.disconnect()
            canvas.removeEventListener('webglcontextlost', surPerteContexte)
            canvas.removeEventListener('webglcontextrestored', surRestaurationContexte)
            scene3d?.detruire()
            scene3d = null
            bloc.classList.remove('composition--anime', 'composition--prete', 'composition--sans-3d')
          }
        },
      )
    },
    { scope: racine },
  )

  return (
    <div className="composition" ref={racine}>
      <div className="composition__scene">
        <div className="container composition__grille">
          <div className="composition__texte">
            <p className="surtitre">Cocktail signature</p>
            <h3 className="composition__nom">
              <span className="sr-only">{NOM}</span>
              <span aria-hidden="true">
                {Array.from(NOM).map((lettre, i) => (
                  <span key={i} className="cm-lettre">
                    {lettre}
                  </span>
                ))}
              </span>
            </h3>
            <div className="composition__etat">
              <p className="composition__compteur" aria-hidden="true">
                <span className="composition__compteur-valeur">00</span> / {INGREDIENTS.length} ingrédients
              </p>
              <p className="composition__prix">{SIGNATURE.prix}</p>
            </div>
            <p className="composition__phrase">
              Celui qui a donné son nom au bar. Steven a appris à le préparer lors d'un voyage en Thaïlande et le sert
              aujourd'hui rue Royale.
            </p>
            <ul className="ingredients composition__liste" aria-label="Ingrédients">
              {SIGNATURE.ingredients.map((ingredient) => (
                <li key={ingredient}>{ingredient}</li>
              ))}
            </ul>
            <p className="composition__indice" aria-hidden="true">
              Faites défiler pour composer le cocktail
            </p>
          </div>

          <div className="composition__plateau">
            <div className="composition__stage">
              <canvas className="composition__canvas" aria-hidden="true" />
              <img
                className="composition__poster"
                src="/images/maitai-3d.webp"
                alt="Verre de Maï Taï ambré et orangé, avec glaçons, paille en bambou et tranche d'ananas"
                width="900"
                height="1125"
                loading="lazy"
              />
              <ol className="composition__etiquettes" aria-hidden="true">
                {INGREDIENTS.map((ingredient, i) => (
                  <li key={ingredient.nom} className="etiquette" style={{ '--couleur': ingredient.couleur } as CSSProperties}>
                    <span className="etiquette__trait" />
                    <span className="etiquette__numero">{String(i + 1).padStart(2, '0')}</span>
                    <span className="etiquette__nom">{ingredient.nom}</span>
                  </li>
                ))}
              </ol>
              <p className="composition__fin-mobile" aria-hidden="true">
                Appris par Steven lors d'un voyage en Thaïlande.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
