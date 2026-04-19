import React from 'react';
import { CoachScopedLayout } from './CoachScopedLayout';
import CoachBracketsPage from '@/pages/Dashboard/CoachBracketsPage';

const CoachBracketsScopedPage: React.FC = () => (
  <CoachScopedLayout title="Κλήρωση">
    <CoachBracketsPage embedded />
  </CoachScopedLayout>
);

export default CoachBracketsScopedPage;
