
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
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ assignment, onRefresh }) => {
  const { calculateWorkoutStats, getWorkoutCompletions } = useWorkoutCompletionsCache();

  // Fix: Use useState and useEffect instead of async useMemo
  const [stats, setStats] = React.useState({
    completed: 0,
    total: assignment.training_dates?.length || 0,
    missed: 0
  });

  React.useEffect(() => {
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
  }, [assignment.id, assignment.training_dates, getWorkoutCompletions, calculateWorkoutStats]);

  return (
    <Card className="rounded-none hover:shadow-md transition-shadow h-12 w-[450px]">
      <CardContent className="p-1.5 h-full">
        <div className="flex items-center justify-between h-full">
          <ProgramCardUserInfo assignment={assignment} />
          <ProgramCardProgress assignment={assignment} workoutStats={stats} />
          <ProgramCardActions assignment={assignment} onRefresh={onRefresh} />
        </div>
      </CardContent>
    </Card>
  );
};
