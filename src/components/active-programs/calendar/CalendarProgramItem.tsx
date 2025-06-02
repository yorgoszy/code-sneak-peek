
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface CalendarProgramItemProps {
  program: EnrichedAssignment;
  workoutStatus: string;
  allCompletions: any[];
  onClick: () => void;
}

export const CalendarProgramItem: React.FC<CalendarProgramItemProps> = ({
  program,
  workoutStatus,
  allCompletions,
  onClick
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-l-[#5bb659]';
      case 'missed': return 'border-l-red-500';
      case 'makeup': return 'border-l-yellow-500';
      default: return 'border-l-[#597cb6]';
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'missed': return 'destructive';
      case 'makeup': return 'secondary';
      default: return 'outline';
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-[#5bb659]';
      case 'missed': return 'bg-red-500';
      case 'makeup': return 'bg-yellow-500';
      default: return 'bg-[#597cb6]';
    }
  };

  // Calculate real-time progress from completions
  const calculateProgress = () => {
    if (!program.training_dates || program.training_dates.length === 0) {
      return 0;
    }

    const programCompletions = allCompletions.filter(c => 
      c.assignment_id === program.id && c.status === 'completed'
    );
    
    const completedWorkouts = programCompletions.length;
    const totalWorkouts = program.training_dates.length;
    
    return Math.round((completedWorkouts / totalWorkouts) * 100);
  };

  const progressPercentage = calculateProgress();
  const trainerName = program.app_users?.name?.split(' ')[0] || 'Άγνωστος';

  return (
    <div
      onClick={onClick}
      className={`
        text-xs p-1 rounded-none cursor-pointer hover:bg-gray-50 border-l-2
        ${getStatusColor(workoutStatus)}
      `}
    >
      <div className="flex items-center justify-end mb-1">
        <Badge 
          variant={getBadgeVariant(workoutStatus)} 
          className="rounded-none text-xs px-1 py-0"
        >
          {workoutStatus === 'completed' ? 'Ε' : 
           workoutStatus === 'missed' ? 'Χ' : 
           workoutStatus === 'makeup' ? 'Α' : 'Π'}
        </Badge>
      </div>

      {/* Progress Bar με το όνομα μέσα και δυναμικό χρώμα */}
      <div className="relative">
        <div className="h-4 w-full overflow-hidden rounded-none bg-gray-200">
          <div 
            className={`h-full transition-all ${getProgressBarColor(workoutStatus)}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-800 truncate px-1">
            {trainerName}
          </span>
        </div>
      </div>
    </div>
  );
};
