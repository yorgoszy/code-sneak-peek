import { CoachLayout } from "@/components/layouts/CoachLayout";
import { HealthCardsContent } from "@/pages/Dashboard/HealthCardsPage";

/**
 * Σελίδα Κάρτας Υγείας για coach (/dashboard/coach-health-cards).
 * Δείχνει μόνο τις κάρτες των αθλητών του συγκεκριμένου coach
 * (το HealthCardsContent φιλτράρει με το userProfile.id του συνδεδεμένου χρήστη).
 */
const CoachHealthCardsPage = () => {
  return (
    <CoachLayout title="Κάρτα Υγείας" ContentComponent={HealthCardsContent} />
  );
};

export default CoachHealthCardsPage;
