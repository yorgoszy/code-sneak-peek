import { CoachLayout } from '@/components/layouts/CoachLayout';
import { CoachOnlineBooking } from '@/components/booking/CoachOnlineBooking';

export default function CoachOnlineBookingPage() {
  return <CoachLayout title="Online Booking" ContentComponent={CoachOnlineBooking} />;
}