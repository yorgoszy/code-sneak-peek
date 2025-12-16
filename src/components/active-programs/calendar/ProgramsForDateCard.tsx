
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { ProgramCard } from "../ProgramCard";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";

interface ProgramsForDateCardProps {
  selectedDate: Date | undefined;
  programsForSelectedDate: EnrichedAssignment[];
  onRefresh: () => void;
  onDelete: (assignmentId: string) => void;
}

export const ProgramsForDateCard: React.FC<ProgramsForDateCardProps> = ({
  selectedDate,
  programsForSelectedDate,
  onRefresh,
  onDelete
}) => {
  const { getAllWorkoutCompletions } = useWorkoutCompletionsCache();
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);

  useEffect(() => {
    const loadCompletions = async () => {
      if (programsForSelectedDate.length > 0) {
        const allCompletions = await getAllWorkoutCompletions();
        setWorkoutCompletions(allCompletions);
      }
    };
    loadCompletions();
  }, [programsForSelectedDate, getAllWorkoutCompletions]);

  const calculateProgramStats = (assignment: EnrichedAssignment) => {
    const trainingDates = assignment.training_dates || [];
    const assignmentCompletions = workoutCompletions.filter(c => c.assignment_id === assignment.id);
    
    let completed = 0;
    let missed = 0;
    const total = trainingDates.length;
    const today = new Date();
    
    for (const date of trainingDates) {
      const completion = assignmentCompletions.find(c => c.scheduled_date === date);
      const workoutDate = new Date(date);
      const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      if (completion?.status === 'completed') {
        completed++;
      } else if (isPast || completion?.status === 'missed') {
        missed++;
      }
    }
    
    const rpeScores = assignmentCompletions
      .filter(c => c.status === 'completed' && c.rpe_score)
      .map(c => c.rpe_score as number);
    const averageRpe = rpeScores.length > 0 
      ? rpeScores.reduce((a, b) => a + b, 0) / rpeScores.length 
      : undefined;
    
    return { completed, total, missed, averageRpe };
  };

  if (programsForSelectedDate.length === 0) return null;

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-lg">
          Προγράμματα για {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: el }) : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {programsForSelectedDate.map((assignment) => (
            <ProgramCard
              key={assignment.id}
              assignment={assignment}
              selectedDate={selectedDate}
              onRefresh={onRefresh}
              onDelete={onDelete}
              workoutStats={calculateProgramStats(assignment)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
