export const creditRewards = {
  validatedReport: 25,
  reportLeadingToMission: 25,
  firstContributionBonus: 50,
  terrainCheck: 50,
  stormPhotoCheck: 50,
  lightCleaning: 100,
  vegetationCollection: 200,
  lightVegetationMaintenance: 300,
  stormCleanup: 300,
  emergencyAccessClearing: 350,
  supervisedCitizenMission: 600,
  largeMunicipalOperation: 800,
  firstMissionBonus: 100,
  priorityMissionBonus: 50,
} as const;

export const earningGuides = [
  {
    title: 'Signaler un risque utile',
    description: "Jusqu'à 50 crédits après validation municipale.",
    credits:
      creditRewards.validatedReport + creditRewards.reportLeadingToMission,
  },
  {
    title: 'Vérifier une zone',
    description: '15 à 20 min pour confirmer une situation sur le terrain.',
    credits: creditRewards.terrainCheck,
  },
  {
    title: 'Participer a une mission',
    description: '100 à 800 crédits selon la durée et le type de mission.',
    credits: creditRewards.lightCleaning,
  },
  {
    title: 'Mission prioritaire',
    description: 'Bonus appliqué après validation par la mairie.',
    credits: creditRewards.priorityMissionBonus,
  },
];
