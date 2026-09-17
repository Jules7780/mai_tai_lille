import { BOISSONS, COCKTAILS, SIGNATURE, TAPAS, type Plat } from '../data/infos'
import Feuille from './Feuille'
import Plans from './Plans'
import Soleil from './Soleil'
import Titre from './Titre'

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

const VOLETS = [
  { cote: 'gauche', titre: 'Tapas thaïes', note: 'Préparées maison par Jaruwan', plats: TAPAS },
  { cote: 'centre', titre: 'Cocktails', note: 'Les grands classiques des plages', plats: COCKTAILS },
  { cote: 'droite', titre: 'Bières, vins & champagne', note: 'Pressions locales et bière thaïe', plats: BOISSONS },
] as const

export default function Carte() {
  return (
    <section id="carte" className="section carte">
      <Plans
        elements={[
          { classe: 'plan--carte-soleil', couche: 'arriere', vitesse: -0.35, balancement: 10, contenu: 'soleil' },
          { classe: 'plan--carte-palme', couche: 'avant', vitesse: 0.6, balancement: 6, contenu: 'palme' },
        ]}
      />

      <div className="container">
        <header className="section__entete" data-reveal>
          <p className="surtitre">La carte</p>
          <Titre>À partager, à siroter</Titre>
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

        {/* Menu plié en trois volets : il s'ouvre en 3D au scroll (accordéon sur tablette et mobile) */}
        <div className="menu">
          <div className="menu__volets">
            {VOLETS.map((volet) => (
              <div key={volet.cote} className={`volet-cadre volet-cadre--${volet.cote}`}>
                <div className={`volet volet--${volet.cote}`}>
                  <div className="volet__recto">
                    <h3 className="carte__titre">{volet.titre}</h3>
                    <p className="carte__note">{volet.note}</p>
                    <ListePlats plats={volet.plats} />
                  </div>

                  {volet.cote === 'gauche' && (
                    <div className="volet__verso volet__verso--couverture" aria-hidden="true">
                      <Soleil className="couverture__soleil" />
                      <p className="couverture__nom">Maï-Taï</p>
                      <p className="couverture__sous-titre">La carte</p>
                    </div>
                  )}
                  {volet.cote === 'droite' && (
                    <div className="volet__verso volet__verso--motif" aria-hidden="true">
                      <Feuille forme="monstera" className="motif__feuille" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="carte__mention">Extrait de la carte, susceptible d'évoluer. Carte complète sur place.</p>
      </div>
    </section>
  )
}
