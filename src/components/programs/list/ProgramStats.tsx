
import React from 'react';
import { Program } from '../types';

interface ProgramStatsProps {
  program: Program;
}

export const ProgramStats: React.FC<ProgramStatsProps> = ({ program }) => {
  const weeksCount = program.program_weeks?.length || 0;
  const avgDaysPerWeek = weeksCount > 0 
    ? Math.round((program.program_weeks?.reduce((total, week) => total + (week.program_days?.length || 0), 0) || 0) / weeksCount)
    : 0;

  return (
    <div className="text-xs text-gray-500 mt-1">
      {weeksCount} εβδομάδες • {avgDaysPerWeek} ημέρες/εβδομάδα
    </div>
  );
};
