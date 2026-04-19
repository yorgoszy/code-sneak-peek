import React from 'react';
import { CoachScopedLayout } from './CoachScopedLayout';
import CoachLivePage from '@/pages/Dashboard/CoachLivePage';

const CoachLiveScopedPage: React.FC = () => (
  <CoachScopedLayout title="Live">
    <CoachLivePage embedded />
  </CoachScopedLayout>
);

export default CoachLiveScopedPage;
