import type { Mission, Professional, RiskReport } from './risk-types';

export const initialRiskReports: RiskReport[] = [
  {
    id: 'SIG-248',
    title: 'Bordure de parcelle tres seche',
    category: 'Vegetation',
    status: 'Priorise',
    danger: 'Eleve',
    address: 'Chemin des Restanques',
    zone: 'Quartier des Pins',
    reporter: 'Lucas Martin',
    date: "Aujourd'hui",
    coordinates: { x: 62, y: 31 },
    description:
      'Herbes hautes et branches mortes en limite de parcelle, proche de deux habitations.',
    photoLabel: 'vegetation-seche.jpg',
    priorityScore: 84,
  },
  {
    id: 'SIG-241',
    title: 'Acces pompier encombre',
    category: 'Acces secours',
    status: 'Verifie',
    danger: 'Critique',
    address: 'Impasse du Vallon',
    zone: 'Vallon Sud',
    reporter: 'Mairie',
    date: 'Hier',
    coordinates: { x: 42, y: 63 },
    description:
      'Passage retreci par des gravats et palettes. Vehicule de secours difficile a manoeuvrer.',
    photoLabel: 'acces-vallon.jpg',
    priorityScore: 93,
  },
  {
    id: 'SIG-233',
    title: 'Branche menace la voie',
    category: 'Arbre dangereux',
    status: 'Nouveau',
    danger: 'Modere',
    address: 'Route du Belvedere',
    zone: 'Corniche',
    reporter: 'Sarah B.',
    date: 'Lundi',
    coordinates: { x: 71, y: 72 },
    description:
      'Grosse branche fendue au-dessus du bas-cote, risque de chute en cas de vent.',
    photoLabel: 'branche-route.jpg',
    priorityScore: 57,
  },
];

export const initialMissions: Mission[] = [
  {
    id: 'MIS-102',
    title: 'Debroussaillage Restanques',
    reportId: 'SIG-248',
    status: 'Planifiee',
    date: '12 sept.',
    assignee: 'Foret Claire',
    volunteers: 6,
    objective:
      'Degager la vegetation morte sur 120 m et securiser la bordure des habitations.',
  },
  {
    id: 'MIS-099',
    title: 'Degagement acces Vallon',
    reportId: 'SIG-241',
    status: 'A preparer',
    date: 'A definir',
    assignee: 'Services techniques',
    volunteers: 2,
    objective:
      "Retirer les encombrants et verifier le gabarit d'acces secours.",
  },
];

export const professionals: Professional[] = [
  {
    id: 'PRO-1',
    name: 'Foret Claire',
    specialty: 'Debroussaillage',
    availability: 'Disponible cette semaine',
  },
  {
    id: 'PRO-2',
    name: 'Arboris Sud',
    specialty: 'Elagage',
    availability: 'Prochain creneau mardi',
  },
  {
    id: 'PRO-3',
    name: 'Services techniques',
    specialty: 'Voirie communale',
    availability: 'Equipe municipale',
  },
];
