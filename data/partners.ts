import type { RewardCategory } from './rewards';

export type Partner = {
  id: string;
  name: string;
  category: RewardCategory;
  subtitle: string;
  location: string;
  distance: string;
  type: 'commerce' | 'municipal';
  fictional?: boolean;
  isDemoPartner: true;
};

export const partners: Partner[] = [
  {
    id: 'maison-nardeux',
    name: 'Maison Nardeux',
    category: 'food',
    subtitle: 'Boulangerie / pâtisserie',
    location: 'Fondettes centre',
    distance: '600 m',
    type: 'commerce',
    isDemoPartner: true,
  },
  {
    id: 'boulangerie-ribeaucourt',
    name: 'Boulangerie Ribeaucourt',
    category: 'food',
    subtitle: 'Boulangerie artisanale',
    location: 'Route de Luynes',
    distance: '900 m',
    type: 'commerce',
    isDemoPartner: true,
  },
  {
    id: 'boucherie-centre',
    name: 'Boucherie Charcuterie du Centre',
    category: 'food',
    subtitle: 'Commerce de bouche',
    location: 'Fondettes centre',
    distance: '700 m',
    type: 'commerce',
    isDemoPartner: true,
  },
  {
    id: 'atelier-coiffure',
    name: "L'Atelier Coiffure",
    category: 'hair',
    subtitle: 'Salon partenaire',
    location: 'Avenue du Général de Gaulle',
    distance: '800 m',
    type: 'commerce',
    isDemoPartner: true,
  },
  {
    id: 'ligne-verte',
    name: 'Ligne Verte Coiffure',
    category: 'hair',
    subtitle: 'Coiffure mixte',
    location: 'Quartier des Pins',
    distance: '1,1 km',
    type: 'commerce',
    isDemoPartner: true,
  },
  {
    id: 'source-bien-etre',
    name: 'Source Bien-Être',
    category: 'wellness',
    subtitle: 'Institut et soins',
    location: 'Fondettes nord',
    distance: '1,4 km',
    type: 'commerce',
    isDemoPartner: true,
  },
  {
    id: 'table-des-rives',
    name: 'La Table des Rives',
    category: 'restaurant',
    subtitle: 'Restaurant local',
    location: 'Bords de Loire',
    distance: '1,6 km',
    type: 'commerce',
    isDemoPartner: true,
  },
  {
    id: 'jardin-gourmand',
    name: 'Le Jardin Gourmand',
    category: 'restaurant',
    subtitle: 'Cuisine de saison',
    location: 'Fondettes ouest',
    distance: '1,9 km',
    type: 'commerce',
    isDemoPartner: true,
  },
  {
    id: 'o-bleue',
    name: 'Espace aquatique Ô-Bleue',
    category: 'pool',
    subtitle: 'Équipement aquatique',
    location: 'Fondettes',
    distance: '1,2 km',
    type: 'municipal',
    isDemoPartner: true,
  },
  {
    id: 'terrains-municipaux',
    name: 'Terrains municipaux',
    category: 'sport',
    subtitle: 'Reservations sportives',
    location: 'Complexe sportif',
    distance: '1,5 km',
    type: 'municipal',
    isDemoPartner: true,
  },
  {
    id: 'salle-culturelle',
    name: 'Salle culturelle de Fondettes',
    category: 'show',
    subtitle: 'Spectacles et événements',
    location: 'Fondettes',
    distance: '900 m',
    type: 'municipal',
    isDemoPartner: true,
  },
  {
    id: 'mediatheque',
    name: 'Médiathèque de Fondettes',
    category: 'culture',
    subtitle: 'Culture et ateliers',
    location: 'Fondettes centre',
    distance: '650 m',
    type: 'municipal',
    isDemoPartner: true,
  },
  {
    id: 'cine-des-rives',
    name: 'Le Ciné des Rives',
    category: 'cinema',
    subtitle: 'Cinéma municipal de Fondettes',
    location: 'Fondettes',
    distance: '1 km',
    type: 'municipal',
    fictional: true,
    isDemoPartner: true,
  },
];
