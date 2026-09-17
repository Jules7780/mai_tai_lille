import { useEffect } from 'react'

const borne = (v: number, max: number) => Math.min(max, Math.max(-max, v))

type OrientationAvecPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

/**
 * Relief 3D des éléments [data-inclinaison] :
 * - souris : inclinaison selon la position du curseur, avec un reflet qui le suit ;
 * - tactile : inclinaison pilotée par le gyroscope (variables --gyro-* sur <html>).
 *   Sur iOS, l'autorisation est demandée au premier toucher d'une photo, sinon rien.
 * [data-inclinaison="souris"] ne réagit qu'à la souris.
 */
export function useInclinaison(angleMax = 8) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-inclinaison]'))
    const nettoyages: Array<() => void> = []

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      elements.forEach((el) => {
        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width
          const py = (e.clientY - r.top) / r.height
          el.style.setProperty('--ry', `${((px - 0.5) * 2 * angleMax).toFixed(2)}deg`)
          el.style.setProperty('--rx', `${((0.5 - py) * 2 * angleMax).toFixed(2)}deg`)
          el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
          el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
          el.classList.add('is-incline')
        }
        const onLeave = () => {
          el.style.setProperty('--rx', '0deg')
          el.style.setProperty('--ry', '0deg')
          el.classList.remove('is-incline')
        }
        el.addEventListener('pointermove', onMove)
        el.addEventListener('pointerleave', onLeave)
        nettoyages.push(() => {
          el.removeEventListener('pointermove', onMove)
          el.removeEventListener('pointerleave', onLeave)
        })
      })
      return () => nettoyages.forEach((n) => n())
    }

    if (!('DeviceOrientationEvent' in window)) return
    const racine = document.documentElement
    const cible = { rx: 0, ry: 0 }
    const courant = { rx: 0, ry: 0 }
    let base: { beta: number; gamma: number } | null = null
    let raf = 0

    const boucle = () => {
      raf = 0
      courant.rx += (cible.rx - courant.rx) * 0.12
      courant.ry += (cible.ry - courant.ry) * 0.12
      racine.style.setProperty('--gyro-rx', `${courant.rx.toFixed(2)}deg`)
      racine.style.setProperty('--gyro-ry', `${courant.ry.toFixed(2)}deg`)
      racine.style.setProperty('--gyro-mx', `${(50 + (courant.ry / angleMax) * 40).toFixed(1)}%`)
      racine.style.setProperty('--gyro-my', `${(50 - (courant.rx / angleMax) * 40).toFixed(1)}%`)
      if (Math.abs(cible.rx - courant.rx) + Math.abs(cible.ry - courant.ry) > 0.02) raf = requestAnimationFrame(boucle)
    }

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return
      if (!base) {
        base = { beta: e.beta, gamma: e.gamma }
        racine.classList.add('gyro-actif')
      }
      // La position de repos suit lentement la façon dont le téléphone est tenu
      base.beta += (e.beta - base.beta) * 0.02
      base.gamma += (e.gamma - base.gamma) * 0.02
      cible.rx = borne(-(e.beta - base.beta) * 0.6, angleMax)
      cible.ry = borne((e.gamma - base.gamma) * 0.6, angleMax)
      if (!raf) raf = requestAnimationFrame(boucle)
    }

    const demarrer = () => window.addEventListener('deviceorientation', onOrientation)
    nettoyages.push(() => {
      window.removeEventListener('deviceorientation', onOrientation)
      cancelAnimationFrame(raf)
      racine.classList.remove('gyro-actif')
    })

    const Orientation = DeviceOrientationEvent as OrientationAvecPermission
    if (typeof Orientation.requestPermission === 'function') {
      // iOS : l'autorisation doit suivre un geste, on la demande au premier toucher d'une photo
      const tactiles = elements.filter((el) => el.dataset.inclinaison !== 'souris')
      const demander = async () => {
        tactiles.forEach((el) => el.removeEventListener('click', demander))
        try {
          if ((await Orientation.requestPermission!()) === 'granted') demarrer()
        } catch {
          // Autorisation refusée ou indisponible : l'effet reste désactivé
        }
      }
      tactiles.forEach((el) => el.addEventListener('click', demander))
      nettoyages.push(() => tactiles.forEach((el) => el.removeEventListener('click', demander)))
    } else {
      demarrer()
    }

    return () => nettoyages.forEach((n) => n())
  }, [angleMax])
}
