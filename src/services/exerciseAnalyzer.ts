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

// Hurdle Step FMS Test Scoring (0-3)
export function scoreFMSHurdleStep(landmarks: Landmark[]): {
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

  // Determine which leg is stepping (higher knee)
  const isLeftStepping = leftKnee.y < rightKnee.y;
  const steppingKnee = isLeftStepping ? leftKnee : rightKnee;
  const steppingHip = isLeftStepping ? leftHip : rightHip;
  const standingKnee = isLeftStepping ? rightKnee : leftKnee;
  const standingHip = isLeftStepping ? rightHip : leftHip;
  const standingAnkle = isLeftStepping ? rightAnkle : leftAnkle;

  // Check knee height (should reach hip level)
  const kneeReachesHip = steppingKnee.y <= steppingHip.y;
  details.kneeReachesHip = kneeReachesHip;

  // Check standing leg stability (should remain straight)
  const standingKneeAngle = calculateAngle(standingHip, standingKnee, standingAnkle);
  const standingLegStraight = standingKneeAngle > 160;
  details.standingLegStraight = standingLegStraight;
  details.standingKneeAngle = standingKneeAngle;

  // Check hip alignment (hips should remain level)
  const hipLevelDiff = Math.abs(leftHip.y - rightHip.y);
  const hipsLevel = hipLevelDiff < 0.05;
  details.hipsLevel = hipsLevel;

  // Check torso stability
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
  const torsoLean = Math.abs(midShoulder.x - midHip.x);
  const torsoStable = torsoLean < 0.08;
  details.torsoStable = torsoStable;

  let score: 0 | 1 | 2 | 3;

  if (kneeReachesHip && standingLegStraight && hipsLevel && torsoStable) {
    score = 3;
    feedback.push('Τέλεια εκτέλεση Hurdle Step!');
    feedback.push('✓ Γόνατο στο ύψος των ισχίων');
    feedback.push('✓ Το πόδι στήριξης παραμένει ευθύ');
    feedback.push('✓ Ισχία σε επίπεδο');
  } else if (kneeReachesHip) {
    score = 2;
    feedback.push('Καλό ύψος γονάτου με αντισταθμίσεις');
    if (!standingLegStraight) feedback.push('⚠️ Λύγισμα ποδιού στήριξης');
    if (!hipsLevel) feedback.push('⚠️ Τα ισχία δεν είναι επίπεδα');
    if (!torsoStable) feedback.push('⚠️ Κλίση κορμού');
  } else {
    score = 1;
    feedback.push('Το γόνατο δεν φτάνει στο ύψος των ισχίων');
    feedback.push('Προσπάθησε να σηκώσεις πιο ψηλά το γόνατο');
  }

  return { score, feedback, details };
}

// Inline Lunge FMS Test Scoring (0-3)
export function scoreFMSInlineLunge(landmarks: Landmark[]): {
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

  // Determine front and back leg
  const isLeftFront = leftKnee.y > rightKnee.y;
  const frontKnee = isLeftFront ? leftKnee : rightKnee;
  const frontHip = isLeftFront ? leftHip : rightHip;
  const frontAnkle = isLeftFront ? leftAnkle : rightAnkle;
  const backKnee = isLeftFront ? rightKnee : leftKnee;
  const backHip = isLeftFront ? rightHip : leftHip;
  const backAnkle = isLeftFront ? rightAnkle : leftAnkle;

  // Check front knee angle (should be ~90°)
  const frontKneeAngle = calculateAngle(frontHip, frontKnee, frontAnkle);
  const frontKnee90 = frontKneeAngle >= 80 && frontKneeAngle <= 100;
  details.frontKneeAngle = frontKneeAngle;

  // Check back knee touches/near ground (Y position close to ankle)
  const backKneeToGround = backKnee.y > backAnkle.y - 0.05;
  details.backKneeToGround = backKneeToGround;

  // Check feet alignment (should be in a line)
  const feetAligned = Math.abs(leftAnkle.x - rightAnkle.x) < 0.15;
  details.feetAligned = feetAligned;

  // Check torso upright
  const midShoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
  const midHip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
  const torsoLean = Math.abs(midShoulder.x - midHip.x);
  const torsoUpright = torsoLean < 0.08;
  details.torsoUpright = torsoUpright;

  // Check balance (no lateral shift)
  const shoulderLevelDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  const balanced = shoulderLevelDiff < 0.05;
  details.balanced = balanced;

  let score: 0 | 1 | 2 | 3;

  if (frontKnee90 && backKneeToGround && feetAligned && torsoUpright && balanced) {
    score = 3;
    feedback.push('Τέλεια εκτέλεση Inline Lunge!');
    feedback.push('✓ Μπροστινό γόνατο 90°');
    feedback.push('✓ Πίσω γόνατο αγγίζει έδαφος');
    feedback.push('✓ Πόδια σε ευθεία');
  } else if (backKneeToGround) {
    score = 2;
    feedback.push('Καλό βάθος με αντισταθμίσεις');
    if (!frontKnee90) feedback.push('⚠️ Γωνία μπροστινού γονάτου εκτός 90°');
    if (!feetAligned) feedback.push('⚠️ Τα πόδια δεν είναι ευθυγραμμισμένα');
    if (!torsoUpright) feedback.push('⚠️ Κλίση κορμού');
    if (!balanced) feedback.push('⚠️ Απώλεια ισορροπίας');
  } else {
    score = 1;
    feedback.push('Δεν επιτυγχάνεται πλήρες βάθος');
    feedback.push('Το πίσω γόνατο πρέπει να αγγίζει το έδαφος');
  }

  return { score, feedback, details };
}

// Shoulder Mobility FMS Test Scoring (0-3)
export function scoreFMSShoulderMobility(landmarks: Landmark[]): {
  score: 0 | 1 | 2 | 3;
  feedback: string[];
  details: Record<string, any>;
} {
  const feedback: string[] = [];
  const details: Record<string, any> = {};

  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
  const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
  const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];

  // Calculate distance between fists (using wrists as proxy)
  const fistDistance = calculateDistance(leftWrist, rightWrist);
  details.fistDistance = fistDistance;

  // Calculate approximate hand span using shoulder width as reference
  const shoulderWidth = calculateDistance(leftShoulder, rightShoulder);
  details.shoulderWidth = shoulderWidth;

  // One hand should be above shoulder (reaching up), one below (reaching behind)
  const leftAbove = leftWrist.y < leftShoulder.y;
  const rightAbove = rightWrist.y < rightShoulder.y;
  const properPosition = (leftAbove && !rightAbove) || (rightAbove && !leftAbove);
  details.properPosition = properPosition;

  // Relative distance (fist distance relative to hand span)
  // Hand span is roughly shoulder width
  const relativeDistance = fistDistance / shoulderWidth;
  details.relativeDistance = relativeDistance;

  let score: 0 | 1 | 2 | 3;

  if (properPosition) {
    if (relativeDistance <= 1.0) {
      score = 3;
      feedback.push('Εξαιρετική κινητικότητα ώμων!');
      feedback.push('✓ Οι γροθιές αγγίζουν ή είναι πολύ κοντά');
      feedback.push('✓ Απόσταση μικρότερη από μία παλάμη');
    } else if (relativeDistance <= 1.5) {
      score = 2;
      feedback.push('Καλή κινητικότητα με μικρό περιθώριο βελτίωσης');
      feedback.push('⚠️ Απόσταση μεταξύ μίας και 1.5 παλάμης');
    } else {
      score = 1;
      feedback.push('Περιορισμένη κινητικότητα ώμων');
      feedback.push('Η απόσταση μεταξύ των χεριών είναι μεγάλη');
    }
  } else {
    score = 1;
    feedback.push('Λάθος θέση - ένα χέρι πάνω, ένα πίσω');
    feedback.push('Δοκίμασε ξανά με σωστή τοποθέτηση');
  }

  return { score, feedback, details };
}

// Active Straight Leg Raise FMS Test Scoring (0-3)
export function scoreFMSActiveStraightLegRaise(landmarks: Landmark[]): {
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

  // Determine which leg is raised (lower Y = higher position)
  const isLeftRaised = leftAnkle.y < rightAnkle.y;
  const raisedAnkle = isLeftRaised ? leftAnkle : rightAnkle;
  const raisedKnee = isLeftRaised ? leftKnee : rightKnee;
  const raisedHip = isLeftRaised ? leftHip : rightHip;
  const restingKnee = isLeftRaised ? rightKnee : leftKnee;
  const restingAnkle = isLeftRaised ? rightAnkle : leftAnkle;
  const restingHip = isLeftRaised ? rightHip : leftHip;

  // Check if raised leg is straight
  const raisedLegAngle = calculateAngle(raisedHip, raisedKnee, raisedAnkle);
  const legStraight = raisedLegAngle > 160;
  details.raisedLegAngle = raisedLegAngle;
  details.legStraight = legStraight;

  // Check resting leg remains on ground and straight
  const restingLegAngle = calculateAngle(restingHip, restingKnee, restingAnkle);
  const restingLegStraight = restingLegAngle > 160;
  details.restingLegStraight = restingLegStraight;

  // Calculate leg raise angle (relative to hip)
  // Using vertical reference (positive Y is down in screen coords)
  const legRaiseAngle = Math.atan2(raisedHip.y - raisedAnkle.y, Math.abs(raisedHip.x - raisedAnkle.x)) * 180 / Math.PI;
  details.legRaiseAngle = legRaiseAngle;

  // Reference points for scoring:
  // Score 3: Ankle above opposite knee level
  // Score 2: Ankle between mid-thigh and knee
  // Score 1: Ankle below mid-thigh

  const midThighY = (restingHip.y + restingKnee.y) / 2;
  const ankleAboveKnee = raisedAnkle.y < restingKnee.y;
  const ankleMidThigh = raisedAnkle.y < midThighY;

  let score: 0 | 1 | 2 | 3;

  if (legStraight && restingLegStraight && ankleAboveKnee) {
    score = 3;
    feedback.push('Εξαιρετική ευλυγισία!');
    feedback.push('✓ Αστράγαλος πάνω από το γόνατο');
    feedback.push('✓ Τα πόδια παραμένουν ευθεία');
  } else if (legStraight && ankleMidThigh) {
    score = 2;
    feedback.push('Καλή ευλυγισία');
    feedback.push('⚠️ Αστράγαλος μεταξύ μέσου μηρού και γονάτου');
    if (!restingLegStraight) feedback.push('⚠️ Το πόδι ηρεμίας λυγίζει');
  } else {
    score = 1;
    feedback.push('Περιορισμένη ευλυγισία');
    if (!legStraight) feedback.push('Κράτα το πόδι ευθύ κατά την ανύψωση');
    feedback.push('Δούλεψε την ευλυγισία οπίσθιων μηριαίων');
  }

  return { score, feedback, details };
}

// Trunk Stability Push-Up FMS Test Scoring (0-3)
export function scoreFMSTrunkStabilityPushUp(landmarks: Landmark[]): {
  score: 0 | 1 | 2 | 3;
  feedback: string[];
  details: Record<string, any>;
} {
  const feedback: string[] = [];
  const details: Record<string, any> = {};

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

  // Check body alignment
  const midShoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2, z: 0 };
  const midHip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2, z: 0 };
  const midAnkle = { x: (leftAnkle.x + rightAnkle.x) / 2, y: (leftAnkle.y + rightAnkle.y) / 2, z: 0 };

  const bodyLineAngle = calculateAngle(midShoulder, midHip, midAnkle);
  const bodyAligned = bodyLineAngle > 160;
  details.bodyLineAngle = bodyLineAngle;
  details.bodyAligned = bodyAligned;

  // Check elbow angle
  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
  const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
  details.elbowAngle = avgElbowAngle;

  // Is in push-up down position?
  const inDownPosition = avgElbowAngle < 120;
  const inUpPosition = avgElbowAngle > 150;
  details.inDownPosition = inDownPosition;
  details.inUpPosition = inUpPosition;

  // Check hand position (hands at shoulder level for score 3, lower for score 2)
  const avgWristY = (leftWrist.y + rightWrist.y) / 2;
  const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const handsAtShoulderLevel = Math.abs(avgWristY - avgShoulderY) < 0.1;
  details.handsAtShoulderLevel = handsAtShoulderLevel;

  // Check for spinal flexion (hips sagging or pike)
  const noSpinalFlexion = bodyAligned;

  let score: 0 | 1 | 2 | 3;

  if (inUpPosition && bodyAligned && handsAtShoulderLevel) {
    score = 3;
    feedback.push('Εξαιρετική σταθερότητα κορμού!');
    feedback.push('✓ Τέλεια ευθυγράμμιση σώματος');
    feedback.push('✓ Χέρια στο ύψος ώμων');
  } else if (inUpPosition && bodyAligned) {
    score = 2;
    feedback.push('Καλή σταθερότητα');
    if (!handsAtShoulderLevel) feedback.push('⚠️ Χέρια χαμηλότερα από ώμους');
  } else {
    score = 1;
    if (!bodyAligned) {
      if (midHip.y < (midShoulder.y + midAnkle.y) / 2) {
        feedback.push('Κατέβασε τους γοφούς - σχηματίζεις "Λ"');
      } else {
        feedback.push('Σήκωσε τους γοφούς - βυθίζεσαι');
      }
    }
    feedback.push('Δεν επιτυγχάνεται κάμψη με σωστή σταθερότητα');
  }

  return { score, feedback, details };
}

// Rotary Stability FMS Test Scoring (0-3)
export function scoreFMSRotaryStability(landmarks: Landmark[]): {
  score: 0 | 1 | 2 | 3;
  feedback: string[];
  details: Record<string, any>;
} {
  const feedback: string[] = [];
  const details: Record<string, any> = {};

  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
  const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];

  // Check spine alignment (shoulders and hips should be level)
  const shoulderLevelDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  const hipLevelDiff = Math.abs(leftHip.y - rightHip.y);
  const spineNeutral = shoulderLevelDiff < 0.05 && hipLevelDiff < 0.05;
  details.spineNeutral = spineNeutral;
  details.shoulderLevelDiff = shoulderLevelDiff;
  details.hipLevelDiff = hipLevelDiff;

  // Detect which arm/leg are extended
  // Extended arm: wrist higher (lower Y) than shoulder
  const leftArmExtended = leftWrist.y < leftShoulder.y - 0.1;
  const rightArmExtended = rightWrist.y < rightShoulder.y - 0.1;
  
  // Extended leg: knee behind hip (for quadruped position)
  const leftLegExtended = leftKnee.y < leftHip.y - 0.05;
  const rightLegExtended = rightKnee.y < rightHip.y - 0.05;

  // Ipsilateral (same side) = Score 3
  // Contralateral (opposite sides) = Score 2
  const ipsilateral = (leftArmExtended && leftLegExtended) || (rightArmExtended && rightLegExtended);
  const contralateral = (leftArmExtended && rightLegExtended) || (rightArmExtended && leftLegExtended);
  
  details.ipsilateral = ipsilateral;
  details.contralateral = contralateral;

  // Check for touch between elbow and knee
  const leftWristKneeDistance = calculateDistance(leftWrist, rightKnee);
  const rightWristKneeDistance = calculateDistance(rightWrist, leftKnee);
  const touchCompleted = Math.min(leftWristKneeDistance, rightWristKneeDistance) < 0.15;
  details.touchCompleted = touchCompleted;

  let score: 0 | 1 | 2 | 3;

  if (ipsilateral && spineNeutral && touchCompleted) {
    score = 3;
    feedback.push('Εξαιρετική στροφική σταθερότητα!');
    feedback.push('✓ Ομόπλευρη επέκταση (ίδια πλευρά)');
    feedback.push('✓ Η σπονδυλική στήλη παραμένει ουδέτερη');
  } else if (contralateral && spineNeutral) {
    score = 2;
    feedback.push('Καλή σταθερότητα με ετερόπλευρη επέκταση');
    feedback.push('⚠️ Αντίθετο χέρι-πόδι (πιο εύκολο)');
    if (!touchCompleted) feedback.push('⚠️ Η επαφή δεν ολοκληρώθηκε');
  } else {
    score = 1;
    if (!spineNeutral) {
      feedback.push('Η σπονδυλική στήλη χάνει την ουδέτερη θέση');
    }
    feedback.push('Δεν επιτυγχάνεται σωστή εκτέλεση');
    feedback.push('Δούλεψε τη σταθερότητα του κορμού');
  }

  return { score, feedback, details };
}

// FMS Test type
export type FMSTestType = 'deep-squat' | 'hurdle-step' | 'inline-lunge' | 'shoulder-mobility' | 'active-straight-leg-raise' | 'trunk-stability-pushup' | 'rotary-stability';

// Get FMS test scorer by type
export function getFMSTestScorer(testType: FMSTestType): ((landmarks: Landmark[]) => { score: 0 | 1 | 2 | 3; feedback: string[]; details: Record<string, any> }) {
  switch (testType) {
    case 'deep-squat':
      return scoreFMSDeepSquat;
    case 'hurdle-step':
      return scoreFMSHurdleStep;
    case 'inline-lunge':
      return scoreFMSInlineLunge;
    case 'shoulder-mobility':
      return scoreFMSShoulderMobility;
    case 'active-straight-leg-raise':
      return scoreFMSActiveStraightLegRaise;
    case 'trunk-stability-pushup':
      return scoreFMSTrunkStabilityPushUp;
    case 'rotary-stability':
      return scoreFMSRotaryStability;
    default:
      return scoreFMSDeepSquat;
  }
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
