import { CoachLayout } from '@/components/layouts/CoachLayout';
import { CoachOnlineCoaching } from '@/components/online-coaching/CoachOnlineCoaching';

export default function CoachOnlineCoachingPage() {
  return <CoachLayout title="Online Coaching" ContentComponent={CoachOnlineCoaching} />;
}