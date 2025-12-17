// Centralized training type label helpers for UI.
// Keep these short to fit inside Tabs.

export const TRAINING_TYPE_LABELS: Record<string, string> = {
  // Strength / performance
  str: 'str',
  strength: 'str',
  pwr: 'pwr',
  power: 'pwr',
  spd: 'spd',
  speed: 'spd',
  hpr: 'hpr',

  // Conditioning
  end: 'end',
  endurance: 'end',

  // Mixed types
  acc: 'acc',
  accessory: 'acc',
  'str/end': 'str/end',
  'spd/end': 'spd/end',
  'pwr/end': 'pwr/end',
  'str/spd': 'str/spd',
  'str/pwr': 'str/pwr',
  'pwr/spd': 'pwr/spd',

  // Prep / other
  warmup: 'warmup',
  'warm up': 'warmup',
  warm: 'warmup',
  activation: 'act',
  'neural act': 'neural',
  core: 'core',
  mobility: 'mob',
  stability: 'stab',
  rotational: 'rot',
  recovery: 'rec',
};

export function getTrainingTypeLabel(trainingType?: string, fallback?: string) {
  const key = (trainingType || '').trim().toLowerCase();
  return TRAINING_TYPE_LABELS[key] || fallback || '';
}
