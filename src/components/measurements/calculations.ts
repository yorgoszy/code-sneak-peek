export type Direction = 'higher' | 'lower' | 'observe';
export function performanceDrop(reference: number | null, current: number, direction: string): number | null {
  if (reference === null || !Number.isFinite(reference) || reference <= 0 || !Number.isFinite(current) || current <= 0 || direction === 'observe') return null;
  return (direction === 'lower' ? current - reference : reference - current) / reference * 100;
}
export function bestValue(values: number[], direction: string): number | null {
  const valid = values.filter(v => Number.isFinite(v) && v > 0);
  if (!valid.length || direction === 'observe') return null;
  return direction === 'lower' ? Math.min(...valid) : Math.max(...valid);
}
export function changeLabel(drop: number | null): string {
  if (drop === null) return '—';
  return `${Math.abs(drop).toFixed(1)}% ${drop < 0 ? 'βελτίωση' : 'πτώση'}`;
}