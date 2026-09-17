import type { CSSProperties } from 'react'
import type { FormeFeuille } from '../data/feuilles'
import Feuille from './Feuille'
import Soleil from './Soleil'

/**
 * Couches de profondeur d'une section.
 * - `avant` : feuilles au premier plan, plus rapides que le scroll (vitesse > 0).
 * - `arriere` : halos et soleil en filigrane, plus lents (vitesse < 0).
 * La vitesse est l'écart par rapport au défilement : 0.6 = ×1,6 ; -0.4 = ×0,6.
 * La position et la rotation de chaque élément sont définies en CSS via sa classe.
 */
export type ElementPlan = {
  classe: string
  couche: 'avant' | 'arriere'
  vitesse: number
  balancement?: number
  contenu: FormeFeuille | 'halo' | 'soleil'
}

type Props = { elements: ElementPlan[]; hero?: boolean }

function Contenu({ contenu }: { contenu: ElementPlan['contenu'] }) {
  if (contenu === 'halo') return <div className="halo" />
  if (contenu === 'soleil') return <Soleil className="filigrane" visage={false} />
  return <Feuille forme={contenu} />
}

export default function Plans({ elements, hero = false }: Props) {
  return (
    <>
      {(['arriere', 'avant'] as const).map((couche) => (
        <div key={couche} className={`plans plans--${couche}`} aria-hidden="true">
          {elements
            .filter((e) => e.couche === couche)
            .map((e) => (
              <div
                key={e.classe}
                className={`plan ${e.classe}`}
                data-parallaxe={hero ? 'hero' : 'vue'}
                data-vitesse={e.vitesse}
                data-balancement={e.balancement ?? 0}
                style={{ '--k': e.vitesse, '--balancement': `${e.balancement ?? 0}deg` } as CSSProperties}
              >
                <div className="plan__corps">
                  <Contenu contenu={e.contenu} />
                </div>
              </div>
            ))}
        </div>
      ))}
    </>
  )
}
