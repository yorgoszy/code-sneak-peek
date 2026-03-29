/**
 * useCompetitionStrikeDetection
 * Phase 2: Real-time strike detection for competition analysis.
 * Tracks strikes per corner (Red/Blue) using pose landmark velocity analysis.
 */
import { useCallback, useRef, useState } from 'react';
import { Landmark, POSE_LANDMARKS, calculateDistance, calculateAngle } from './usePoseDetection';
import type { FighterPose } from './useCompetitionPoseAnalysis';

export type StrikeType =
  | 'jab' | 'cross' | 'hook' | 'uppercut'
  | 'front_kick' | 'roundhouse_kick' | 'side_kick'
  | 'knee' | 'elbow' | 'spinning_elbow' | 'clinch';

export type StrikeCategory = 'punch' | 'kick' | 'knee' | 'elbow' | 'clinch';

export interface CompetitionStrike {
  id: string;
  corner: 'red' | 'blue';
  type: StrikeType;
  category: StrikeCategory;
  side: 'left' | 'right';
  timestamp: number;
  confidence: number;
  velocity: number;
  trajectory: 'straight' | 'circular' | 'upward' | 'downward';
  cameraIndex: number;
}

export interface CornerStats {
  total: number;
  punches: number;
  kicks: number;
  knees: number;
  elbows: number;
  lastStrike: CompetitionStrike | null;
}

const EMPTY_STATS: CornerStats = { total: 0, punches: 0, kicks: 0, knees: 0, elbows: 0, lastStrike: null };

// Default velocity thresholds (normalized coords / second)
const DEFAULT_V_THRESH = { punch: 0.04, kick: 0.03, knee: 0.025, elbow: 0.03 };
const COOLDOWN_MS = 120;
const MAX_HISTORY = 8;

interface PoseSnapshot {
  landmarks: Landmark[];
  timestamp: number;
}

/**
 * Manages per-corner pose history and strike detection.
 */
export function useCompetitionStrikeDetection() {
  const [strikes, setStrikes] = useState<CompetitionStrike[]>([]);
  const [isActive, setIsActive] = useState(false);

  // Per-corner pose history: Map<cornerKey, PoseSnapshot[]>
  const historyRef = useRef<Record<string, PoseSnapshot[]>>({ red: [], blue: [] });
  const lastStrikeRef = useRef<Record<string, number>>({ red: 0, blue: 0 });
  // Adaptive thresholds from Phase 5
  const thresholdsRef = useRef({ ...DEFAULT_V_THRESH });

  /**
   * Update velocity thresholds from adaptive learning engine.
   */
  const setThresholds = (t: typeof DEFAULT_V_THRESH) => {
    thresholdsRef.current = { ...t };
  };

  const calcVelocity = (a: Landmark, b: Landmark, dt: number) =>
    dt > 0 ? calculateDistance(a, b) / dt : 0;

  const trajectory = (history: PoseSnapshot[], idx: number): CompetitionStrike['trajectory'] => {
    if (history.length < 3) return 'straight';
    const pts = history.slice(-5).map(h => h.landmarks[idx]);
    const dy = pts[pts.length - 1].y - pts[0].y;
    const dx = Math.abs(pts[pts.length - 1].x - pts[0].x);
    if (history.length >= 4) {
      const mid = pts[Math.floor(pts.length / 2)];
      const dev = Math.abs(mid.x - (pts[0].x + pts[pts.length - 1].x) / 2);
      if (dev > 0.08) return 'circular';
    }
    if (Math.abs(dy) > dx * 1.5) return dy < 0 ? 'upward' : 'downward';
    return 'straight';
  };

  const classifyPunch = (elbowAngle: number, traj: CompetitionStrike['trajectory'], side: 'left' | 'right'): StrikeType => {
    if (traj === 'upward' && elbowAngle >= 55 && elbowAngle <= 105) return 'uppercut';
    if (traj === 'circular' && elbowAngle >= 65 && elbowAngle <= 115) return 'hook';
    if (elbowAngle >= 135) return side === 'left' ? 'jab' : 'cross';
    return 'jab';
  };

  const classifyKick = (kneeAngle: number, traj: CompetitionStrike['trajectory']): StrikeType => {
    if (traj === 'circular') return 'roundhouse_kick';
    if (kneeAngle >= 135) return 'front_kick';
    return 'side_kick';
  };

  /**
   * Feed a frame of fighter poses for strike analysis.
   */
  const analyzeFrame = useCallback((fighters: FighterPose[], cameraIndex: number) => {
    if (!isActive) return;
    const now = Date.now();

    for (const fighter of fighters) {
      const corner = fighter.corner;
      const hist = historyRef.current[corner];
      const lm = fighter.landmarks as Landmark[];

      hist.push({ landmarks: lm, timestamp: now });
      if (hist.length > MAX_HISTORY) hist.shift();
      if (hist.length < 3) continue;

      // Cooldown
      if (now - (lastStrikeRef.current[corner] || 0) < COOLDOWN_MS) continue;

      const prev = hist[hist.length - 2];
      const dt = (now - prev.timestamp) / 1000; // seconds
      if (dt <= 0) continue;

      const detected: CompetitionStrike[] = [];

      // --- Punch detection (both arms) ---
      for (const side of ['left', 'right'] as const) {
        const wI = side === 'left' ? POSE_LANDMARKS.LEFT_WRIST : POSE_LANDMARKS.RIGHT_WRIST;
        const eI = side === 'left' ? POSE_LANDMARKS.LEFT_ELBOW : POSE_LANDMARKS.RIGHT_ELBOW;
        const sI = side === 'left' ? POSE_LANDMARKS.LEFT_SHOULDER : POSE_LANDMARKS.RIGHT_SHOULDER;

        const v = calcVelocity(lm[wI], prev.landmarks[wI], dt);
        if (v > V_THRESH.punch) {
          const elbowAngle = calculateAngle(lm[sI], lm[eI], lm[wI]);
          const traj = trajectory(hist, wI);
          detected.push({
            id: crypto.randomUUID(),
            corner, type: classifyPunch(elbowAngle, traj, side),
            category: 'punch', side, timestamp: now, confidence: Math.min(v / V_THRESH.punch / 3, 1),
            velocity: v, trajectory: traj, cameraIndex,
          });
          break; // one punch per frame per fighter
        }
      }

      // --- Kick detection ---
      if (detected.length === 0) {
        for (const side of ['left', 'right'] as const) {
          const aI = side === 'left' ? POSE_LANDMARKS.LEFT_ANKLE : POSE_LANDMARKS.RIGHT_ANKLE;
          const kI = side === 'left' ? POSE_LANDMARKS.LEFT_KNEE : POSE_LANDMARKS.RIGHT_KNEE;
          const hI = side === 'left' ? POSE_LANDMARKS.LEFT_HIP : POSE_LANDMARKS.RIGHT_HIP;

          const v = calcVelocity(lm[aI], prev.landmarks[aI], dt);
          if (v > V_THRESH.kick) {
            const kneeAngle = calculateAngle(lm[hI], lm[kI], lm[aI]);
            const traj = trajectory(hist, aI);
            detected.push({
              id: crypto.randomUUID(),
              corner, type: classifyKick(kneeAngle, traj),
              category: 'kick', side, timestamp: now, confidence: Math.min(v / V_THRESH.kick / 3, 1),
              velocity: v, trajectory: traj, cameraIndex,
            });
            break;
          }
        }
      }

      // --- Knee detection ---
      if (detected.length === 0) {
        for (const side of ['left', 'right'] as const) {
          const kI = side === 'left' ? POSE_LANDMARKS.LEFT_KNEE : POSE_LANDMARKS.RIGHT_KNEE;
          const v = calcVelocity(lm[kI], prev.landmarks[kI], dt);
          if (v > V_THRESH.knee && lm[kI].y < prev.landmarks[kI].y) {
            detected.push({
              id: crypto.randomUUID(),
              corner, type: 'knee', category: 'knee', side,
              timestamp: now, confidence: Math.min(v / V_THRESH.knee / 3, 1),
              velocity: v, trajectory: 'upward', cameraIndex,
            });
            break;
          }
        }
      }

      // --- Elbow detection ---
      if (detected.length === 0) {
        for (const side of ['left', 'right'] as const) {
          const eI = side === 'left' ? POSE_LANDMARKS.LEFT_ELBOW : POSE_LANDMARKS.RIGHT_ELBOW;
          const wI = side === 'left' ? POSE_LANDMARKS.LEFT_WRIST : POSE_LANDMARKS.RIGHT_WRIST;
          const eV = calcVelocity(lm[eI], prev.landmarks[eI], dt);
          const wV = calcVelocity(lm[wI], prev.landmarks[wI], dt);
          if (eV > V_THRESH.elbow && eV > wV * 1.3) {
            const traj = trajectory(hist, eI);
            detected.push({
              id: crypto.randomUUID(),
              corner, type: traj === 'circular' ? 'spinning_elbow' : 'elbow',
              category: 'elbow', side, timestamp: now,
              confidence: Math.min(eV / V_THRESH.elbow / 3, 1),
              velocity: eV, trajectory: traj, cameraIndex,
            });
            break;
          }
        }
      }

      if (detected.length > 0) {
        lastStrikeRef.current[corner] = now;
        setStrikes(prev => [...prev, ...detected]);
      }
    }
  }, [isActive]);

  const start = useCallback(() => {
    historyRef.current = { red: [], blue: [] };
    lastStrikeRef.current = { red: 0, blue: 0 };
    setStrikes([]);
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setStrikes([]);
    historyRef.current = { red: [], blue: [] };
    lastStrikeRef.current = { red: 0, blue: 0 };
  }, []);

  // Computed stats
  const getCornerStats = useCallback((corner: 'red' | 'blue'): CornerStats => {
    const cs = strikes.filter(s => s.corner === corner);
    if (cs.length === 0) return EMPTY_STATS;
    return {
      total: cs.length,
      punches: cs.filter(s => s.category === 'punch').length,
      kicks: cs.filter(s => s.category === 'kick').length,
      knees: cs.filter(s => s.category === 'knee').length,
      elbows: cs.filter(s => s.category === 'elbow').length,
      lastStrike: cs[cs.length - 1],
    };
  }, [strikes]);

  return {
    strikes,
    isActive,
    start,
    stop,
    reset,
    analyzeFrame,
    getCornerStats,
  };
}
