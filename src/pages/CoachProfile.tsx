import { CoachLayout } from "@/components/layouts/CoachLayout";
import { useCoachContext } from "@/contexts/CoachContext";
import { CoachProfileSettings } from "@/components/coach/CoachProfileSettings";

const CoachProfileContent = () => {
  const { coachId } = useCoachContext();
  
  if (!coachId) return null;
  
  return (
    <div className="max-w-3xl mx-auto">
      <CoachProfileSettings coachId={coachId} />
    </div>
  );
};

const CoachProfile = () => {
  return (
    <CoachLayout title="Ρυθμίσεις Προφίλ">
      <CoachProfileContent />
    </CoachLayout>
  );
};

export default CoachProfile;
