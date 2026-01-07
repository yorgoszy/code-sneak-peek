import { CoachLayout } from "@/components/layouts/CoachLayout";
import { useCoachContext } from "@/contexts/CoachContext";
import { CoachOverview } from "@/components/coach/CoachOverview";

const CoachOverviewContent = () => {
  const { coachId } = useCoachContext();
  
  if (!coachId) return null;
  
  return (
    <div className="max-w-6xl mx-auto">
      <CoachOverview coachId={coachId} />
    </div>
  );
};

const CoachOverviewPage = () => {
  return (
    <CoachLayout title="Επισκόπηση" ContentComponent={CoachOverviewContent} />
  );
};

export default CoachOverviewPage;
