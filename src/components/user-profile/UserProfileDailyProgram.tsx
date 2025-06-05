
import React from 'react';
import { useTodaysPrograms } from './daily-program/useTodaysPrograms';
import { DailyProgramHeader } from './daily-program/DailyProgramHeader';
import { EmptyDailyProgram } from './daily-program/EmptyDailyProgram';
import { ProgramCard } from './daily-program/ProgramCard';

interface UserProfileDailyProgramProps {
  user: any;
}

export const UserProfileDailyProgram: React.FC<UserProfileDailyProgramProps> = ({ user }) => {
  const { todaysPrograms, loading } = useTodaysPrograms(user.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Φόρτωση προγράμματος ημέρας...</div>
      </div>
    );
  }

  if (todaysPrograms.length === 0) {
    return <EmptyDailyProgram />;
  }

  return (
    <div className="space-y-6">
      <DailyProgramHeader />
      
      {todaysPrograms.map((assignment) => (
        <ProgramCard key={assignment.id} assignment={assignment} />
      ))}
    </div>
  );
};
