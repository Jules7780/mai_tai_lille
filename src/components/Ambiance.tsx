import { RESEAUX } from '../data/infos'

const DETAILS = [
  { titre: 'Mur végétal et bouddhas', texte: 'Derrière le comptoir, les bouteilles se rangent au milieu des plantes.' },
  { titre: 'Toile de jute au plafond', texte: 'Des tentures qui rappellent les bars de plage.' },
  { titre: 'Bois clair sur mesure', texte: 'Les mange-debout ont été fabriqués spécialement pour le lieu.' },
  { titre: 'Musique sans étiquette', texte: 'Pas de style imposé : on passe ce qui plaît à la salle.' },
]

export default function Ambiance() {
  return (
    <section id="ambiance" className="section ambiance">
      <div className="container ambiance__grille">
        <div className="ambiance__texte" data-reveal>
          <p className="surtitre">L'ambiance</p>
          <h2 className="titre">Un bar de plage en plein Vieux-Lille</h2>
          <p className="section__intro">
            Néons verts, mur végétal et objets rapportés de Thaïlande. Toute la décoration a été refaite pour vous faire
            voyager le temps d'un verre.
          </p>

          <ul className="details">
            {DETAILS.map((detail, i) => (
              <li key={detail.titre} className="detail">
                <span className="detail__numero">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="detail__titre">{detail.titre}</h3>
                  <p>{detail.texte}</p>
                </div>
              </li>
            ))}
          </ul>

          <a href={RESEAUX.instagram.url} className="lien-fleche" target="_blank" rel="noopener noreferrer">
            Suivre les soirées sur Instagram {RESEAUX.instagram.label}
          </a>
        </div>

        <div className="ambiance__photos">
          <figure className="ambiance__photo ambiance__photo--1" data-reveal>
            <picture>
              <source media="(max-width: 640px)" srcSet="/images/comptoir-bouddha-640.webp" />
              <img
                src="/images/comptoir-bouddha.webp"
                alt="Deux barmans derrière le comptoir éclairé en vert, sous un grand portrait de Bouddha"
                width="1125"
                height="1880"
                loading="lazy"
              />
            </picture>
          </figure>
          <figure className="ambiance__photo ambiance__photo--2" data-reveal>
            <picture>
              <source media="(max-width: 640px)" srcSet="/images/ambiance-soiree-640.webp" />
              <img
                src="/images/ambiance-soiree.webp"
                alt="Soirée au comptoir du Maï-Taï, néons verts et lumière rose au plafond"
                width="1125"
                height="1880"
                loading="lazy"
              />
            </picture>
          </figure>
        </div>
      </div>
    </section>
  )
}
