import React from 'react';
import { CoachLayout } from '@/components/layouts/CoachLayout';
import { VideoAnalysisOverview } from '@/components/video-analysis/VideoAnalysisOverview';

const VideoAnalysisPage = () => {
  return (
    <CoachLayout title="Video Analysis">
      <VideoAnalysisOverview />
    </CoachLayout>
  );
};

export default VideoAnalysisPage;
