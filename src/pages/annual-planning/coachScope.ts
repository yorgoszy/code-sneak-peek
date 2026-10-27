export function scopeAnnualPlanningUsers<T extends { eq: (column: string, value: string) => unknown }>(query: T, coachId?: string): T {
  return (coachId ? query.eq('coach_id', coachId) : query) as T;
}

export function scopeAnnualPlanningPhases<T extends { eq: (column: string, value: string) => unknown }>(query: T, coachId?: string): T {
  return (coachId ? query.eq('app_users.coach_id', coachId) : query) as T;
}

export function filterAnnualPlanningRecipients(ids: string[], allowedIds: string[]) {
  const allowed = new Set(allowedIds);
  return [...new Set(ids)].filter(id => allowed.has(id));
}