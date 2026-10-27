import { CoachLayout } from "@/components/layouts/CoachLayout";
import { useCoachContext } from "@/contexts/CoachContext";
import { CoachKnowledgeShop } from "@/components/knowledge/CoachKnowledgeShop";

/**
 * Σελίδα Online Courses για coach (/dashboard/coach-courses).
 * Δείχνει τα μαθήματα που ο admin έχει βάλει προς πώληση και τα αγορασμένα του coach.
 */
const CoachCoursesContent = () => {
  const { coachId } = useCoachContext();

  if (!coachId) return null;

  return <CoachKnowledgeShop coachId={coachId} />;
};

const CoachCoursesPage = () => {
  return (
    <CoachLayout title="Online Courses" ContentComponent={CoachCoursesContent} />
  );
};

export default CoachCoursesPage;
