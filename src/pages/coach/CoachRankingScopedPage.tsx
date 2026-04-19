import React from 'react';
import { useParams } from 'react-router-dom';
import { CoachScopedLayout } from './CoachScopedLayout';
import RankingPage from '@/pages/Dashboard/RankingPage';

const CoachRankingScopedPage: React.FC = () => {
  const { coachId } = useParams<{ coachId: string }>();
  return (
    <CoachScopedLayout title="Ranking">
      <RankingPage embedded contextUserId={coachId} />
    </CoachScopedLayout>
  );
};

export default CoachRankingScopedPage;
