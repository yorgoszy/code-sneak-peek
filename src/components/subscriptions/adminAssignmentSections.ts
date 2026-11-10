// Older global gym sections predate booking_type and store null.
export const adminAssignmentSections = {
  activeColumn: 'is_active',
  ownerColumn: 'coach_id',
  bookingTypes: 'booking_type.is.null,booking_type.eq.gym_visit',
} as const;