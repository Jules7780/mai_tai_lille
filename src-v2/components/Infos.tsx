import { ADRESSE, CONTACT, HORAIRES, LIENS_CARTE } from '../data/infos'
import { useStatut } from '../hooks/useStatut'
import { formatHeure } from '../utils/horaires'
import Plans from './Plans'
import Titre from './Titre'

export default function Infos() {
  const statut = useStatut()

  return (
    <section id="infos" className="section infos">
      <Plans
        elements={[
          { classe: 'plan--infos-soleil', couche: 'arriere', vitesse: -0.3, balancement: -8, contenu: 'soleil' },
        ]}
      />
      <div className="container">
        <header className="section__entete" data-reveal>
          <p className="surtitre">Infos pratiques</p>
          <Titre>Horaires & accès</Titre>
        </header>

        <div className="infos__grille">
          <div className="panneau horaires" data-reveal>
            <div className="horaires__entete">
              <h3 className="panneau__titre">Horaires</h3>
              <p className={`statut statut--petit ${statut.ouvert ? 'statut--ouvert' : ''}`}>
                <span className="statut__point" aria-hidden="true" />
                {statut.libelle}
              </p>
            </div>

            <table className="horaires__table">
              <caption className="sr-only">Horaires d'ouverture du Maï-Taï</caption>
              <tbody>
                {HORAIRES.map((creneau) => {
                  const actif = creneau.jour === statut.jourService
                  return (
                    <tr key={creneau.nom} className={actif ? 'is-actif' : ''} aria-current={actif ? 'date' : undefined}>
                      <th scope="row">{creneau.nom}</th>
                      <td>
                        {'ferme' in creneau ? (
                          <span className="horaires__ferme">Fermé</span>
                        ) : (
                          `${formatHeure(creneau.ouverture)} – ${formatHeure(creneau.fermeture)}`
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="horaires__note">Ouvert dès midi le mardi et le mercredi.</p>
          </div>

          <div className="panneau acces" data-reveal>
            <div className="acces__carte">
              <iframe
                title="Plan d'accès au Maï-Taï, 24 rue Royale à Lille"
                src={LIENS_CARTE.embed}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="acces__corps">
              <h3 className="panneau__titre">Nous trouver</h3>
              <address className="acces__adresse">
                {ADRESSE.rue}
                <br />
                {ADRESSE.cp} {ADRESSE.ville}
                <span>{ADRESSE.quartier}</span>
              </address>
              <ul className="acces__contacts">
                <li>
                  <span>Téléphone</span>
                  <a href={`tel:${CONTACT.telephoneLien}`}>{CONTACT.telephone}</a>
                </li>
                <li>
                  <span>E-mail</span>
                  <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                </li>
              </ul>
              <div className="acces__actions">
                <a href={LIENS_CARTE.itineraire} className="btn btn--neon" target="_blank" rel="noopener noreferrer">
                  Itinéraire
                </a>
                <a href={LIENS_CARTE.osm} className="btn btn--contour" target="_blank" rel="noopener noreferrer">
                  Voir le plan
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
