import { useEffect } from 'react'

/**
 * Repli JavaScript des effets liés au scroll, pour les navigateurs sans
 * `animation-timeline: view()` (Firefox, anciens Safari). Mêmes calculs que le CSS :
 * - [data-parallaxe] : translation verticale des couches (et léger balancement) ;
 * - .menu : variable --ouverture, de « entry 35% » à « cover 50% » ;
 * - .volet-cadre : variable --d, de « entry 0% » à « entry 80% » (menu en accordéon).
 * Un seul écouteur de scroll, calcul regroupé dans requestAnimationFrame.
 */
const borne = (v: number) => Math.min(1, Math.max(0, v))

export function useProfondeur() {
  useEffect(() => {
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const natif = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()')
    if (reduit || natif) return

    const plans = Array.from(document.querySelectorAll<HTMLElement>('[data-parallaxe]'))
    const menus = Array.from(document.querySelectorAll<HTMLElement>('.menu'))
    const cadres = Array.from(document.querySelectorAll<HTMLElement>('.volet-cadre'))
    let raf = 0

    const maj = () => {
      raf = 0
      const vh = window.innerHeight

      for (const plan of plans) {
        const corps = plan.firstElementChild as HTMLElement | null
        if (!corps) continue
        const k = Number(plan.dataset.vitesse) || 0
        const balancement = Number(plan.dataset.balancement) || 0

        if (plan.dataset.parallaxe === 'hero') {
          const y = Math.min(window.scrollY, vh)
          corps.style.translate = `0 ${(-k * y).toFixed(1)}px`
          corps.style.rotate = `calc(var(--r, 0deg) + ${((balancement * y) / vh).toFixed(2)}deg)`
          continue
        }

        const r = plan.getBoundingClientRect()
        if (r.bottom < -vh || r.top > vh * 2) continue
        const d = r.top + r.height / 2 - vh / 2
        const p = borne((vh - r.top) / (vh + r.height))
        corps.style.translate = `0 ${(k * d).toFixed(1)}px`
        corps.style.rotate = `calc(var(--r, 0deg) + ${((2 * p - 1) * balancement).toFixed(2)}deg)`
      }

      for (const menu of menus) {
        const r = menu.getBoundingClientRect()
        const debut = vh - 0.35 * r.height
        const fin = vh / 2 - r.height / 2
        menu.style.setProperty('--ouverture', borne((debut - r.top) / (debut - fin)).toFixed(3))
      }

      for (const cadre of cadres) {
        const r = cadre.getBoundingClientRect()
        cadre.style.setProperty('--d', borne((vh - r.top) / (0.8 * r.height)).toFixed(3))
      }
    }

    const demander = () => {
      if (!raf) raf = requestAnimationFrame(maj)
    }
    maj()
    window.addEventListener('scroll', demander, { passive: true })
    window.addEventListener('resize', demander)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', demander)
      window.removeEventListener('resize', demander)
    }
  }, [])
}
