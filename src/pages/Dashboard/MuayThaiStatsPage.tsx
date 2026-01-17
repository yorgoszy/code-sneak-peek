import React from 'react';
import { CoachLayout } from '@/components/layouts/CoachLayout';
import { MuayThaiStatsOverview } from '@/components/muaythai-stats/MuayThaiStatsOverview';

const MuayThaiStatsPage = () => {
  return (
    <CoachLayout title="Video Analysis">
      <MuayThaiStatsOverview />
    </CoachLayout>
  );
};

export default MuayThaiStatsPage;
