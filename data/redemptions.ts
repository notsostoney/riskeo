import type { Reward } from './rewards';

export type CreditTransaction = {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend';
  source: 'mission' | 'report' | 'bonus' | 'reward';
  sourceId: string;
  createdAt: string;
  label: string;
};

export type RedemptionStatus = 'Valide' | 'Utilise' | 'Expire';

export type RewardPass = {
  id: string;
  rewardId: string;
  rewardTitle: string;
  partnerName: string;
  rewardRedemptionId: string;
  createdAt: string;
  expiresAt: string;
  status: RedemptionStatus;
};

export const creditsBalance = 860;

export const creditTransactions: CreditTransaction[] = [
  {
    id: 'tx-300-vegetation',
    userId: 'lucas',
    amount: 300,
    type: 'earn',
    source: 'mission',
    sourceId: 'MIS-102',
    createdAt: '12 septembre',
    label: 'Entretien végétation',
  },
  {
    id: 'tx-25-report',
    userId: 'lucas',
    amount: 25,
    type: 'earn',
    source: 'report',
    sourceId: 'SIG-248',
    createdAt: '9 septembre',
    label: 'Signalement validé',
  },
  {
    id: 'tx-500-pool',
    userId: 'lucas',
    amount: -500,
    type: 'spend',
    source: 'reward',
    sourceId: 'pool-1',
    createdAt: '3 septembre',
    label: 'Entrée piscine',
  },
  {
    id: 'tx-50-check',
    userId: 'lucas',
    amount: 50,
    type: 'earn',
    source: 'mission',
    sourceId: 'MIS-088',
    createdAt: '28 août',
    label: 'Controle terrain',
  },
];

export const rewardPasses: RewardPass[] = [
  {
    id: 'pass-pool-used',
    rewardId: 'pool-1',
    rewardTitle: '1 entrée piscine',
    partnerName: 'Espace aquatique Ô-Bleue',
    rewardRedemptionId: 'RR-OBL-240903',
    createdAt: '3 septembre',
    expiresAt: '2 decembre',
    status: 'Utilise',
  },
];

export const cityCreditStats = {
  creditsDistributed: 12650,
  creditsSpent: 8450,
  rewardsUsed: 21,
  partnersUsed: 12,
  municipalEquipmentsUsed: 5,
  citizenBeneficiaries: 14,
  topCategories: [
    { label: 'Piscine', value: 32 },
    { label: 'Commerces', value: 28 },
    { label: 'Cinéma', value: 18 },
    { label: 'Sport', value: 14 },
  ],
};

export function createRewardPass(
  reward: Reward,
  partnerName: string,
): RewardPass {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(now.getDate() + (reward.validityDays ?? 60));

  return {
    id: `pass-${reward.id}-${now.getTime()}`,
    rewardId: reward.id,
    rewardTitle: reward.title,
    partnerName,
    rewardRedemptionId: `RR-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    createdAt: now.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    }),
    expiresAt: expiresAt.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    }),
    status: 'Valide',
  };
}
