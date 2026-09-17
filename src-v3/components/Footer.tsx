import { ADRESSE, RESEAUX } from '../data/infos'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grille">
          <div className="footer__marque">
            <Logo />
            <p>Tapas thaïlandaises et cocktails dans le Vieux-Lille.</p>
          </div>

          <div>
            <h2 className="footer__titre">Adresse</h2>
            <p>
              {ADRESSE.rue}
              <br />
              {ADRESSE.cp} {ADRESSE.ville}
            </p>
          </div>

          <div>
            <h2 className="footer__titre">Navigation</h2>
            <ul className="footer__liens">
              <li><a href="#le-bar">Le bar</a></li>
              <li><a href="#carte">La carte</a></li>
              <li><a href="#ambiance">L'ambiance</a></li>
              <li><a href="#infos">Horaires & accès</a></li>
              <li><a href="#reserver">Réserver</a></li>
            </ul>
          </div>

          <div>
            <h2 className="footer__titre">Suivre</h2>
            <ul className="footer__liens">
              <li>
                <a href={RESEAUX.instagram.url} target="_blank" rel="noopener noreferrer">Instagram</a>
              </li>
              <li>
                <a href={RESEAUX.tiktok.url} target="_blank" rel="noopener noreferrer">TikTok</a>
              </li>
            </ul>
          </div>
        </div>

        <p className="footer__moderation">
          L'abus d'alcool est dangereux pour la santé, à consommer avec modération.
        </p>

        <div className="footer__bas">
          <p>© {new Date().getFullYear()} Maï-Taï, Lille</p>
          <p>
            Site réalisé par{' '}
            <a href="https://aditsolutions.be/" target="_blank" rel="noopener noreferrer">
              AD IT Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
