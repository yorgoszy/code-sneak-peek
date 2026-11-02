export type SubscriptionStatusLabel = 'Ενεργή' | 'Ανενεργή' | 'Παύση';

export interface StatusSubscription {
  user_id: string | null;
  coach_id: string | null;
  start_date: string;
  end_date: string;
  status: string;
  is_paused: boolean | null;
}

export function isCoachSubscriptionOwner(role?: string): boolean {
  return role === 'coach' || role === 'club';
}

export function subscriptionStatusForUser(
  user: { id: string; coach_id?: string | null },
  subscriptions: StatusSubscription[],
  coachManaged: boolean,
  today: string,
): SubscriptionStatusLabel {
  const ownSubscriptions = subscriptions.filter(subscription =>
    subscription.user_id === user.id &&
    (!coachManaged || subscription.coach_id === user.coach_id) &&
    subscription.status === 'active',
  );
  if (ownSubscriptions.some(subscription =>
    !subscription.is_paused &&
    subscription.start_date.slice(0, 10) <= today &&
    subscription.end_date.slice(0, 10) >= today,
  )) return 'Ενεργή';
  if (ownSubscriptions.some(subscription => subscription.is_paused)) return 'Παύση';
  return 'Ανενεργή';
}