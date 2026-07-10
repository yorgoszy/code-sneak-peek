/**
 * The exercise "sets" column in the DB is an integer, but the builder UI
 * allows toggling the field into "time mode" where the user types "MM:SS".
 * When we persist to the DB we must coerce that string to an integer.
 *
 * Rules:
 * - integer / numeric string -> parseInt, fallback 1
 * - "MM:SS" time string      -> total seconds (integer)
 * - empty / null / invalid   -> 1
 */
export function sanitizeSetsForDb(value: any): number {
  if (value === null || value === undefined || value === '') return 1;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.round(value));
  }
  const str = String(value).trim();
  if (str.includes(':')) {
    const [m, s] = str.split(':');
    const total = (parseInt(m, 10) || 0) * 60 + (parseInt(s, 10) || 0);
    return total > 0 ? total : 1;
  }
  const n = parseInt(str, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
