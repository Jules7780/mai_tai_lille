import { useStatut } from '../hooks/useStatut'
import { ADRESSE } from '../data/infos'
import Plans from './Plans'

export default function Hero() {
  const statut = useStatut()

  return (
    <section id="accueil" className="hero">
      <Plans
        hero
        elements={[
          { classe: 'plan--hero-soleil', couche: 'arriere', vitesse: -0.45, balancement: 12, contenu: 'soleil' },
          { classe: 'plan--hero-halo', couche: 'arriere', vitesse: -0.4, contenu: 'halo' },
          { classe: 'plan--hero-monstera', couche: 'avant', vitesse: 0.55, balancement: 8, contenu: 'monstera' },
          { classe: 'plan--hero-palme', couche: 'avant', vitesse: 0.35, balancement: -6, contenu: 'palme' },
          { classe: 'plan--hero-fougere', couche: 'avant', vitesse: 0.7, balancement: 5, contenu: 'fougere' },
        ]}
      />
      <div className="container hero__grille">
        <div className="hero__texte">
          <p className="hero__salut" lang="th">
            สวัสดี
          </p>
          <p className="surtitre">Bar thaï · {ADRESSE.quartier}</p>
          <h1 className="hero__titre">Maï-Taï</h1>
          <p className="hero__intro">
            Tapas thaïlandaises, cocktails aux airs de vacances et pressions locales. Une escale en Thaïlande au{' '}
            {ADRESSE.rue}, sans quitter Lille.
          </p>
          <div className="hero__actions">
            <a href="#carte" className="btn btn--neon">
              Découvrir la carte
            </a>
            <a href="#reserver" className="btn btn--contour">
              Réserver une table
            </a>
          </div>
          <a href="#infos" className={`statut ${statut.ouvert ? 'statut--ouvert' : ''}`}>
            <span className="statut__point" aria-hidden="true" />
            {statut.libelle}
          </a>
        </div>

        <figure className="hero__visuel" data-inclinaison="souris">
          <picture>
            <source media="(max-width: 640px)" srcSet="/images/enseigne-neon-mobile.webp" />
            <source media="(max-width: 960px)" srcSet="/images/enseigne-neon-640.webp" />
            <img
              src="/images/enseigne-neon.webp"
              alt="L'enseigne néon verte du Maï-Taï, un soleil au-dessus du nom du bar, sur le mur végétal"
              width="1125"
              height="1870"
              fetchPriority="high"
            />
          </picture>
        </figure>
      </div>

      <div className="bandeau" aria-hidden="true">
        <div className="bandeau__piste">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="bandeau__groupe">
              <span>Tapas thaïes</span>
              <span>Cocktails</span>
              <span>Pressions locales</span>
              <span>Singha</span>
              <span>Rue Royale</span>
              <span>Vieux-Lille</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
