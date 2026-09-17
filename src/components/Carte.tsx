import { BOISSONS, COCKTAILS, SIGNATURE, TAPAS, type Plat } from '../data/infos'
import Soleil from './Soleil'

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

        <article className="signature" data-reveal>
          <Soleil className="signature__soleil" visage={false} />
          <div className="signature__entete">
            <p className="signature__label">Cocktail signature</p>
            <h3 className="signature__nom">{SIGNATURE.nom}</h3>
            <p className="signature__prix">{SIGNATURE.prix}</p>
          </div>
          <div className="signature__corps">
            <p>
              Celui qui a donné son nom au bar. Steven a appris à le préparer lors d'un voyage en Thaïlande et le sert
              aujourd'hui rue Royale.
            </p>
            <ul className="ingredients" aria-label="Ingrédients">
              {SIGNATURE.ingredients.map((ingredient) => (
                <li key={ingredient}>{ingredient}</li>
              ))}
            </ul>
          </div>
        </article>

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
