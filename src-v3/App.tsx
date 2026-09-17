import Header from './components/Header'
import Hero from './components/Hero'
import Histoire from './components/Histoire'
import Carte from './components/Carte'
import Ambiance from './components/Ambiance'
import Infos from './components/Infos'
import Reserver from './components/Reserver'
import Footer from './components/Footer'
import { useReveal } from './hooks/useReveal'

export default function App() {
  useReveal()

  return (
    <>
      <a href="#contenu" className="lien-evitement">
        Aller au contenu
      </a>
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
