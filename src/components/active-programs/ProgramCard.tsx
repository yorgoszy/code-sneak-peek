import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { ProgramCardUserInfo } from './ProgramCardUserInfo';
import { ProgramCardProgress } from './ProgramCardProgress';
import { ProgramCardActions } from './ProgramCardActions';

interface ProgramCardProps {
  assignment: EnrichedAssignment;
  onRefresh?: () => void;
  selectedDate?: Date;
  onDelete?: (assignmentId: string) => void;
  userMode?: boolean;
  workoutStats?: {
    completed: number;
    total: number;
    missed: number;
    progress?: number;
  };
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ 
  assignment, 
  onRefresh,
  selectedDate,
  onDelete,
  userMode = false,
  workoutStats: passedWorkoutStats
}) => {
  const { calculateWorkoutStats, getWorkoutCompletions } = useWorkoutCompletionsCache();

  const [stats, setStats] = React.useState({
    completed: 0,
    total: assignment.training_dates?.length || 0,
    missed: 0
  });

  React.useEffect(() => {
    // If workoutStats are passed from parent, use those instead of fetching
    if (passedWorkoutStats) {
      setStats({
        completed: passedWorkoutStats.completed,
        total: passedWorkoutStats.total,
        missed: passedWorkoutStats.missed
      });
      return;
    }

    // Otherwise fetch the stats
    const loadStats = async () => {
      try {
        const completions = await getWorkoutCompletions(assignment.id);
        const workoutStats = calculateWorkoutStats(completions, assignment.training_dates || []);
        setStats({
          completed: workoutStats.completed,
          total: workoutStats.total,
          missed: workoutStats.missed
        });
      } catch (error) {
        console.error('Error loading workout stats:', error);
      }
    };

    loadStats();
  }, [assignment.id, assignment.training_dates, getWorkoutCompletions, calculateWorkoutStats, passedWorkoutStats]);

  return (
    <Card className="rounded-none hover:shadow-md transition-shadow h-12 w-[450px]">
      <CardContent className="p-1.5 h-full">
        <div className="flex items-center justify-between h-full">
          <ProgramCardUserInfo assignment={assignment} />
          <ProgramCardProgress assignment={assignment} workoutStats={stats} />
          <ProgramCardActions 
            assignment={assignment} 
            onRefresh={onRefresh}
            selectedDate={selectedDate}
            onDelete={onDelete}
            userMode={userMode}
          />
        </div>
      </CardContent>
    </Card>
  );
};
