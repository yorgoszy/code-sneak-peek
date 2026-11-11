import { describe, it, expect } from 'bun:test';
import { suppressBookingEmail } from './emailPolicy';

describe('section booking email policy', () => {
  it('does not email the user on a section booking', () => {
    expect(suppressBookingEmail('booking_created')).toBe(true);
  });
  it('does not email the admin on a section booking', () => {
    expect(suppressBookingEmail('booking_admin_notification')).toBe(true);
  });
  it('preserves videocall and purchase emails', () => {
    for (const type of ['booking_pending', 'booking_approved', 'package_receipt', 'package_purchased']) {
      expect(suppressBookingEmail(type)).toBe(false);
    }
  });
});