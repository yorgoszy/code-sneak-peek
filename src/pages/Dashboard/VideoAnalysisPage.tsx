import React from "react";
import { CoachLayout } from "@/components/layouts/CoachLayout";
import { VideoAnalysisOverview } from "@/components/video-analysis/VideoAnalysisOverview";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import AdminVideoAnalysisPage from "@/pages/Dashboard/AdminVideoAnalysisPage";

const VideoAnalysisPage = () => {
  const { isAdmin } = useRoleCheck();

  // Κάθε ρόλος μπαίνει από ΤΟ ΙΔΙΟ route (/dashboard/video-analysis),
  // αλλά βλέπει το δικό του panel/layout.
  if (isAdmin()) {
    return <AdminVideoAnalysisPage />;
  }

  return (
    <CoachLayout title="Video Analysis">
      <VideoAnalysisOverview />
    </CoachLayout>
  );
};

export default VideoAnalysisPage;
