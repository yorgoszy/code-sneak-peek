/**
 * Load-Velocity Profile: Pure Interpolation from Test Data
 * 
 * Uses athlete's actual load/velocity test points to predict velocity.
 * Each test point is converted to %1RM (relative to the test's own max weight),
 * then piecewise linear interpolation is used to predict velocity at any %1RM.
 * 
 * NO regression formulas for velocity prediction — only real measured data.
 * linearRegression is exported only for the test recording UI (R², estimated 1RM display).
 */

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r_squared: number;
}

/**
 * Calculates linear regression: velocity = slope × weight + intercept
 * Used only in the test recording UI for R² and estimated 1RM display.
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

export interface LoadVelocityPoint {
  weight_kg: number;
  velocity_ms: number;
}

/** A test point expressed as percentage of the test's 1RM */
export interface PercentageVelocityPoint {
  percentage: number; // e.g. 50, 75, 100
  velocity_ms: number;
}

export interface VelocityProfile {
  /** The max weight from the test session (the test's own 1RM) */
  test1RM: number;
  /** Sorted points by percentage ascending for interpolation */
  percentagePoints: PercentageVelocityPoint[];
  /** Raw sorted points (ascending by weight) */
  sortedPoints: LoadVelocityPoint[];
  /** Measured velocity at the test's 1RM (heaviest attempt) */
  velocityAt1RM: number;
}

/**
 * Builds a velocity profile from test data points.
 * Converts absolute weights to percentages of the test's max weight.
 */
export function buildVelocityProfile(
  points: LoadVelocityPoint[],
  _terminalVelocity?: number // kept for API compat, not used
): VelocityProfile | null {
  if (points.length < 2) return null;

  // Sort by weight ascending
  const sortedPoints = [...points].sort((a, b) => a.weight_kg - b.weight_kg);
  
  // The test's 1RM is the heaviest weight tested
  const test1RM = sortedPoints[sortedPoints.length - 1].weight_kg;
  if (test1RM <= 0) return null;

  // Convert each point to a percentage of test1RM
  const percentagePoints: PercentageVelocityPoint[] = sortedPoints.map(p => ({
    percentage: Math.round((p.weight_kg / test1RM) * 1000) / 10, // e.g. 75.0
    velocity_ms: p.velocity_ms,
  }));

  const velocityAt1RM = sortedPoints[sortedPoints.length - 1].velocity_ms;

  return { test1RM, percentagePoints, sortedPoints, velocityAt1RM };
}

/**
 * Predicts velocity for a given %1RM using pure interpolation from test data.
 * 
 * The percentage is relative to the PROGRAM's 1RM (from user_exercise_1rm),
 * but we convert it to the test's scale for interpolation.
 * 
 * Example: Program 1RM = 120kg, test 1RM = 88kg
 * User asks for 85% → target = 102kg → test percentage = 102/88 = 115.9%
 * This would be outside test range, so we extrapolate from last 2 points.
 * 
 * BUT if the program 1RM matches the test (or is close), it works perfectly:
 * Program 1RM = 88kg, 85% → 74.8kg → test percentage = 74.8/88 = 85% → interpolate!
 */
export function predictVelocityFromPercentage(
  profile: VelocityProfile,
  percentage1RM: number,
  actual1RM: number
): number | null {
  if (percentage1RM <= 0 || actual1RM <= 0) return null;

  // Convert the target load to a percentage of the TEST's 1RM
  const targetLoad = (percentage1RM / 100) * actual1RM;
  const testPercentage = (targetLoad / profile.test1RM) * 100;

  return interpolateByPercentage(profile.percentagePoints, testPercentage);
}

/**
 * Predicts velocity directly from load (kg)
 */
export function predictVelocityFromLoad(
  profile: VelocityProfile,
  loadKg: number
): number | null {
  if (loadKg <= 0) return null;

  const testPercentage = (loadKg / profile.test1RM) * 100;
  return interpolateByPercentage(profile.percentagePoints, testPercentage);
}

/**
 * Pure piecewise linear interpolation on percentage points.
 * For values outside the tested range, extrapolates linearly from the 2 nearest points.
 */
function interpolateByPercentage(
  points: PercentageVelocityPoint[],
  targetPercentage: number
): number | null {
  if (points.length === 0) return null;
  if (points.length === 1) {
    // Can't interpolate with 1 point
    return points[0].velocity_ms;
  }

  const minPct = points[0].percentage;
  const maxPct = points[points.length - 1].percentage;

  // Within tested range: interpolate
  if (targetPercentage >= minPct && targetPercentage <= maxPct) {
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      if (targetPercentage >= p1.percentage && targetPercentage <= p2.percentage) {
        if (p1.percentage === p2.percentage) return p1.velocity_ms;

        const t = (targetPercentage - p1.percentage) / (p2.percentage - p1.percentage);
        const velocity = p1.velocity_ms + t * (p2.velocity_ms - p1.velocity_ms);
        return velocity > 0 ? Math.round(velocity * 100) / 100 : null;
      }
    }
  }

  // Below tested range: extrapolate from first 2 points
  if (targetPercentage < minPct) {
    const p1 = points[0];
    const p2 = points[1];
    if (p1.percentage === p2.percentage) return p1.velocity_ms;
    const slope = (p2.velocity_ms - p1.velocity_ms) / (p2.percentage - p1.percentage);
    const velocity = p1.velocity_ms + slope * (targetPercentage - p1.percentage);
    return velocity > 0 ? Math.round(velocity * 100) / 100 : null;
  }

  // Above tested range: extrapolate from last 2 points
  if (targetPercentage > maxPct) {
    const p1 = points[points.length - 2];
    const p2 = points[points.length - 1];
    if (p1.percentage === p2.percentage) return p2.velocity_ms;
    const slope = (p2.velocity_ms - p1.velocity_ms) / (p2.percentage - p1.percentage);
    const velocity = p2.velocity_ms + slope * (targetPercentage - p2.percentage);
    return velocity > 0 ? Math.round(velocity * 100) / 100 : null;
  }

  return null;
}
