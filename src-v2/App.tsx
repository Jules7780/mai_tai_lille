import Header from './components/Header'
import Hero from './components/Hero'
import Histoire from './components/Histoire'
import Carte from './components/Carte'
import Ambiance from './components/Ambiance'
import Infos from './components/Infos'
import Reserver from './components/Reserver'
import Footer from './components/Footer'
import { useReveal } from './hooks/useReveal'
import { useProfondeur } from './hooks/useProfondeur'
import { useInclinaison } from './hooks/useInclinaison'

export default function App() {
  useReveal()
  useProfondeur()
  useInclinaison()

  return (
    <>
      <a href="#contenu" className="lien-evitement">
        Aller au contenu
      </a>
      {/* Dégradé partagé par toutes les feuilles */}
      <svg className="defs-svg" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="degrade-feuille" x1="0" y1="1" x2="0.3" y2="0">
            <stop offset="0" stopColor="#081a10" />
            <stop offset="1" stopColor="#123822" />
          </linearGradient>
        </defs>
      </svg>
      <Header />
      <main id="contenu">
        <Hero />
        <Histoire />
        <Carte />
        <Ambiance />
        <Infos />
        <Reserver />
      </main>
      <Footer />
    </>
  )
}
