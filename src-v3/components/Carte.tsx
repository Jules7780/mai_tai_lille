import { BOISSONS, COCKTAILS, TAPAS, type Plat } from '../data/infos'
import Composition from './Composition'

function ListePlats({ plats }: { plats: Plat[] }) {
  return (
    <ul className="plats">
      {plats.map((plat) => (
        <li key={plat.nom} className="plat">
          <div className="plat__ligne">
            <span className="plat__nom">{plat.nom}</span>
            <span className="plat__pointilles" aria-hidden="true" />
            <span className="plat__prix">{plat.prix}</span>
          </div>
          {plat.detail && <p className="plat__detail">{plat.detail}</p>}
        </li>
      ))}
    </ul>
  )
}

export default function Carte() {
  return (
    <section id="carte" className="section carte">
      <div className="container">
        <header className="section__entete" data-reveal>
          <p className="surtitre">La carte</p>
          <h2 className="titre">À partager, à siroter</h2>
          <p className="section__intro">
            Des petites assiettes thaïes pour grignoter à plusieurs et une carte de cocktails qui sent les vacances.
          </p>
        </header>

      </div>

      <Composition />

      <div className="container">
        <div className="carte__colonnes">
          <div className="carte__bloc" data-reveal>
            <h3 className="carte__titre">Tapas thaïes</h3>
            <p className="carte__note">Préparées maison par Jaruwan</p>
            <ListePlats plats={TAPAS} />
          </div>

          <div className="carte__bloc" data-reveal>
            <h3 className="carte__titre">Cocktails</h3>
            <p className="carte__note">Les grands classiques des plages</p>
            <ListePlats plats={COCKTAILS} />
          </div>

          <div className="carte__bloc" data-reveal>
            <h3 className="carte__titre">Bières, vins & champagne</h3>
            <p className="carte__note">Pressions locales et bière thaïe</p>
            <ListePlats plats={BOISSONS} />
          </div>
        </div>

        <p className="carte__mention">Extrait de la carte, susceptible d'évoluer. Carte complète sur place.</p>
      </div>
    </section>
  )
}
