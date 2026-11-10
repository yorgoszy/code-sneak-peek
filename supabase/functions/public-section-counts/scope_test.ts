import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { adminCalendarOnly } from './scope.ts';

function queryRows(rows: { id: string; coach_id: string | null }[]) {
  return { is: (column: string, value: null) => {
    assertEquals(column, 'coach_id');
    return rows.filter(row => row.coach_id === value);
  } };
}

Deno.test('Live Program exposes only admin sections, excluding coach and club sections', () => {
  const rows = [
    { id: 'admin-section', coach_id: null },
    { id: 'coach-section', coach_id: 'coach-owner' },
    { id: 'club-section', coach_id: 'club-owner' },
  ];
  assertEquals(adminCalendarOnly(queryRows(rows)), [rows[0]]);
});

Deno.test('Live Program occupancy includes only admin bookings', () => {
  const rows = [
    { id: 'coach-booking', coach_id: 'coach-owner' },
    { id: 'admin-booking', coach_id: null },
    { id: 'club-booking', coach_id: 'club-owner' },
  ];
  assertEquals(adminCalendarOnly(queryRows(rows)), [rows[1]]);
});