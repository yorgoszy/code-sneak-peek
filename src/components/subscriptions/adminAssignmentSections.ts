// Older global gym sections predate booking_type and store null.
export function adminAssignmentSections<T extends {
  eq: (column: string, value: boolean) => T;
  is: (column: string, value: null) => T;
  or: (filter: string) => T;
}>(query: T): T {
  return query.eq('is_active', true).is('coach_id', null)
    .or('booking_type.is.null,booking_type.eq.gym_visit');
}