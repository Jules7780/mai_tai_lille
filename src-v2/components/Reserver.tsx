import { useState, type FormEvent } from 'react'
import { CONTACT, RESEAUX } from '../data/infos'
import Plans from './Plans'
import Titre from './Titre'

/**
 * Pas de backend par défaut : la demande est envoyée via WhatsApp avec un message prérempli.
 * Pour passer sur Formspree, renseigner FORMSPREE_ID et changer MODE en 'formspree'.
 */
const MODE = 'whatsapp' as 'whatsapp' | 'formspree'
const FORMSPREE_ID = '[FORMSPREE_ID]'

type Demande = {
  nom: string
  telephone: string
  date: string
  heure: string
  personnes: string
  message: string
}

const VIDE: Demande = { nom: '', telephone: '', date: '', heure: '', personnes: '2', message: '' }

function formaterMessage(d: Demande) {
  const date = d.date ? new Date(`${d.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''
  return [
    'Bonjour Maï-Taï, je souhaite réserver une table.',
    `Nom : ${d.nom}`,
    `Téléphone : ${d.telephone}`,
    `Date : ${date}`,
    `Heure : ${d.heure}`,
    `Nombre de personnes : ${d.personnes}`,
    d.message && `Message : ${d.message}`,
  ]
    .filter(Boolean)
    .join('\n')
}

async function envoyer(d: Demande) {
  if (MODE === 'formspree') {
    const reponse = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(d),
    })
    if (!reponse.ok) throw new Error('Envoi impossible')
    return
  }
  const url = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(formaterMessage(d))}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function Reserver() {
  const [demande, setDemande] = useState<Demande>(VIDE)
  const [etat, setEtat] = useState<'repos' | 'envoi' | 'ok' | 'erreur'>('repos')
  const aujourdhui = new Date().toISOString().slice(0, 10)

  const maj = (champ: keyof Demande) => (e: { target: { value: string } }) =>
    setDemande((d) => ({ ...d, [champ]: e.target.value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setEtat('envoi')
    try {
      await envoyer(demande)
      setEtat('ok')
      setDemande(VIDE)
    } catch {
      setEtat('erreur')
    }
  }

  return (
    <section id="reserver" className="section reserver">
      <Plans
        elements={[
          { classe: 'plan--reserver-halo', couche: 'arriere', vitesse: -0.4, contenu: 'halo' },
          { classe: 'plan--reserver-palme', couche: 'avant', vitesse: 0.6, balancement: 8, contenu: 'palme' },
          { classe: 'plan--reserver-lanceolee', couche: 'avant', vitesse: 0.9, balancement: -10, contenu: 'lanceolee' },
        ]}
      />
      <div className="container reserver__grille">
        <div className="reserver__texte" data-reveal>
          <p className="surtitre">Réserver</p>
          <Titre>Gardez-nous une table</Titre>
          <p className="section__intro">
            Un afterwork, un anniversaire ou simplement une soirée entre amis : envoyez votre demande, on revient vers
            vous pour la confirmer.
          </p>
          <ul className="reserver__contacts">
            <li>
              <span>Par téléphone</span>
              <a href={`tel:${CONTACT.telephoneLien}`}>{CONTACT.telephone}</a>
            </li>
            <li>
              <span>Sur Instagram</span>
              <a href={RESEAUX.instagram.url} target="_blank" rel="noopener noreferrer">
                {RESEAUX.instagram.label}
              </a>
            </li>
            <li>
              <span>Sur TikTok</span>
              <a href={RESEAUX.tiktok.url} target="_blank" rel="noopener noreferrer">
                {RESEAUX.tiktok.label}
              </a>
            </li>
          </ul>
        </div>

        <form className="panneau formulaire" onSubmit={onSubmit} data-reveal>
          <div className="champ champ--large">
            <label htmlFor="nom">Nom</label>
            <input id="nom" name="nom" autoComplete="name" required value={demande.nom} onChange={maj('nom')} />
          </div>
          <div className="champ champ--large">
            <label htmlFor="telephone">Téléphone</label>
            <input
              id="telephone"
              name="telephone"
              type="tel"
              autoComplete="tel"
              required
              value={demande.telephone}
              onChange={maj('telephone')}
            />
          </div>
          <div className="champ">
            <label htmlFor="date">Date</label>
            <input id="date" name="date" type="date" min={aujourdhui} required value={demande.date} onChange={maj('date')} />
          </div>
          <div className="champ">
            <label htmlFor="heure">Heure</label>
            <input id="heure" name="heure" type="time" required value={demande.heure} onChange={maj('heure')} />
          </div>
          <div className="champ champ--large">
            <label htmlFor="personnes">Nombre de personnes</label>
            <select id="personnes" name="personnes" value={demande.personnes} onChange={maj('personnes')}>
              {Array.from({ length: 11 }, (_, i) => String(i + 1)).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value="12 ou plus">12 ou plus</option>
            </select>
          </div>
          <div className="champ champ--large">
            <label htmlFor="message">
              Message <span className="champ__optionnel">(facultatif)</span>
            </label>
            <textarea id="message" name="message" rows={3} value={demande.message} onChange={maj('message')} />
          </div>

          <button type="submit" className="btn btn--neon btn--plein" disabled={etat === 'envoi'}>
            {etat === 'envoi' ? 'Envoi…' : 'Envoyer ma demande'}
          </button>

          <p className="formulaire__retour" role="status" aria-live="polite">
            {etat === 'ok' &&
              (MODE === 'whatsapp'
                ? 'Merci ! Votre message est prêt dans WhatsApp, il ne reste plus qu’à l’envoyer.'
                : 'Merci ! Votre demande a bien été envoyée, nous revenons vers vous rapidement.')}
            {etat === 'erreur' && 'La demande n’a pas pu être envoyée. Appelez-nous ou écrivez-nous sur Instagram.'}
          </p>
          <p className="formulaire__mention">
            Vos informations servent uniquement à traiter votre réservation.
          </p>
        </form>
      </div>
    </section>
  )
}
