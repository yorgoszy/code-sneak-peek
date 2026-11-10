export type SectionSchedule = Record<string, string[]>;

export function normalizeSectionSchedule(value: unknown, availableHours: unknown): SectionSchedule {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const hours = availableHours && typeof availableHours === 'object' && !Array.isArray(availableHours)
    ? availableHours as Record<string, unknown> : {};
  const result: SectionSchedule = {};
  for (const [day, times] of Object.entries(value)) {
    const available = hours[day];
    if (!Array.isArray(times) || !Array.isArray(available)) continue;
    const allowed = available.filter((time): time is string => typeof time === 'string').map(time => time.slice(0, 5));
    const selected = [...new Set(times.filter((time): time is string => typeof time === 'string')
      .map(time => time.slice(0, 5)).filter(time => allowed.includes(time)))].sort();
    if (selected.length) result[day] = selected;
  }
  return result;
}