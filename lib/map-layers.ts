export type MapLayerKind =
  | 'cadastre'
  | 'municipal-land'
  | 'private-land'
  | 'risk-zone'
  | 'old-zone'
  | 'fire'
  | 'weather';

export type ParcelLayerSource = {
  id: string;
  label: string;
  kind: MapLayerKind;
  enabled: boolean;
  source: 'mock' | 'official-api-ready' | 'future-data';
  description: string;
};

export const fondettesCenter = {
  lat: 47.4034,
  lng: 0.5986,
};

export const parcelLayers: ParcelLayerSource[] = [
  {
    id: 'cadastre',
    label: 'Parcelles',
    kind: 'cadastre',
    enabled: false,
    source: 'official-api-ready',
    description:
      'Abstraction prevue pour connecter une source cadastrale officielle sans scraper cadastre.gouv.fr.',
  },
  {
    id: 'municipal-land',
    label: 'Terrains municipaux',
    kind: 'municipal-land',
    enabled: false,
    source: 'future-data',
    description: 'Futurs terrains suivis par la commune et ses services.',
  },
  {
    id: 'old-zone',
    label: 'Zones OLD',
    kind: 'old-zone',
    enabled: false,
    source: 'future-data',
    description: 'Zones d’obligation legale de debroussaillement.',
  },
  {
    id: 'weather',
    label: 'Meteo',
    kind: 'weather',
    enabled: false,
    source: 'future-data',
    description: 'Indice vent, secheresse et vigilance a brancher ensuite.',
  },
];
