import { it } from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert';
import { summarizeTodaysClasses, loadCoachBookingAppointments, type CoachBookingAppointment } from './coachBookingAppointments';

const row = (overrides: Partial<CoachBookingAppointment> = {}) => ({
  id: 'booking-1', user_id: 'user-1', coach_id: 'coach-1', booking_date: '2026-11-02',
  booking_type: 'gym_visit', status: 'confirmed', user: { name: 'Μαρία' }, ...overrides,
} as CoachBookingAppointment);

it('counts unique people, not appointments, and retains their names', () => {
  const result = summarizeTodaysClasses([row(), row({ id: 'booking-2' }), row({ user_id: 'user-2', user: { id: 'user-2', name: 'Νίκος', email: '', avatar_url: null } })], 'coach-1', '2026-11-02');
  strictEqual(result.count, 2);
  deepStrictEqual(result.attendees.map(a => a.name), ['Μαρία', 'Νίκος']);
  strictEqual(result.appointments.length, 3);
});
it('includes only today for the viewed coach and gym bookings', () => {
  const result = summarizeTodaysClasses([row(), row({ booking_date: '2026-11-03' }), row({ coach_id: 'coach-2' }), row({ booking_type: 'videocall' })], 'coach-1', '2026-11-02');
  strictEqual(result.appointments.length, 1);
});
it('excludes cancelled and missed but retains pending and completed attendance', () => {
  const result = summarizeTodaysClasses(['confirmed', 'pending', 'completed', 'cancelled', 'missed'].map((status, i) => row({ status, user_id: `user-${i}` })), 'coach-1', '2026-11-02');
  strictEqual(result.count, 3);
  deepStrictEqual(result.appointments.map(a => a.status), ['confirmed', 'pending', 'completed']);
});
it('loads all pages and filters appointments by coach, gym and date', async () => {
  const filters: unknown[] = [];
  const query = {
    select: () => query,
    eq: (key: string, value: string) => { filters.push([key, value]); return query; },
    order: () => query,
    range: async (start: number) => ({ data: start === 0 ? Array.from({ length: 1000 }, () => row()) : [row({ id: 'last' })], error: null }),
  };
  const client = { from: () => query } as unknown as Parameters<typeof loadCoachBookingAppointments>[1];
  const result = await loadCoachBookingAppointments('coach-1', client, '2026-11-02');
  strictEqual(result.length, 1001);
  deepStrictEqual(filters.slice(0, 3), [['coach_id', 'coach-1'], ['booking_type', 'gym_visit'], ['booking_date', '2026-11-02']]);
});