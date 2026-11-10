export interface RosterUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  coach_id?: string | null;
}

export interface RosterSubscription {
  user_id: string;
  coach_id: string | null;
  status: string;
  is_paused: boolean | null;
  start_date: string;
  end_date: string;
  app_users: RosterUser | null;
  subscription_types: { allowed_sections: string[] | null } | null;
}

export function subscriptionMembers(rows: RosterSubscription[], sectionId: string, date: string): RosterUser[] {
  const users = new Map<string, RosterUser>();
  for (const row of rows) {
    if (row.coach_id != null || !row.app_users || row.app_users.coach_id != null) continue;
    if (row.status !== 'active' || row.is_paused || row.start_date > date || row.end_date < date) continue;
    if (!row.subscription_types) continue;
    const sections = row.subscription_types.allowed_sections;
    if (sections?.length && !sections.includes(sectionId)) continue;
    users.set(row.user_id, row.app_users);
  }
  return [...users.values()];
}

export function mergeSectionUsers(members: RosterUser[], bookings: RosterUser[]): RosterUser[] {
  return [...new Map([...members, ...bookings].map(user => [user.id, user])).values()];
}