import { useEffect, useState } from 'react'
import Logo from './Logo'

const LIENS = [
  { href: '#le-bar', label: 'Le bar' },
  { href: '#carte', label: 'La carte' },
  { href: '#ambiance', label: "L'ambiance" },
  { href: '#infos', label: 'Horaires & accès' },
]

export default function Header() {
  const [scrolle, setScrolle] = useState(false)
  const [ouvert, setOuvert] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolle(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-ouvert', ouvert)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ouvert])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 961px)')
    const onChange = () => mq.matches && setOuvert(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const fermer = () => setOuvert(false)

  return (
    <header className={`header ${scrolle || ouvert ? 'header--plein' : ''}`}>
      <div className="container header__inner">
        <a href="#accueil" className="header__logo" onClick={fermer} aria-label="Maï-Taï, retour à l'accueil">
          <Logo />
        </a>

        <nav id="navigation" className={`nav ${ouvert ? 'nav--ouvert' : ''}`} aria-label="Navigation principale">
          <ul className="nav__liste">
            {LIENS.map((lien) => (
              <li key={lien.href}>
                <a href={lien.href} className="nav__lien" onClick={fermer}>
                  {lien.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="#reserver" className="btn btn--neon nav__cta" onClick={fermer}>
            Réserver
          </a>
        </nav>

        <button
          type="button"
          className={`burger ${ouvert ? 'burger--ouvert' : ''}`}
          aria-expanded={ouvert}
          aria-controls="navigation"
          aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setOuvert((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
