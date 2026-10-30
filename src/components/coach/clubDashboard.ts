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