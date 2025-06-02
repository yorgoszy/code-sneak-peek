
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface CalendarProgramItemProps {
  program: EnrichedAssignment;
  workoutStatus: string;
  onClick: () => void;
}

export const CalendarProgramItem: React.FC<CalendarProgramItemProps> = ({
  program,
  workoutStatus,
  onClick
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'missed': return 'bg-red-500';
      case 'makeup': return 'bg-yellow-500';
      default: return 'bg-blue-500';
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

  // Υπολογισμός progress από τα existing data
  const progressPercentage = program.progress || 0;

  return (
    <div
      onClick={onClick}
      className={`
        text-xs p-1 rounded-none cursor-pointer hover:bg-gray-50 border-l-2
        ${getStatusColor(workoutStatus)} border-l-2
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
