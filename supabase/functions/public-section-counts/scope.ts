// The public landing calendar is the global admin calendar, never a tenant calendar.
export function adminCalendarOnly<T>(query: { is(column: string, value: null): T }): T {
  return query.is('coach_id', null);
}