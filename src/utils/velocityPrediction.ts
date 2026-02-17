/**
 * Load-Velocity Profile: Linear Regression Algorithm
 * 
 * Uses athlete's historical load/velocity data to predict:
 * - Velocity at any given load or %1RM
 * - Estimated 1RM using terminal velocity
 * 
 * Formula: velocity = slope × load + intercept
 * 1RM estimate: load where velocity = terminal_velocity
 */

export interface LoadVelocityPoint {
  weight_kg: number;
  velocity_ms: number;
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r_squared: number;
}

export interface VelocityProfile {
  regression: LinearRegressionResult;
  estimated1RM: number | null;
  terminalVelocity: number;
}

/**
 * Calculates linear regression: velocity = slope × weight + intercept
 */
export function linearRegression(points: LoadVelocityPoint[]): LinearRegressionResult | null {
  if (points.length < 2) return null;

  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (const p of points) {
    sumX += p.weight_kg;
    sumY += p.velocity_ms;
    sumXY += p.weight_kg * p.velocity_ms;
    sumX2 += p.weight_kg * p.weight_kg;
    sumY2 += p.velocity_ms * p.velocity_ms;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // R² calculation
  const meanY = sumY / n;
  let ssRes = 0, ssTot = 0;
  for (const p of points) {
    const predicted = slope * p.weight_kg + intercept;
    ssRes += (p.velocity_ms - predicted) ** 2;
    ssTot += (p.velocity_ms - meanY) ** 2;
  }
  const r_squared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r_squared };
}

/**
 * Builds a complete velocity profile for an exercise
 */
export function buildVelocityProfile(
  points: LoadVelocityPoint[],
  terminalVelocity: number
): VelocityProfile | null {
  const regression = linearRegression(points);
  if (!regression) return null;

  // Estimated 1RM: load where velocity = terminal_velocity
  // terminal_velocity = slope × 1RM + intercept
  // 1RM = (terminal_velocity - intercept) / slope
  let estimated1RM: number | null = null;
  if (regression.slope !== 0) {
    const rm = (terminalVelocity - regression.intercept) / regression.slope;
    if (rm > 0) {
      estimated1RM = Math.round(rm * 10) / 10;
    }
  }

  return { regression, estimated1RM, terminalVelocity };
}

/**
 * Predicts velocity for a given %1RM using the athlete's profile
 * 
 * @param profile - The athlete's velocity profile
 * @param percentage1RM - The target intensity (e.g., 80 for 80%)
 * @param actual1RM - The actual or estimated 1RM in kg
 * @returns Predicted velocity in m/s, or null
 */
export function predictVelocityFromPercentage(
  profile: VelocityProfile,
  percentage1RM: number,
  actual1RM: number
): number | null {
  if (!profile.regression || percentage1RM <= 0) return null;

  // Use the profile's own estimated 1RM for velocity prediction
  // This keeps the velocity scale consistent with the regression line
  // (the tested 1RM may differ from the profile's estimated 1RM)
  const referenceRM = profile.estimated1RM && profile.estimated1RM > 0 
    ? profile.estimated1RM 
    : actual1RM;
  
  if (referenceRM <= 0) return null;

  const targetLoad = (percentage1RM / 100) * referenceRM;
  const velocity = profile.regression.slope * targetLoad + profile.regression.intercept;

  // Velocity should be positive and reasonable
  if (velocity <= 0 || velocity > 3) return null;

  return Math.round(velocity * 100) / 100;
}

/**
 * Predicts velocity directly from load (kg)
 */
export function predictVelocityFromLoad(
  profile: VelocityProfile,
  loadKg: number
): number | null {
  if (!profile.regression || loadKg <= 0) return null;

  const velocity = profile.regression.slope * loadKg + profile.regression.intercept;
  if (velocity <= 0 || velocity > 3) return null;

  return Math.round(velocity * 100) / 100;
}
