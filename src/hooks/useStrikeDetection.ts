/**
 * Strike Detection Hook - Αυτόματη ανίχνευση χτυπημάτων μαχητικών
 * Χρησιμοποιεί Pose Detection + Velocity Analysis για ακριβή ανίχνευση
 */

import { useCallback, useRef, useState } from 'react';
import { Landmark, POSE_LANDMARKS, calculateDistance, calculateAngle } from './usePoseDetection';

// Τύποι χτυπημάτων που αναγνωρίζονται
export type DetectedStrikeType = 
  | 'jab' | 'cross' | 'hook' | 'uppercut' 
  | 'front_kick' | 'roundhouse_kick' | 'side_kick' | 'back_kick'
  | 'knee' | 'flying_knee'
  | 'elbow' | 'spinning_elbow'
  | 'clinch';

export type StrikeSide = 'left' | 'right';

export interface DetectedStrike {
  id: string;
  type: DetectedStrikeType;
  category: 'punch' | 'kick' | 'knee' | 'elbow' | 'clinch';
  side: StrikeSide;
  timestamp: number; // Video timestamp in seconds
  confidence: number; // 0-1 confidence score
  landmarks: {
    shoulder: Landmark;
    elbow: Landmark;
    wrist: Landmark;
    hip: Landmark;
    knee: Landmark;
    ankle: Landmark;
  };
  velocity: number; // Speed of the strike
  trajectory: 'straight' | 'circular' | 'upward' | 'downward';
  isVerified: boolean; // Has been verified by AI or user
}

// Threshold constants για ανίχνευση - ΜΕΙΩΜΕΝΑ για πιο ευαίσθητη ανίχνευση
const VELOCITY_THRESHOLD = {
  PUNCH: 0.03, // Minimum velocity for punch detection (μειωμένο από 0.15)
  KICK: 0.025,  // μειωμένο από 0.12
  KNEE: 0.02,   // μειωμένο από 0.10
  ELBOW: 0.025, // μειωμένο από 0.12
};

const ANGLE_THRESHOLDS = {
  JAB: { minElbow: 140, maxElbow: 180 }, // Extended arm
  HOOK: { minElbow: 70, maxElbow: 110 }, // Bent arm
  UPPERCUT: { minElbow: 60, maxElbow: 100 },
  ROUNDHOUSE: { minKnee: 90, maxKnee: 180 },
  FRONT_KICK: { minKnee: 140, maxKnee: 180 },
};

interface PoseHistory {
  landmarks: Landmark[];
  timestamp: number;
}

interface UseStrikeDetectionOptions {
  sensitivity: 'low' | 'medium' | 'high';
  detectPunches: boolean;
  detectKicks: boolean;
  detectKnees: boolean;
  detectElbows: boolean;
  onStrikeDetected?: (strike: DetectedStrike) => void;
}

export function useStrikeDetection(options: UseStrikeDetectionOptions) {
  const {
    sensitivity = 'medium',
    detectPunches = true,
    detectKicks = true,
    detectKnees = true,
    detectElbows = true,
    onStrikeDetected,
  } = options;

  const [detectedStrikes, setDetectedStrikes] = useState<DetectedStrike[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const poseHistoryRef = useRef<PoseHistory[]>([]);
  const lastStrikeTimeRef = useRef<number>(0);
  // Μειωμένα cooldowns για να ανιχνεύει περισσότερα χτυπήματα
  const cooldownMs = sensitivity === 'high' ? 100 : sensitivity === 'medium' ? 150 : 200;

  // Υπολογισμός velocity ενός σημείου
  const calculateVelocity = useCallback((
    current: Landmark,
    previous: Landmark,
    timeDelta: number
  ): number => {
    if (timeDelta === 0) return 0;
    const distance = calculateDistance(current, previous);
    return distance / timeDelta;
  }, []);

  // Ανάλυση τροχιάς κίνησης
  const analyzeTrajectory = useCallback((
    history: PoseHistory[],
    landmarkIndex: number
  ): 'straight' | 'circular' | 'upward' | 'downward' => {
    if (history.length < 3) return 'straight';

    const points = history.slice(-5).map(h => h.landmarks[landmarkIndex]);
    
    // Υπολογισμός κατεύθυνσης
    const startY = points[0]?.y || 0;
    const endY = points[points.length - 1]?.y || 0;
    const startX = points[0]?.x || 0;
    const endX = points[points.length - 1]?.x || 0;

    const verticalMovement = endY - startY;
    const horizontalMovement = Math.abs(endX - startX);

    // Check for circular motion (hook-like)
    if (history.length >= 5) {
      const midPoint = points[Math.floor(points.length / 2)];
      const deviation = Math.abs(midPoint.x - (startX + endX) / 2);
      if (deviation > 0.1) return 'circular';
    }

    if (Math.abs(verticalMovement) > horizontalMovement * 1.5) {
      return verticalMovement < 0 ? 'upward' : 'downward';
    }

    return 'straight';
  }, []);

  // Κατηγοριοποίηση punch τύπου
  const classifyPunch = useCallback((
    elbowAngle: number,
    trajectory: 'straight' | 'circular' | 'upward' | 'downward',
    side: StrikeSide
  ): DetectedStrikeType => {
    if (trajectory === 'upward' && elbowAngle >= 60 && elbowAngle <= 100) {
      return 'uppercut';
    }
    if (trajectory === 'circular' && elbowAngle >= 70 && elbowAngle <= 110) {
      return 'hook';
    }
    if (trajectory === 'straight' && elbowAngle >= 140) {
      return side === 'left' ? 'jab' : 'cross';
    }
    return 'jab'; // Default
  }, []);

  // Κατηγοριοποίηση kick τύπου
  const classifyKick = useCallback((
    kneeAngle: number,
    hipAngle: number,
    trajectory: 'straight' | 'circular' | 'upward' | 'downward'
  ): DetectedStrikeType => {
    if (trajectory === 'circular') {
      return 'roundhouse_kick';
    }
    if (trajectory === 'straight' && kneeAngle >= 140) {
      return 'front_kick';
    }
    if (hipAngle > 90) {
      return 'side_kick';
    }
    return 'front_kick';
  }, []);

  // Κύρια ανάλυση pose frame
  const analyzePoseFrame = useCallback((
    landmarks: Landmark[],
    timestamp: number
  ) => {
    const now = Date.now();
    
    // Cooldown check
    if (now - lastStrikeTimeRef.current < cooldownMs) {
      return;
    }

    // Αποθήκευση στο history
    poseHistoryRef.current.push({ landmarks, timestamp });
    if (poseHistoryRef.current.length > 10) {
      poseHistoryRef.current.shift();
    }

    if (poseHistoryRef.current.length < 3) return;

    const history = poseHistoryRef.current;
    const prev = history[history.length - 2];
    const timeDelta = timestamp - prev.timestamp;

    if (timeDelta <= 0) return;

    // === PUNCH DETECTION ===
    if (detectPunches) {
      // Left arm
      const leftWristVelocity = calculateVelocity(
        landmarks[POSE_LANDMARKS.LEFT_WRIST],
        prev.landmarks[POSE_LANDMARKS.LEFT_WRIST],
        timeDelta
      );

      if (leftWristVelocity > VELOCITY_THRESHOLD.PUNCH) {
        const elbowAngle = calculateAngle(
          landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
          landmarks[POSE_LANDMARKS.LEFT_ELBOW],
          landmarks[POSE_LANDMARKS.LEFT_WRIST]
        );
        const trajectory = analyzeTrajectory(history, POSE_LANDMARKS.LEFT_WRIST);
        const punchType = classifyPunch(elbowAngle, trajectory, 'left');

        const strike: DetectedStrike = {
          id: crypto.randomUUID(),
          type: punchType,
          category: 'punch',
          side: 'left',
          timestamp,
          confidence: Math.min(leftWristVelocity / VELOCITY_THRESHOLD.PUNCH, 1),
          landmarks: {
            shoulder: landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
            elbow: landmarks[POSE_LANDMARKS.LEFT_ELBOW],
            wrist: landmarks[POSE_LANDMARKS.LEFT_WRIST],
            hip: landmarks[POSE_LANDMARKS.LEFT_HIP],
            knee: landmarks[POSE_LANDMARKS.LEFT_KNEE],
            ankle: landmarks[POSE_LANDMARKS.LEFT_ANKLE],
          },
          velocity: leftWristVelocity,
          trajectory,
          isVerified: false,
        };

        setDetectedStrikes(prev => [...prev, strike]);
        onStrikeDetected?.(strike);
        lastStrikeTimeRef.current = now;
      }

      // Right arm
      const rightWristVelocity = calculateVelocity(
        landmarks[POSE_LANDMARKS.RIGHT_WRIST],
        prev.landmarks[POSE_LANDMARKS.RIGHT_WRIST],
        timeDelta
      );

      if (rightWristVelocity > VELOCITY_THRESHOLD.PUNCH) {
        const elbowAngle = calculateAngle(
          landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
          landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
          landmarks[POSE_LANDMARKS.RIGHT_WRIST]
        );
        const trajectory = analyzeTrajectory(history, POSE_LANDMARKS.RIGHT_WRIST);
        const punchType = classifyPunch(elbowAngle, trajectory, 'right');

        const strike: DetectedStrike = {
          id: crypto.randomUUID(),
          type: punchType,
          category: 'punch',
          side: 'right',
          timestamp,
          confidence: Math.min(rightWristVelocity / VELOCITY_THRESHOLD.PUNCH, 1),
          landmarks: {
            shoulder: landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
            elbow: landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
            wrist: landmarks[POSE_LANDMARKS.RIGHT_WRIST],
            hip: landmarks[POSE_LANDMARKS.RIGHT_HIP],
            knee: landmarks[POSE_LANDMARKS.RIGHT_KNEE],
            ankle: landmarks[POSE_LANDMARKS.RIGHT_ANKLE],
          },
          velocity: rightWristVelocity,
          trajectory,
          isVerified: false,
        };

        setDetectedStrikes(prev => [...prev, strike]);
        onStrikeDetected?.(strike);
        lastStrikeTimeRef.current = now;
      }
    }

    // === KICK DETECTION ===
    if (detectKicks) {
      // Left leg
      const leftAnkleVelocity = calculateVelocity(
        landmarks[POSE_LANDMARKS.LEFT_ANKLE],
        prev.landmarks[POSE_LANDMARKS.LEFT_ANKLE],
        timeDelta
      );

      if (leftAnkleVelocity > VELOCITY_THRESHOLD.KICK) {
        const kneeAngle = calculateAngle(
          landmarks[POSE_LANDMARKS.LEFT_HIP],
          landmarks[POSE_LANDMARKS.LEFT_KNEE],
          landmarks[POSE_LANDMARKS.LEFT_ANKLE]
        );
        const hipAngle = calculateAngle(
          landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
          landmarks[POSE_LANDMARKS.LEFT_HIP],
          landmarks[POSE_LANDMARKS.LEFT_KNEE]
        );
        const trajectory = analyzeTrajectory(history, POSE_LANDMARKS.LEFT_ANKLE);
        const kickType = classifyKick(kneeAngle, hipAngle, trajectory);

        const strike: DetectedStrike = {
          id: crypto.randomUUID(),
          type: kickType,
          category: 'kick',
          side: 'left',
          timestamp,
          confidence: Math.min(leftAnkleVelocity / VELOCITY_THRESHOLD.KICK, 1),
          landmarks: {
            shoulder: landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
            elbow: landmarks[POSE_LANDMARKS.LEFT_ELBOW],
            wrist: landmarks[POSE_LANDMARKS.LEFT_WRIST],
            hip: landmarks[POSE_LANDMARKS.LEFT_HIP],
            knee: landmarks[POSE_LANDMARKS.LEFT_KNEE],
            ankle: landmarks[POSE_LANDMARKS.LEFT_ANKLE],
          },
          velocity: leftAnkleVelocity,
          trajectory,
          isVerified: false,
        };

        setDetectedStrikes(prev => [...prev, strike]);
        onStrikeDetected?.(strike);
        lastStrikeTimeRef.current = now;
      }

      // Right leg
      const rightAnkleVelocity = calculateVelocity(
        landmarks[POSE_LANDMARKS.RIGHT_ANKLE],
        prev.landmarks[POSE_LANDMARKS.RIGHT_ANKLE],
        timeDelta
      );

      if (rightAnkleVelocity > VELOCITY_THRESHOLD.KICK) {
        const kneeAngle = calculateAngle(
          landmarks[POSE_LANDMARKS.RIGHT_HIP],
          landmarks[POSE_LANDMARKS.RIGHT_KNEE],
          landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
        );
        const hipAngle = calculateAngle(
          landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
          landmarks[POSE_LANDMARKS.RIGHT_HIP],
          landmarks[POSE_LANDMARKS.RIGHT_KNEE]
        );
        const trajectory = analyzeTrajectory(history, POSE_LANDMARKS.RIGHT_ANKLE);
        const kickType = classifyKick(kneeAngle, hipAngle, trajectory);

        const strike: DetectedStrike = {
          id: crypto.randomUUID(),
          type: kickType,
          category: 'kick',
          side: 'right',
          timestamp,
          confidence: Math.min(rightAnkleVelocity / VELOCITY_THRESHOLD.KICK, 1),
          landmarks: {
            shoulder: landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
            elbow: landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
            wrist: landmarks[POSE_LANDMARKS.RIGHT_WRIST],
            hip: landmarks[POSE_LANDMARKS.RIGHT_HIP],
            knee: landmarks[POSE_LANDMARKS.RIGHT_KNEE],
            ankle: landmarks[POSE_LANDMARKS.RIGHT_ANKLE],
          },
          velocity: rightAnkleVelocity,
          trajectory,
          isVerified: false,
        };

        setDetectedStrikes(prev => [...prev, strike]);
        onStrikeDetected?.(strike);
        lastStrikeTimeRef.current = now;
      }
    }

    // === KNEE DETECTION ===
    if (detectKnees) {
      // Check both knees for rapid upward movement
      const leftKneeVelocity = calculateVelocity(
        landmarks[POSE_LANDMARKS.LEFT_KNEE],
        prev.landmarks[POSE_LANDMARKS.LEFT_KNEE],
        timeDelta
      );
      
      // Knee strike: rapid upward movement + hip angle change
      if (leftKneeVelocity > VELOCITY_THRESHOLD.KNEE) {
        const isUpward = landmarks[POSE_LANDMARKS.LEFT_KNEE].y < prev.landmarks[POSE_LANDMARKS.LEFT_KNEE].y;
        if (isUpward) {
          const strike: DetectedStrike = {
            id: crypto.randomUUID(),
            type: 'knee',
            category: 'knee',
            side: 'left',
            timestamp,
            confidence: Math.min(leftKneeVelocity / VELOCITY_THRESHOLD.KNEE, 1),
            landmarks: {
              shoulder: landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
              elbow: landmarks[POSE_LANDMARKS.LEFT_ELBOW],
              wrist: landmarks[POSE_LANDMARKS.LEFT_WRIST],
              hip: landmarks[POSE_LANDMARKS.LEFT_HIP],
              knee: landmarks[POSE_LANDMARKS.LEFT_KNEE],
              ankle: landmarks[POSE_LANDMARKS.LEFT_ANKLE],
            },
            velocity: leftKneeVelocity,
            trajectory: 'upward',
            isVerified: false,
          };

          setDetectedStrikes(prev => [...prev, strike]);
          onStrikeDetected?.(strike);
          lastStrikeTimeRef.current = now;
        }
      }
    }

    // === ELBOW DETECTION ===
    if (detectElbows) {
      const leftElbowVelocity = calculateVelocity(
        landmarks[POSE_LANDMARKS.LEFT_ELBOW],
        prev.landmarks[POSE_LANDMARKS.LEFT_ELBOW],
        timeDelta
      );

      if (leftElbowVelocity > VELOCITY_THRESHOLD.ELBOW) {
        // Elbow strike: elbow moving but wrist relatively stable
        const wristVelocity = calculateVelocity(
          landmarks[POSE_LANDMARKS.LEFT_WRIST],
          prev.landmarks[POSE_LANDMARKS.LEFT_WRIST],
          timeDelta
        );

        if (leftElbowVelocity > wristVelocity * 1.5) {
          const trajectory = analyzeTrajectory(history, POSE_LANDMARKS.LEFT_ELBOW);

          const strike: DetectedStrike = {
            id: crypto.randomUUID(),
            type: trajectory === 'circular' ? 'spinning_elbow' : 'elbow',
            category: 'elbow',
            side: 'left',
            timestamp,
            confidence: Math.min(leftElbowVelocity / VELOCITY_THRESHOLD.ELBOW, 1),
            landmarks: {
              shoulder: landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
              elbow: landmarks[POSE_LANDMARKS.LEFT_ELBOW],
              wrist: landmarks[POSE_LANDMARKS.LEFT_WRIST],
              hip: landmarks[POSE_LANDMARKS.LEFT_HIP],
              knee: landmarks[POSE_LANDMARKS.LEFT_KNEE],
              ankle: landmarks[POSE_LANDMARKS.LEFT_ANKLE],
            },
            velocity: leftElbowVelocity,
            trajectory,
            isVerified: false,
          };

          setDetectedStrikes(prev => [...prev, strike]);
          onStrikeDetected?.(strike);
          lastStrikeTimeRef.current = now;
        }
      }
    }
  }, [
    detectPunches, detectKicks, detectKnees, detectElbows,
    cooldownMs, calculateVelocity, analyzeTrajectory, 
    classifyPunch, classifyKick, onStrikeDetected
  ]);

  // Reset detection state
  const reset = useCallback(() => {
    setDetectedStrikes([]);
    poseHistoryRef.current = [];
    lastStrikeTimeRef.current = 0;
  }, []);

  // Start analyzing
  const startAnalyzing = useCallback(() => {
    setIsAnalyzing(true);
    reset();
  }, [reset]);

  // Stop analyzing
  const stopAnalyzing = useCallback(() => {
    setIsAnalyzing(false);
  }, []);

  // Verify a strike (manual or AI verification)
  const verifyStrike = useCallback((strikeId: string, isVerified: boolean) => {
    setDetectedStrikes(prev => 
      prev.map(s => s.id === strikeId ? { ...s, isVerified } : s)
    );
  }, []);

  // Remove a false positive
  const removeStrike = useCallback((strikeId: string) => {
    setDetectedStrikes(prev => prev.filter(s => s.id !== strikeId));
  }, []);

  return {
    detectedStrikes,
    isAnalyzing,
    analyzePoseFrame,
    startAnalyzing,
    stopAnalyzing,
    verifyStrike,
    removeStrike,
    reset,
  };
}
