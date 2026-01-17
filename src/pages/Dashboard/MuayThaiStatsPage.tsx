import React from 'react';
import { CoachLayout } from '@/components/layouts/CoachLayout';
import { MuayThaiStatsOverview } from '@/components/muaythai-stats/MuayThaiStatsOverview';

const MuayThaiStatsPage = () => {
  return (
    <CoachLayout title="Στατιστικά Muay Thai">
      <MuayThaiStatsOverview />
    </CoachLayout>
  );
};

export default MuayThaiStatsPage;
