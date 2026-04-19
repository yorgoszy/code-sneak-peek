import React from 'react';
import { CoachScopedLayout } from './CoachScopedLayout';
import WeighInPage from '@/pages/Dashboard/WeighInPage';

const CoachWeighInScopedPage: React.FC = () => (
  <CoachScopedLayout title="Ζύγιση">
    <WeighInPage embedded />
  </CoachScopedLayout>
);

export default CoachWeighInScopedPage;
