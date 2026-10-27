import AnnualPlanning from '@/pages/AnnualPlanning';
import { CoachLayout } from '@/components/layouts/CoachLayout';
import { useCoachContext } from '@/contexts/CoachContext';

function CoachAnnualPlanningContent() {
  const { coachId } = useCoachContext();
  if (!coachId) return null;
  return <AnnualPlanning coachId={coachId} />;
}

export default function CoachAnnualPlanningPage() {
  return <CoachLayout title="Ετήσιος Προγραμματισμός" ContentComponent={CoachAnnualPlanningContent} />;
}