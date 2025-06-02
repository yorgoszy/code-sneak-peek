
import React from 'react';
import { Badge } from '@/components/ui/badge';
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

  const trainerName = program.app_users?.name?.split(' ')[0] || 'Άγνωστος';

  return (
    <div
      onClick={onClick}
      className={`
        text-xs p-1 rounded-none cursor-pointer hover:bg-gray-50 border-l-2
        ${getStatusColor(workoutStatus)}
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-800 truncate">
          {trainerName}
        </span>
        <Badge 
          variant={getBadgeVariant(workoutStatus)} 
          className="rounded-none text-xs px-1 py-0"
        >
          {workoutStatus === 'completed' ? 'Ε' : 
           workoutStatus === 'missed' ? 'Χ' : 
           workoutStatus === 'makeup' ? 'Α' : 'Π'}
        </Badge>
      </div>
    </div>
  );
};
