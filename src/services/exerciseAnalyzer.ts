import { 
  Landmark, 
  POSE_LANDMARKS, 
  calculateAngle, 
  calculateDistance 
} from '@/hooks/usePoseDetection';

export interface ExerciseAnalysis {
  isCorrect: boolean;
  score: number; // 0-100
  feedback: string[];
  metrics: Record<string, number>;
  phase?: 'up' | 'down' | 'hold' | 'unknown';
}

// Squat Analysis
export function analyzeSquat(landmarks: Landmark[]): ExerciseAnalysis {
  const feedback: string[] = [];
  const metrics: Record<string, number> = {};
  let score = 100;

  // Get key landmarks
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

  // Calculate knee angles
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
  metrics.kneeAngle = Math.round(avgKneeAngle);

  // Calculate hip angles (torso angle)
  const midHip = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: (leftHip.z + rightHip.z) / 2,
  };
  const midShoulder = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2,
  };
  const midKnee = {
    x: (leftKnee.x + rightKnee.x) / 2,
    y: (leftKnee.y + rightKnee.y) / 2,
    z: (leftKnee.z + rightKnee.z) / 2,
  };

  const hipAngle = calculateAngle(midShoulder, midHip, midKnee);
  metrics.hipAngle = Math.round(hipAngle);

  // Determine squat phase
  let phase: 'up' | 'down' | 'hold' | 'unknown' = 'unknown';
  if (avgKneeAngle > 160) {
    phase = 'up';
  } else if (avgKneeAngle < 100) {
    phase = 'down';
  } else {
    phase = 'hold';
  }

  // Check squat depth
  if (phase === 'down') {
    if (avgKneeAngle > 110) {
      feedback.push('Κατέβα πιο βαθιά! Στόχος < 90°');
      score -= 20;
    } else if (avgKneeAngle <= 90) {
      feedback.push('Εξαιρετικό βάθος! ✓');
    }
  }

  // Check knee tracking (knees should stay over toes)
  const kneeAnkleDiffLeft = Math.abs(leftKnee.x - leftAnkle.x);
  const kneeAnkleDiffRight = Math.abs(rightKnee.x - rightAnkle.x);
  metrics.kneeTracking = Math.round((kneeAnkleDiffLeft + kneeAnkleDiffRight) * 100);

  if (kneeAnkleDiffLeft > 0.1 || kneeAnkleDiffRight > 0.1) {
    feedback.push('Κράτα τα γόνατα πάνω από τα δάχτυλα');
    score -= 15;
  }

  // Check torso angle (should not lean too far forward)
  const torsoLean = Math.abs(midShoulder.x - midHip.x);
  metrics.torsoLean = Math.round(torsoLean * 100);

  if (phase === 'down' && hipAngle < 70) {
    feedback.push('Σήκωσε τον κορμό, κλίνεις πολύ μπροστά');
    score -= 15;
  }

  // Check symmetry
  const kneeDiff = Math.abs(leftKneeAngle - rightKneeAngle);
  metrics.symmetry = Math.round(100 - kneeDiff);

  if (kneeDiff > 15) {
    feedback.push('Ασύμμετρη κίνηση - ισορρόπησε το βάρος');
    score -= 10;
  }

  if (feedback.length === 0 && phase === 'down') {
    feedback.push('Τέλεια εκτέλεση! 💪');
  }

  return {
    isCorrect: score >= 70,
    score: Math.max(0, score),
    feedback,
    metrics,
    phase,
  };
}

// Push-up Analysis
export function analyzePushUp(landmarks: Landmark[]): ExerciseAnalysis {
  const feedback: string[] = [];
  const metrics: Record<string, number> = {};
  let score = 100;

  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
  const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
  const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

  // Calculate elbow angles
  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
  const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
  metrics.elbowAngle = Math.round(avgElbowAngle);

  // Determine phase
  let phase: 'up' | 'down' | 'hold' | 'unknown' = 'unknown';
  if (avgElbowAngle > 150) {
    phase = 'up';
  } else if (avgElbowAngle < 100) {
    phase = 'down';
  } else {
    phase = 'hold';
  }

  // Check body alignment (shoulders-hips-ankles should be in line)
  const midShoulder = { 
    y: (leftShoulder.y + rightShoulder.y) / 2,
    x: (leftShoulder.x + rightShoulder.x) / 2,
    z: 0
  };
  const midHip = { 
    y: (leftHip.y + rightHip.y) / 2,
    x: (leftHip.x + rightHip.x) / 2,
    z: 0
  };
  const midAnkle = { 
    y: (leftAnkle.y + rightAnkle.y) / 2,
    x: (leftAnkle.x + rightAnkle.x) / 2,
    z: 0
  };

  const bodyLineAngle = calculateAngle(midShoulder, midHip, midAnkle);
  metrics.bodyAlignment = Math.round(bodyLineAngle);

  if (bodyLineAngle < 160) {
    if (midHip.y < midShoulder.y && midHip.y < midAnkle.y) {
      feedback.push('Κατέβασε τους γοφούς - σχηματίζεις "Λ"');
    } else {
      feedback.push('Σήκωσε τους γοφούς - βυθίζεσαι');
    }
    score -= 20;
  }

  // Check depth
  if (phase === 'down') {
    if (avgElbowAngle > 100) {
      feedback.push('Κατέβα πιο βαθιά!');
      score -= 15;
    } else {
      feedback.push('Καλό βάθος! ✓');
    }
  }

  if (feedback.length === 0) {
    feedback.push('Σωστή φόρμα! 💪');
  }

  return {
    isCorrect: score >= 70,
    score: Math.max(0, score),
    feedback,
    metrics,
    phase,
  };
}

// Lunge Analysis
export function analyzeLunge(landmarks: Landmark[]): ExerciseAnalysis {
  const feedback: string[] = [];
  const metrics: Record<string, number> = {};
  let score = 100;

  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

  // Calculate knee angles
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

  // Determine which leg is forward (lower knee Y position = forward)
  const isLeftForward = leftKnee.y > rightKnee.y;
  const frontKneeAngle = isLeftForward ? leftKneeAngle : rightKneeAngle;
  const backKneeAngle = isLeftForward ? rightKneeAngle : leftKneeAngle;

  metrics.frontKneeAngle = Math.round(frontKneeAngle);
  metrics.backKneeAngle = Math.round(backKneeAngle);

  // Check front knee angle (should be ~90°)
  if (frontKneeAngle < 80) {
    feedback.push('Το μπροστινό γόνατο είναι πολύ κλειστό');
    score -= 15;
  } else if (frontKneeAngle > 110) {
    feedback.push('Κατέβα πιο βαθιά στο lunge');
    score -= 15;
  }

  // Check back knee angle
  if (backKneeAngle > 120) {
    feedback.push('Λύγισε περισσότερο το πίσω γόνατο');
    score -= 10;
  }

  // Check torso uprightness
  const midShoulder = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: 0,
  };
  const midHip = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: 0,
  };

  const torsoVertical = Math.abs(midShoulder.x - midHip.x);
  metrics.torsoUprightness = Math.round((1 - torsoVertical) * 100);

  if (torsoVertical > 0.1) {
    feedback.push('Κράτα τον κορμό όρθιο');
    score -= 15;
  }

  if (feedback.length === 0) {
    feedback.push('Εξαιρετική εκτέλεση lunge! 💪');
  }

  return {
    isCorrect: score >= 70,
    score: Math.max(0, score),
    feedback,
    metrics,
    phase: 'unknown',
  };
}

// Deep Squat FMS Test Scoring (0-3)
export function scoreFMSDeepSquat(landmarks: Landmark[]): {
  score: 0 | 1 | 2 | 3;
  feedback: string[];
  details: Record<string, any>;
} {
  const feedback: string[] = [];
  const details: Record<string, any> = {};

  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHeel = landmarks[POSE_LANDMARKS.LEFT_HEEL];
  const rightHeel = landmarks[POSE_LANDMARKS.RIGHT_HEEL];

  // Calculate metrics
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
  details.kneeAngle = avgKneeAngle;

  // Check if thighs are below parallel (hip below knee level)
  const hipBelowKnee = (leftHip.y > leftKnee.y) && (rightHip.y > rightKnee.y);
  details.hipBelowKnee = hipBelowKnee;

  // Check heel lift (heel should be close to ground level)
  const heelLift = Math.max(
    Math.abs(leftHeel.y - leftAnkle.y),
    Math.abs(rightHeel.y - rightAnkle.y)
  );
  const heelsOnGround = heelLift < 0.05;
  details.heelsOnGround = heelsOnGround;

  // Check torso alignment (should be parallel to shins)
  const midShoulder = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: 0,
  };
  const midHip = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: 0,
  };

  const torsoAngle = Math.atan2(midShoulder.y - midHip.y, midShoulder.x - midHip.x) * 180 / Math.PI;
  const torsoUpright = Math.abs(torsoAngle + 90) < 30;
  details.torsoUpright = torsoUpright;

  // Check knee tracking
  const kneesOverToes = 
    Math.abs(leftKnee.x - leftAnkle.x) < 0.1 &&
    Math.abs(rightKnee.x - rightAnkle.x) < 0.1;
  details.kneesOverToes = kneesOverToes;

  // FMS Scoring Logic
  // Score 3: Full deep squat with heels on ground, torso upright
  // Score 2: Deep squat but with compensations (heel lift, forward lean)
  // Score 1: Cannot achieve deep squat position
  // Score 0: Pain during movement

  let score: 0 | 1 | 2 | 3;

  if (hipBelowKnee && heelsOnGround && torsoUpright && kneesOverToes) {
    score = 3;
    feedback.push('Τέλεια εκτέλεση Deep Squat!');
    feedback.push('✓ Ισχία κάτω από τα γόνατα');
    feedback.push('✓ Φτέρνες στο έδαφος');
    feedback.push('✓ Κορμός όρθιος');
  } else if (hipBelowKnee) {
    score = 2;
    feedback.push('Καλό βάθος με κάποιες αντισταθμίσεις');
    if (!heelsOnGround) feedback.push('⚠️ Οι φτέρνες σηκώνονται');
    if (!torsoUpright) feedback.push('⚠️ Υπερβολική κλίση κορμού');
    if (!kneesOverToes) feedback.push('⚠️ Τα γόνατα δεν είναι ευθυγραμμισμένα');
  } else {
    score = 1;
    feedback.push('Δεν επιτυγχάνεται το απαιτούμενο βάθος');
    feedback.push('Τα ισχία πρέπει να κατέβουν κάτω από τα γόνατα');
  }

  return { score, feedback, details };
}

// Get exercise analyzer by name
export function getExerciseAnalyzer(exerciseName: string): ((landmarks: Landmark[]) => ExerciseAnalysis) | null {
  const normalizedName = exerciseName.toLowerCase().trim();
  
  if (normalizedName.includes('squat') || normalizedName.includes('σκουάτ')) {
    return analyzeSquat;
  }
  if (normalizedName.includes('push') || normalizedName.includes('κάμψεις') || normalizedName.includes('πιέσεις')) {
    return analyzePushUp;
  }
  if (normalizedName.includes('lunge') || normalizedName.includes('προβολές')) {
    return analyzeLunge;
  }
  
  return null;
}
