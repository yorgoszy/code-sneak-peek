// Presentation scope only; subscription permissions stay in their existing hooks.
export function showsAthleteOverviewCards(
  role: string | undefined,
  isAthlete: boolean | null | undefined,
  scopeLoading: boolean,
): boolean {
  return !scopeLoading && (role === 'athlete' || isAthlete === true);
}

export function usesAdminUserOverview(
  role: string | undefined,
  isCoachManaged: boolean,
  ownerRole: string | null,
): boolean {
  return (role === 'athlete' || role === 'general')
    && !isCoachManaged
    && (ownerRole === null || ownerRole === 'admin');
}