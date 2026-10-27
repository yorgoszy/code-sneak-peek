export function filterAnnualPlanningRecipients(ids: string[], allowedIds: string[]) {
  const allowed = new Set(allowedIds);
  return [...new Set(ids)].filter(id => allowed.has(id));
}

export function scopeSavedMacrocycles<T>(query: T, coachId: string | undefined, filter: (query: T, coachId: string) => T): T {
  return coachId ? filter(query, coachId) : query;
}