const unrestrictedTabs = new Set(['shop', 'edit-profile', 'download-app', 'safety']);

// Visibility only: booking and subscription access retain their existing checks.
export function resolveProfileTab(tab: string, hasSubscription: boolean, isCoachManaged: boolean): string {
  if (isCoachManaged && tab === 'shop') return 'overview';
  if (tab === 'overview') return 'overview';
  if (!hasSubscription && !unrestrictedTabs.has(tab)) {
    return 'overview';
  }
  return tab;
}