export type StrikeCategory = 'punch' | 'kick' | 'knee' | 'elbow';
export type PhaseType = 'attack' | 'defense';

export interface ActionPhase {
  id: string;
  type: PhaseType;
  roundNumber: number;
  startTime: number;  // seconds from round start
  endTime: number | null;  // null = still active
  strikes: StrikeEvent[];
}

export interface StrikeEvent {
  id: string;
  strikeType: string;
  category: StrikeCategory | null;
  side: string | null;
  timestamp: number; // seconds
}

export interface RoundData {
  roundNumber: number;
  attackSeconds: number;
  defenseSeconds: number;
  totalStrikes: number;
  attackStrikes: number;
  defenseStrikes: number;
  punches: number;
  kicks: number;
  knees: number;
  elbows: number;
}

export const STRIKE_BUTTONS = [
  { type: 'jab', category: 'punch' as StrikeCategory, label: 'Jab', side: 'left', icon: '👊' },
  { type: 'cross', category: 'punch' as StrikeCategory, label: 'Cross', side: 'right', icon: '🥊' },
  { type: 'hook', category: 'punch' as StrikeCategory, label: 'Hook', side: null, icon: '🪝' },
  { type: 'uppercut', category: 'punch' as StrikeCategory, label: 'Uppercut', side: null, icon: '⬆️' },
  { type: 'roundhouse_kick', category: 'kick' as StrikeCategory, label: 'Roundhouse', side: null, icon: '🦵' },
  { type: 'front_kick', category: 'kick' as StrikeCategory, label: 'Teep', side: null, icon: '🦶' },
  { type: 'low_kick', category: 'kick' as StrikeCategory, label: 'Low Kick', side: null, icon: '⬇️' },
  { type: 'knee', category: 'knee' as StrikeCategory, label: 'Knee', side: null, icon: '🦿' },
  { type: 'elbow', category: 'elbow' as StrikeCategory, label: 'Elbow', side: null, icon: '💪' },
  { type: 'clinch', category: null, label: 'Clinch', side: null, icon: '🤼' },
];
