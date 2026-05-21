/**
 * Repeated Sprint Bout (RSB) detection — Spencer 2004.
 *
 * Definition: A sequence of 3 or more sprints where the MEAN inter-sprint
 * recovery time (gap between consecutive sprints) is strictly less than 21 seconds.
 */

export interface SprintEvent {
  /** Sprint start time in seconds from session start */
  start_s: number;
  /** Sprint end time in seconds from session start */
  end_s: number;
  /** Optional metadata */
  distance_m?: number;
  peak_speed_kmh?: number;
}

export interface RepeatedSprintBout {
  startIndex: number;
  endIndex: number;
  sprintCount: number;
  meanRecovery_s: number;
  totalDuration_s: number;
  sprints: SprintEvent[];
}

export const RSB_MIN_SPRINTS = 3;
export const RSB_MAX_MEAN_RECOVERY_S = 21;

/**
 * Detects RSBs in a chronological list of sprint events.
 * Greedy maximal-window approach: extends each candidate window as long as
 * the mean inter-sprint recovery remains < 21s and >= 3 sprints qualify.
 */
export function detectRepeatedSprintBouts(sprints: SprintEvent[]): RepeatedSprintBout[] {
  if (!sprints || sprints.length < RSB_MIN_SPRINTS) return [];

  const sorted = [...sprints].sort((a, b) => a.start_s - b.start_s);
  const bouts: RepeatedSprintBout[] = [];

  let i = 0;
  while (i <= sorted.length - RSB_MIN_SPRINTS) {
    let j = i + 1;
    let recoverySum = 0;
    let recoveryCount = 0;
    let lastValidEnd = -1;

    while (j < sorted.length) {
      const gap = sorted[j].start_s - sorted[j - 1].end_s;
      const newSum = recoverySum + gap;
      const newCount = recoveryCount + 1;
      const newMean = newSum / newCount;

      if (newMean < RSB_MAX_MEAN_RECOVERY_S) {
        recoverySum = newSum;
        recoveryCount = newCount;
        if (j - i + 1 >= RSB_MIN_SPRINTS) lastValidEnd = j;
        j++;
      } else {
        break;
      }
    }

    if (lastValidEnd >= 0) {
      const boutSprints = sorted.slice(i, lastValidEnd + 1);
      const gaps = boutSprints
        .slice(1)
        .map((s, idx) => s.start_s - boutSprints[idx].end_s);
      const meanRecovery = gaps.reduce((a, b) => a + b, 0) / gaps.length;

      bouts.push({
        startIndex: i,
        endIndex: lastValidEnd,
        sprintCount: boutSprints.length,
        meanRecovery_s: meanRecovery,
        totalDuration_s: boutSprints[boutSprints.length - 1].end_s - boutSprints[0].start_s,
        sprints: boutSprints,
      });

      i = lastValidEnd + 1;
    } else {
      i++;
    }
  }

  return bouts;
}

export function isRepeatedSprintBout(sprints: SprintEvent[]): boolean {
  if (!sprints || sprints.length < RSB_MIN_SPRINTS) return false;
  const sorted = [...sprints].sort((a, b) => a.start_s - b.start_s);
  const gaps = sorted.slice(1).map((s, i) => s.start_s - sorted[i].end_s);
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  return mean < RSB_MAX_MEAN_RECOVERY_S;
}
