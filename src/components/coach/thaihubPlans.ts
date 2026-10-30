export const clubFeatures = [
  'athletes', 'subscriptions', 'incomeExpenses', 'mydata',
] as const;

export const coachFeatures = [
  'programDesign', 'volumeIntensity', 'tests', 'athleteProfile',
] as const;

export const proFeatures = ['nutrition', 'videoAnalysis', 'apps'] as const;

export type ThaiHubPlanFeature = typeof clubFeatures[number] | typeof coachFeatures[number] | typeof proFeatures[number];

export const thaihubPlans = [
  { id: 'club', name: 'Club', monthlyPrice: 29, currency: 'EUR', vatIncluded: true, inheritedPlan: null, additions: clubFeatures, features: [...clubFeatures] },
  { id: 'coach', name: 'Coach', monthlyPrice: 59, currency: 'EUR', vatIncluded: true, inheritedPlan: 'Club', additions: coachFeatures, features: [...clubFeatures, ...coachFeatures] },
  { id: 'pro', name: 'Pro', monthlyPrice: 99, currency: 'EUR', vatIncluded: true, inheritedPlan: 'Coach', additions: proFeatures, features: [...clubFeatures, ...coachFeatures, ...proFeatures] },
] as const;