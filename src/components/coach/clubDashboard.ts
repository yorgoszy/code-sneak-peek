// Shared presentation scope for the Club dashboard and its navigation.
export const CLUB_DASHBOARD_PATHS = [
  '/dashboard/coach-overview',
  '/dashboard/my-athletes',
  '/dashboard/coach-groups',
  '/dashboard/coach-subscriptions',
  '/dashboard/coach-profile',
] as const;

export const isClubDashboardPath = (path: string) =>
  CLUB_DASHBOARD_PATHS.includes(path.split('?')[0] as typeof CLUB_DASHBOARD_PATHS[number]);

export const usesClubDashboard = (viewedRole: string | null | undefined, signedInIsClub: boolean) =>
  viewedRole ? viewedRole === 'club' : signedInIsClub;
/** A paid ThaiHub account (club/coach/federation) with no active paid subscription loses dashboard access. */
export function isThaiHubPlanExpired(status: { role: string; active: boolean } | null | undefined): boolean {
  return Boolean(status && ['club', 'coach', 'federation'].includes(status.role) && !status.active);
}

/** The plan to charge on renewal: a scheduled downgrade wins over the current role. */
export function renewalPlan(status: { role: string; next_plan?: string | null }): string {
  return status.next_plan || status.role;
}
