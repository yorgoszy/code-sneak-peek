import { it } from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert';
import { sectionVisitEvents } from './sectionVisitEvents.ts';

const booking = { id: 'b', user_id: 'user', section_id: 'section', booking_date: '2026-10-01', booking_time: '07:00:00', booking_type: 'gym_visit', status: 'confirmed', attendance_status: 'completed' };
const visit = { id: 'v', user_id: 'user', section_id: 'section', visit_date: '2026-10-02', visit_time: '14:42:00', visit_type: 'manual' };

it('completed past bookings remain present from persisted attendance', () => {
  const events = sectionVisitEvents([booking], [], 'user', 'section');
  strictEqual(events[0].attended, true);
  strictEqual(events[0].booking_date, '2026-10-01');
});
it('manual visits preserve actual date and time', () => {
  const events = sectionVisitEvents([], [visit], 'user', 'section');
  strictEqual(events[0].booking_time, '14:42:00');
  strictEqual(events[0].booking_date, '2026-10-02');
  strictEqual(events[0].attended, true);
});
it('never includes another user or another section', () => {
  deepStrictEqual(sectionVisitEvents([{ ...booking, user_id: 'other' }], [{ ...visit, section_id: 'other' }], 'user', 'section'), []);
});
it('does not invent a section for legacy manual visits', () => {
  deepStrictEqual(sectionVisitEvents([], [{ ...visit, section_id: null }], 'user', 'section'), []);
});
it('booking debit and QR shadow rows do not duplicate attendance', () => {
  strictEqual(sectionVisitEvents([booking], [{ ...visit, visit_type: 'booking' }, { ...visit, visit_type: 'qr_scan' }], 'user', 'section').length, 1);
});
it('distinct manual visits sharing the same time remain distinct', () => {
  strictEqual(sectionVisitEvents([], [visit, { ...visit, id: 'v2' }], 'user', 'section').length, 2);
});
it('missed attendance is not displayed as completed and cancelled rows are excluded', () => {
  const events = sectionVisitEvents([{ ...booking, attendance_status: 'missed' }, { ...booking, id: 'c', status: 'cancelled' }], [], 'user', 'section');
  strictEqual(events.length, 1);
  strictEqual(events[0].attended, false);
});