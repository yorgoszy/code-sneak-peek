import { CoachLayout } from "@/components/layouts/CoachLayout";
import { useCoachContext } from "@/contexts/CoachContext";
import { GoalsAwardsContent } from "@/components/goals/GoalsAwardsContent";

const CoachGoalsAwardsContent = () => {
  const { coachId } = useCoachContext();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Στόχοι & Βραβεία</h1>
        <p className="text-muted-foreground">Διαχείριση στόχων και βραβείων αθλητών</p>
      </div>
      <GoalsAwardsContent coachId={coachId || undefined} />
    </div>
  );
};

const CoachGoalsAwardsPage = () => {
  return (
    <CoachLayout title="Στόχοι & Βραβεία" ContentComponent={CoachGoalsAwardsContent} />
  );
};

export default CoachGoalsAwardsPage;
