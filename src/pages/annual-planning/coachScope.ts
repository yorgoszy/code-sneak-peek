export function filterAnnualPlanningRecipients(ids: string[], allowedIds: string[]) {
  const allowed = new Set(allowedIds);
  return [...new Set(ids)].filter(id => allowed.has(id));
}