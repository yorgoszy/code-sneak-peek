
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { ProgramCardUserInfo } from './ProgramCardUserInfo';
import { ProgramCardProgress } from './ProgramCardProgress';
import { ProgramCardActions } from './ProgramCardActions';

interface ProgramCardProps {
  assignment: EnrichedAssignment;
  selectedDate?: Date;
  onRefresh?: () => void;
  onDelete?: (assignmentId: string) => void;
  userMode?: boolean;
  workoutStats?: {
    completed: number;
    total: number;
    missed: number;
  };
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ 
  assignment, 
  selectedDate,
  onRefresh,
  onDelete,
  userMode = false,
  workoutStats
}) => {
  // Use passed workoutStats or provide defaults
  const stats = workoutStats || {
    completed: 0,
    total: assignment.training_dates?.length || 0,
    missed: 0
  };

  return (
    <Card className="rounded-none hover:shadow-md transition-shadow w-full max-w-[450px] h-auto min-h-[48px]">
      <CardContent className="p-2 md:p-3 h-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 h-full">
          {/* User Info - Takes full width on mobile */}
          <div className="flex-shrink-0">
            <ProgramCardUserInfo assignment={assignment} />
          </div>
          
          {/* Progress - Stacks below on mobile, beside on desktop */}
          <div className="flex-1 min-w-0">
            <ProgramCardProgress assignment={assignment} workoutStats={stats} />
          </div>
          
          {/* Actions - Full width on mobile */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <ProgramCardActions 
              assignment={assignment} 
              selectedDate={selectedDate}
              onRefresh={onRefresh} 
              onDelete={onDelete}
              userMode={userMode}
              workoutStats={stats}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
