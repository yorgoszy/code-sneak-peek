// These event types are exclusively gym/section booking confirmations.
export const suppressBookingEmail = (type: string): boolean =>
  type === 'booking_created' || type === 'booking_admin_notification';