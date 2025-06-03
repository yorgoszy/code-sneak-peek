
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { ProgramCardUserInfo } from './ProgramCardUserInfo';
import { ProgramCardProgress } from './ProgramCardProgress';
import { ProgramCardActions } from './ProgramCardActions';

interface ProgramCardProps {
  assignment: EnrichedAssignment;
  onRefresh?: () => void;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ assignment, onRefresh }) => {
  const [workoutStats, setWorkoutStats] = useState({
    completed: 0,
    total: 0,
    missed: 0
  });

  const { getWorkoutCompletions } = useWorkoutCompletions();

  useEffect(() => {
    const fetchWorkoutStats = async () => {
      try {
        const completions = await getWorkoutCompletions(assignment.id);
        const totalWorkouts = assignment.training_dates?.length || 0;
        
        // Μοναδικές ημερομηνίες που έχουν ολοκληρωθεί
        const uniqueCompletedDates = new Set();
        completions.forEach(c => {
          if (c.status === 'completed' && assignment.training_dates?.includes(c.scheduled_date)) {
            uniqueCompletedDates.add(c.scheduled_date);
          }
        });
        
        const completedWorkouts = uniqueCompletedDates.size;
        const missedWorkouts = completions.filter(c => c.status === 'missed').length;
        
        setWorkoutStats({
          completed: completedWorkouts,
          total: totalWorkouts,
          missed: missedWorkouts
        });
      } catch (error) {
        console.error('Error fetching workout stats:', error);
      }
    };

    fetchWorkoutStats();
  }, [assignment.id, getWorkoutCompletions]);

  return (
    <Card className="rounded-none hover:shadow-md transition-shadow h-12 w-[450px]">
      <CardContent className="p-1.5 h-full">
        <div className="flex items-center justify-between h-full">
          <ProgramCardUserInfo assignment={assignment} />
          <ProgramCardProgress assignment={assignment} workoutStats={workoutStats} />
          <ProgramCardActions assignment={assignment} onRefresh={onRefresh} />
        </div>
      </CardContent>
    </Card>
  );
};
