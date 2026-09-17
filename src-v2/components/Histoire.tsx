import Plans from './Plans'
import Titre from './Titre'

export default function Histoire() {
  return (
    <section id="le-bar" className="section histoire">
      <Plans
        elements={[
          { classe: 'plan--histoire-lanceolee', couche: 'avant', vitesse: 0.8, balancement: 10, contenu: 'lanceolee' },
          { classe: 'plan--histoire-fougere', couche: 'avant', vitesse: 0.6, balancement: -8, contenu: 'fougere' },
        ]}
      />
      <div className="container histoire__grille">
        <div className="histoire__texte" data-reveal>
          <p className="surtitre">Le bar</p>
          <Titre>Deux amis, un bout de Thaïlande rue Royale</Titre>
          <p>
            Reda et Steven sont amis depuis six ans et partagent le même attachement à la Thaïlande. Ils y sont
            retournés à de nombreuses reprises, en vacances puis pour chercher l'inspiration, avant de passer deux ans à
            chercher le bon local à Lille.
          </p>
          <p>
            Maï-Taï a ouvert le 27 août 2026 au 24 rue Royale, à la place de l'ancienne Cantina. Mur végétal, bouddhas,
            bois clair et objets rapportés de là-bas : le décor a été entièrement repensé. Côté cuisine, c'est Jaruwan,
            la femme de Steven, qui prépare les tapas inspirées de la cuisine de son pays.
          </p>

          <blockquote className="citation">
            <p>« On adore ce pays et on voulait créer un lieu qui nous ressemble. »</p>
            <footer>Reda et Steven, fondateurs</footer>
          </blockquote>
        </div>

        <figure className="histoire__photo" data-reveal>
          <picture data-inclinaison>
            <source media="(max-width: 640px)" srcSet="/images/mur-vegetal-bar-640.webp" />
            <img
              src="/images/mur-vegetal-bar.webp"
              alt="Le mur végétal derrière le comptoir, avec ses étagères de bouteilles et un portrait de Bouddha"
              width="960"
              height="640"
              loading="lazy"
            />
          </picture>
          <figcaption>Le comptoir, son mur végétal et ses pressions</figcaption>
        </figure>
      </div>
    </section>
  )
}
