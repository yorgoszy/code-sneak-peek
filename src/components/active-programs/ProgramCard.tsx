
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

  // Υπολογίζουμε τα stats από το cache (θα είναι διαθέσιμα από το useActivePrograms)
  const workoutStats = React.useMemo(async () => {
    const completions = await getWorkoutCompletions(assignment.id);
    return calculateWorkoutStats(completions, assignment.training_dates || []);
  }, [assignment.id, assignment.training_dates, getWorkoutCompletions, calculateWorkoutStats]);

  // Προσωρινή λύση για sync stats
  const [stats, setStats] = React.useState({
    completed: 0,
    total: assignment.training_dates?.length || 0,
    missed: 0
  });

  React.useEffect(() => {
    const loadStats = async () => {
      const result = await workoutStats;
      setStats({
        completed: result.completed,
        total: result.total,
        missed: result.missed
      });
    };
    loadStats();
  }, [workoutStats]);

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
