export function scopeAnnualPlanningUsers<T extends { eq: (column: string, value: string) => T }>(query: T, coachId?: string) {
  return coachId ? query.eq('coach_id', coachId) : query;
}

export function scopeAnnualPlanningPhases<T extends { eq: (column: string, value: string) => T }>(query: T, coachId?: string) {
  return coachId ? query.eq('app_users.coach_id', coachId) : query;
}

export function filterAnnualPlanningRecipients(ids: string[], allowedIds: string[]) {
  const allowed = new Set(allowedIds);
  return [...new Set(ids)].filter(id => allowed.has(id));
}