export type RiskCategory =
  | 'Vegetation'
  | 'Arbre dangereux'
  | 'Acces secours'
  | 'Orage'
  | 'Autre';

export type RiskStatus =
  | 'Nouveau'
  | 'Verifie'
  | 'Priorise'
  | 'Mission creee'
  | 'Resolu';

export type DangerLevel = 'Faible' | 'Modere' | 'Eleve' | 'Critique';

export type Coordinates = {
  x: number;
  y: number;
};

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type RiskReport = {
  id: string;
  title: string;
  category: RiskCategory;
  status: RiskStatus;
  danger: DangerLevel;
  address: string;
  zone: string;
  reporter: string;
  date: string;
  coordinates: Coordinates;
  geo: GeoPoint;
  description: string;
  photoLabel: string;
  priorityScore: number;
};

export type MissionStatus =
  | 'A preparer'
  | 'Planifiee'
  | 'En cours'
  | 'Terminee';

export type Mission = {
  id: string;
  title: string;
  reportId: string;
  status: MissionStatus;
  date: string;
  assignee: string;
  volunteers: number;
  objective: string;
};

export type Professional = {
  id: string;
  name: string;
  specialty: string;
  availability: string;
};
