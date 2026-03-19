/**
 * Load-Velocity Profile: Piecewise Interpolation + Linear Regression
 * 
 * Uses athlete's historical load/velocity data to predict:
 * - Velocity at any given load or %1RM
 * - Estimated 1RM using terminal velocity
 * 
 * Primary method: Piecewise linear interpolation between actual test points
 * Fallback: Linear regression for extrapolation outside tested range
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
  /** Sorted data points (ascending by weight) for interpolation */
  sortedPoints: LoadVelocityPoint[];
}

/**
 * Calculates linear regression: velocity = slope × weight + intercept
 */
export function linearRegression(points: LoadVelocityPoint[]): LinearRegressionResult | null {
  if (points.length < 2) return null;

  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (const p of points) {
    sumX += p.weight_kg;
    sumY += p.velocity_ms;
    sumXY += p.weight_kg * p.velocity_ms;
    sumX2 += p.weight_kg * p.weight_kg;
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

  // Sort points by weight ascending for interpolation
  const sortedPoints = [...points].sort((a, b) => a.weight_kg - b.weight_kg);

  // Estimated 1RM: load where velocity = terminal_velocity
  let estimated1RM: number | null = null;
  if (regression.slope !== 0 && terminalVelocity > 0) {
    const rm = (terminalVelocity - regression.intercept) / regression.slope;
    if (rm > 0) {
      estimated1RM = Math.round(rm * 10) / 10;
    }
  }

  return { regression, estimated1RM, terminalVelocity, sortedPoints };
}

/**
 * Piecewise linear interpolation between known data points.
 * If load is between two measured points, interpolate linearly.
 * If load is outside the range, use regression to extrapolate.
 */
function interpolateVelocity(
  sortedPoints: LoadVelocityPoint[],
  regression: LinearRegressionResult,
  targetLoad: number
): number | null {
  if (sortedPoints.length === 0) return null;

  // If only one point, use regression
  if (sortedPoints.length === 1) {
    const velocity = regression.slope * targetLoad + regression.intercept;
    return velocity > 0 && velocity < 3 ? Math.round(velocity * 100) / 100 : null;
  }

  const minWeight = sortedPoints[0].weight_kg;
  const maxWeight = sortedPoints[sortedPoints.length - 1].weight_kg;

  // If target is within the tested range, interpolate
  if (targetLoad >= minWeight && targetLoad <= maxWeight) {
    // Find the two surrounding points
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i];
      const p2 = sortedPoints[i + 1];

      if (targetLoad >= p1.weight_kg && targetLoad <= p2.weight_kg) {
        // Exact match
        if (p1.weight_kg === p2.weight_kg) return p1.velocity_ms;

        // Linear interpolation
        const t = (targetLoad - p1.weight_kg) / (p2.weight_kg - p1.weight_kg);
        const velocity = p1.velocity_ms + t * (p2.velocity_ms - p1.velocity_ms);
        return velocity > 0 && velocity < 3 ? Math.round(velocity * 100) / 100 : null;
      }
    }
  }

  // Outside range: use regression for extrapolation
  const velocity = regression.slope * targetLoad + regression.intercept;
  return velocity > 0 && velocity < 3 ? Math.round(velocity * 100) / 100 : null;
}

/**
 * Predicts velocity for a given %1RM using the athlete's profile
 * Uses piecewise interpolation for accuracy, regression for extrapolation
 */
export function predictVelocityFromPercentage(
  profile: VelocityProfile,
  percentage1RM: number,
  actual1RM: number
): number | null {
  if (!profile.regression || percentage1RM <= 0 || actual1RM <= 0) return null;

  const targetLoad = (percentage1RM / 100) * actual1RM;

  // Use piecewise interpolation if we have sorted points
  if (profile.sortedPoints && profile.sortedPoints.length > 0) {
    return interpolateVelocity(profile.sortedPoints, profile.regression, targetLoad);
  }

  // Fallback to pure regression
  const velocity = profile.regression.slope * targetLoad + profile.regression.intercept;
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

  // Use piecewise interpolation if available
  if (profile.sortedPoints && profile.sortedPoints.length > 0) {
    return interpolateVelocity(profile.sortedPoints, profile.regression, loadKg);
  }

  const velocity = profile.regression.slope * loadKg + profile.regression.intercept;
  if (velocity <= 0 || velocity > 3) return null;
  return Math.round(velocity * 100) / 100;
}
