// Presentation scope only; subscription permissions stay in their existing hooks.
export function usesAdminUserOverview(
  role: string | undefined,
  isCoachManaged: boolean,
  ownerRole: string | null,
): boolean {
  return (role === 'athlete' || role === 'general')
    && !isCoachManaged
    && (ownerRole === null || ownerRole === 'admin');
}