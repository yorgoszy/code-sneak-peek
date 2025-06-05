
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
    <Card className="rounded-none hover:shadow-md transition-shadow h-12 w-[450px]">
      <CardContent className="p-1.5 h-full">
        <div className="flex items-center justify-between h-full">
          <ProgramCardUserInfo assignment={assignment} />
          <ProgramCardProgress assignment={assignment} workoutStats={stats} />
          <ProgramCardActions 
            assignment={assignment} 
            selectedDate={selectedDate}
            onRefresh={onRefresh} 
            onDelete={onDelete}
            userMode={userMode}
          />
        </div>
      </CardContent>
    </Card>
  );
};
