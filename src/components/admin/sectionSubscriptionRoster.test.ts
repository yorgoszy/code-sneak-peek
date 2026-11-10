import { describe, it } from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert';
import { subscriptionMembers, mergeSectionUsers, slotBookingCount, type RosterSubscription } from './sectionSubscriptionRoster';

const row: RosterSubscription = {
  user_id: 'admin-user', coach_id: null, status: 'active', is_paused: false,
  start_date: '2026-11-01', end_date: '2026-11-30',
  app_users: { id: 'admin-user', name: 'User', email: 'user@example.test', avatar_url: null, coach_id: null },
  subscription_types: { allowed_sections: ['muay-thai'] },
};

describe('Subscription section roster', () => {
  it('counts only unique bookings for the displayed section and hour, like Live Program', () => {
    const booking = { section_id: 'muay-thai', user_id: 'admin-user', booking_time: '19:00:00' };
    strictEqual(slotBookingCount([], 'muay-thai', '19:00'), 0);
    strictEqual(slotBookingCount([booking, booking, { ...booking, user_id: 'other' }, { ...booking, booking_time: '18:00:00' }, { ...booking, section_id: 'open-gym' }], 'muay-thai', '19:00'), 2);
  });
  it('shows the user in the sections selected on their subscription', () => {
    deepStrictEqual(subscriptionMembers([row], 'muay-thai', '2026-11-10').map(u => u.id), ['admin-user']);
    strictEqual(subscriptionMembers([row], 'open-gym', '2026-11-10').length, 0);
  });
  it('excludes coach and club users from the admin calendar', () => {
    strictEqual(subscriptionMembers([{ ...row, coach_id: 'club' }, { ...row, app_users: { ...row.app_users as NonNullable<RosterSubscription['app_users']>, coach_id: 'coach' } }], 'muay-thai', '2026-11-10').length, 0);
  });
  it('requires an active unpaused subscription valid on the displayed day', () => {
    for (const change of [{ status: 'expired' }, { is_paused: true }, { start_date: '2026-11-11' }, { end_date: '2026-11-09' }]) {
      strictEqual(subscriptionMembers([{ ...row, ...change }], 'muay-thai', '2026-11-10').length, 0);
    }
  });
  it('treats unrestricted subscriptions as access to all sections', () => {
    strictEqual(subscriptionMembers([{ ...row, subscription_types: { allowed_sections: null } }], 'open-gym', '2026-11-10').length, 1);
  });
  it('does not count a member twice when they also book the slot', () => {
    const members = subscriptionMembers([row, row], 'muay-thai', '2026-11-10');
    strictEqual(mergeSectionUsers(members, members).length, 1);
  });
});