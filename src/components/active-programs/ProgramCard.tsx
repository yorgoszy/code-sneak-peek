
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
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
    <Card className="rounded-none hover:shadow-md transition-shadow h-10 md:h-12 w-full max-w-[450px] md:w-[450px]">
      <CardContent className="p-1 md:p-1.5 h-full">
        <div className="flex items-center justify-between h-full gap-1 md:gap-0">
          <ProgramCardProgress assignment={assignment} workoutStats={stats} />
          <ProgramCardActions 
            assignment={assignment} 
            selectedDate={selectedDate}
            onRefresh={onRefresh} 
            onDelete={onDelete}
            userMode={userMode}
            workoutStats={stats}
          />
        </div>
      </CardContent>
    </Card>
  );
};
