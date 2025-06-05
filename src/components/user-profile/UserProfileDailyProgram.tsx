
import React from 'react';
import { EmptyDailyProgram } from './daily-program/EmptyDailyProgram';
import { DailyProgramHeader } from './daily-program/DailyProgramHeader';

interface UserProfileDailyProgramProps {
  user: any;
}

export const UserProfileDailyProgram: React.FC<UserProfileDailyProgramProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <DailyProgramHeader />
      <EmptyDailyProgram />
    </div>
  );
};
