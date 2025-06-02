
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

  return (
    <div
      onClick={onClick}
      className={`
        text-xs p-1 rounded-none cursor-pointer hover:bg-gray-50 border-l-2
        ${getStatusColor(workoutStatus)}
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="font-medium text-gray-900 truncate flex-1">
          {program.programs?.name || 'Άγνωστο'}
        </div>
        <Badge 
          variant={getBadgeVariant(workoutStatus)} 
          className="rounded-none text-xs px-1 py-0 ml-1"
        >
          {workoutStatus === 'completed' ? 'Ε' : 
           workoutStatus === 'missed' ? 'Χ' : 
           workoutStatus === 'makeup' ? 'Α' : 'Π'}
        </Badge>
      </div>
      
      <div className="text-xs text-gray-600 mb-1">
        {program.app_users?.name?.split(' ')[0] || 'Άγνωστος'}
      </div>

      {/* Progress Bar με ποσοστό */}
      <div className="flex items-center gap-1">
        <div className="flex-1">
          <Progress value={progressPercentage} className="h-1" />
        </div>
        <div className="text-xs text-gray-600 font-medium min-w-8">
          {progressPercentage}%
        </div>
      </div>
    </div>
  );
};
