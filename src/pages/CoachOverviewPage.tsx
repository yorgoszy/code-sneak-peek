import { CoachLayout } from "@/components/layouts/CoachLayout";
import { useEffectiveCoachId } from "@/hooks/useEffectiveCoachId";
import { CoachOverview } from "@/components/coach/CoachOverview";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";

const CoachOverviewContent = () => {
  const { effectiveCoachId, loading } = useEffectiveCoachId();
  
  if (loading) return <CustomLoadingScreen />;
  if (!effectiveCoachId) return null;
  
  return (
    <div className="max-w-6xl mx-auto">
      <CoachOverview coachId={effectiveCoachId} />
    </div>
  );
};

const CoachOverviewPage = () => {
  return (
    <CoachLayout title="Επισκόπηση" ContentComponent={CoachOverviewContent} />
  );
};

export default CoachOverviewPage;
