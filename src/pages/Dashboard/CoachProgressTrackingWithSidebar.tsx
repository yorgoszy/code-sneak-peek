import { CoachLayout } from "@/components/layouts/CoachLayout";
import { useCoachContext } from "@/contexts/CoachContext";
import CoachProgressTracking from "@/pages/CoachProgressTracking";

const CoachProgressTrackingContent = () => {
  const { coachId } = useCoachContext();
  
  return <CoachProgressTracking contextCoachId={coachId || undefined} />;
};

const CoachProgressTrackingWithSidebar = () => {
  return (
    <CoachLayout title="Τεστ" showHeader={false} ContentComponent={CoachProgressTrackingContent} />
  );
};

export default CoachProgressTrackingWithSidebar;
