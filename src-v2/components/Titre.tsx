import { Fragment, useLayoutEffect, useRef } from 'react'

type Props = { children: string; className?: string }

/**
 * Titre de section découpé en mots : chaque mot bascule en 3D à l'apparition,
 * décalé selon sa ligne (--ligne), calculée d'après la mise en page réelle.
 */
export default function Titre({ children, className = '' }: Props) {
  const ref = useRef<HTMLHeadingElement>(null)
  const mots = children.split(' ')

  useLayoutEffect(() => {
    const titre = ref.current
    if (!titre) return
    const calculer = () => {
      let ligne = -1
      let haut = -Infinity
      titre.querySelectorAll<HTMLElement>('.mot').forEach((mot, i) => {
        if (mot.offsetTop > haut + 2) {
          ligne++
          haut = mot.offsetTop
        }
        mot.style.setProperty('--ligne', String(ligne))
        mot.style.setProperty('--i', String(i))
      })
    }
    calculer()
    const observateur = new ResizeObserver(calculer)
    observateur.observe(titre)
    document.fonts?.ready.then(calculer)
    return () => observateur.disconnect()
  }, [children])

  return (
    <h2 ref={ref} className={`titre ${className}`}>
      {mots.map((mot, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className="mot">
            <span className="mot__face">{mot}</span>
          </span>
        </Fragment>
      ))}
    </h2>
  )
}
