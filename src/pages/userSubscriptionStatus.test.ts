import { it } from 'node:test';
import { strictEqual } from 'node:assert';
import { isCoachSubscriptionOwner, subscriptionStatusForUser, type StatusSubscription } from './userSubscriptionStatus';

const user = { id: 'user-1', coach_id: 'club-1' };
const row = (overrides: Partial<StatusSubscription> = {}): StatusSubscription => ({
  user_id: user.id, coach_id: user.coach_id, start_date: '2026-11-01', end_date: '2026-11-30',
  status: 'active', is_paused: false, ...overrides,
});
const status = (rows: StatusSubscription[]) => subscriptionStatusForUser(user, rows, true, '2026-11-02');

it('routes both coach and club users to their owner subscriptions, not admin subscriptions', () => {
  strictEqual(isCoachSubscriptionOwner('coach'), true);
  strictEqual(isCoachSubscriptionOwner('club'), true);
  strictEqual(isCoachSubscriptionOwner('admin'), false);
});
it('shows the active subscription belonging to the user and their own coach/club', () => {
  strictEqual(status([row()]), 'Ενεργή');
  strictEqual(status([row({ coach_id: 'other-coach' })]), 'Ανενεργή');
  strictEqual(status([row({ user_id: 'other-user' })]), 'Ανενεργή');
});
it('does not let another expired subscription hide an active subscription', () => {
  strictEqual(status([row({ end_date: '2026-11-01' }), row()]), 'Ενεργή');
});
it('keeps the subscription active throughout its final date', () => {
  strictEqual(status([row({ end_date: '2026-11-02' })]), 'Ενεργή');
});
it('does not activate future, expired or cancelled subscriptions', () => {
  strictEqual(status([row({ start_date: '2026-11-03' })]), 'Ανενεργή');
  strictEqual(status([row({ end_date: '2026-11-01' })]), 'Ανενεργή');
  strictEqual(status([row({ status: 'cancelled' })]), 'Ανενεργή');
});
it('shows pause only from the matching owner subscription, unless another is active', () => {
  strictEqual(status([row({ is_paused: true })]), 'Παύση');
  strictEqual(status([row({ is_paused: true, coach_id: 'other-coach' })]), 'Ανενεργή');
  strictEqual(status([row({ is_paused: true }), row()]), 'Ενεργή');
});