// Données centralisées du site. Les valeurs entre crochets sont des placeholders à remplacer.

export const ADRESSE = {
  rue: '24 rue Royale',
  cp: '59800',
  ville: 'Lille',
  quartier: 'Vieux-Lille',
  lat: 50.6395935,
  lon: 3.0583092,
}

export const CONTACT = {
  telephone: '[TELEPHONE]', // ex. 03 20 00 00 00
  telephoneLien: '[TELEPHONE_INTERNATIONAL]', // ex. +33320000000
  email: '[EMAIL]',
  // Numéro WhatsApp au format international sans + ni espaces (ex. 33612345678)
  whatsapp: '[NUMERO_WHATSAPP]',
}

export const RESEAUX = {
  instagram: { label: '@maitailille', url: 'https://www.instagram.com/maitailille/' },
  tiktok: { label: '@maitailille', url: 'https://www.tiktok.com/@maitailille' },
}

export const LIENS_CARTE = {
  itineraire: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${ADRESSE.rue}, ${ADRESSE.cp} ${ADRESSE.ville}`,
  )}`,
  osm: `https://www.openstreetmap.org/?mlat=${ADRESSE.lat}&mlon=${ADRESSE.lon}#map=18/${ADRESSE.lat}/${ADRESSE.lon}`,
  embed: `https://www.openstreetmap.org/export/embed.html?bbox=3.0553%2C50.6384%2C3.0613%2C50.6408&layer=mapnik&marker=${ADRESSE.lat}%2C${ADRESSE.lon}`,
}

/**
 * Horaires en minutes depuis minuit. Une fermeture après minuit dépasse 1440
 * (ex. 02h du matin = 26 * 60). `jour` suit Date.getDay() : 0 = dimanche.
 */
export type Creneau = { jour: number; nom: string; ouverture: number; fermeture: number } | { jour: number; nom: string; ferme: true }

const h = (heures: number) => heures * 60

export const HORAIRES: Creneau[] = [
  { jour: 1, nom: 'Lundi', ferme: true },
  { jour: 2, nom: 'Mardi', ouverture: h(12), fermeture: h(25) },
  { jour: 3, nom: 'Mercredi', ouverture: h(12), fermeture: h(25) },
  { jour: 4, nom: 'Jeudi', ouverture: h(17), fermeture: h(26) },
  { jour: 5, nom: 'Vendredi', ouverture: h(17), fermeture: h(26) },
  { jour: 6, nom: 'Samedi', ouverture: h(17), fermeture: h(26) },
  { jour: 0, nom: 'Dimanche', ouverture: h(17), fermeture: h(25) },
]

export type Plat = { nom: string; detail?: string; prix: string }

export const TAPAS: Plat[] = [
  { nom: 'Poh Pia', detail: 'Nems thaïlandais', prix: '[PRIX]' },
  { nom: 'Poulet satay', prix: '[PRIX]' },
  { nom: 'Beignets de maïs', prix: '[PRIX]' },
  { nom: 'Ailes de poulet frites', detail: 'À la sauce poisson', prix: '[PRIX]' },
  { nom: 'Crevettes croustillantes', detail: 'Enrobées et frites', prix: '[PRIX]' },
]

export const SIGNATURE = {
  nom: 'Maï Taï',
  prix: '12 €',
  ingredients: [
    'Rhum ambré',
    'Rhum blanc',
    'Whisky',
    'Triple sec',
    'Citron vert',
    'Ananas',
    'Orange',
    'Cranberry',
    'Grenadine',
    'Sucre de canne',
  ],
}

export const COCKTAILS: Plat[] = [
  { nom: 'Sex on the Beach', prix: '[PRIX]' },
  { nom: 'Blue Lagoon', prix: '[PRIX]' },
  { nom: 'Tequila Sunrise', prix: '[PRIX]' },
  { nom: 'Long Island', prix: '[PRIX]' },
]

export const BOISSONS: Plat[] = [
  { nom: 'Bières pression', detail: 'Sélection locale', prix: '[PRIX]' },
  { nom: 'Singha', detail: 'Blonde thaïlandaise, en bouteille', prix: '[PRIX]' },
  { nom: 'Vins', prix: '[PRIX]' },
  { nom: 'Champagne', prix: '[PRIX]' },
]
