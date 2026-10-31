export const clubFeatures = [
  'athletes', 'subscriptions', 'incomeExpenses', 'mydata',
] as const;

export const coachFeatures = [
  'programDesign', 'volumeIntensity', 'tests', 'athleteProfile', 'athleteProgress', 'videoAnalysis',
] as const;

export const proFeatures = [
  'federationClubs', 'athleteCards', 'competitions', 'liveWeighIn', 'liveVideo',
  'onlinePayments', 'ranking', 'aiVideoAnalysis',
] as const;

export type ThaiHubPlanFeature = typeof clubFeatures[number] | typeof coachFeatures[number] | typeof proFeatures[number];

export const thaihubPlans = [
  { id: 'club', name: 'Club', yearlyPrice: 450, currency: 'EUR', vatIncluded: true, inheritedPlan: null, additions: clubFeatures, features: [...clubFeatures] },
  { id: 'coach', name: 'Coach', yearlyPrice: 750, currency: 'EUR', vatIncluded: true, inheritedPlan: 'Club', additions: coachFeatures, features: [...clubFeatures, ...coachFeatures] },
  { id: 'pro', name: 'Federation', yearlyPrice: 1500, currency: 'EUR', vatIncluded: true, inheritedPlan: 'Coach', additions: proFeatures, features: [...clubFeatures, ...coachFeatures, ...proFeatures] },
] as const;