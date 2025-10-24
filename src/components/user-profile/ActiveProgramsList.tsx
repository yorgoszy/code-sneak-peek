import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CreditCard } from "lucide-react";
import { useAllPrograms } from "@/hooks/useAllPrograms";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { ProgramCard } from "@/components/active-programs/ProgramCard";

interface ActiveProgramsListProps {
  userProfile: any;
}

export const ActiveProgramsList: React.FC<ActiveProgramsListProps> = ({ userProfile }) => {
  const { data: allActivePrograms = [], isLoading, error, refetch } = useAllPrograms();
  const { getAllWorkoutCompletions } = useWorkoutCompletionsCache();
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);

  // Filter programs for the specific user
  const userPrograms = allActivePrograms.filter(program => program.user_id === userProfile.id);

  // Fetch all workout completions
  useEffect(() => {
    const loadCompletions = async () => {
      if (userPrograms.length > 0) {
        const allCompletions = await getAllWorkoutCompletions();
        const userAssignmentIds = userPrograms.map(p => p.id);
        const userCompletions = allCompletions.filter(c => userAssignmentIds.includes(c.assignment_id));
        setWorkoutCompletions(userCompletions);
      }
    };
    loadCompletions();
  }, [userPrograms.length, userProfile.id, getAllWorkoutCompletions]);

  // Calculate stats
  const calculateProgramStats = (assignment: any) => {
    const trainingDates = assignment.training_dates || [];
    const assignmentCompletions = workoutCompletions.filter(c => c.assignment_id === assignment.id);
    
    let completed = 0;
    let missed = 0;
    const total = trainingDates.length;
    const today = new Date();
    
    for (const date of trainingDates) {
      const completion = assignmentCompletions.find(c => c.scheduled_date === date);
      
      if (completion?.status === 'completed') {
        completed++;
      } else {
        const workoutDate = new Date(date);
        const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        if (isPast || completion?.status === 'missed') {
          missed++;
        }
      }
    }
    
    const processedWorkouts = completed + missed;
    const progress = total > 0 ? Math.round((processedWorkouts / total) * 100) : 0;
    
    return {
      completed,
      total,
      missed,
      progress
    };
  };

  // Calculate stats for each program
  const programsWithStats = userPrograms.map(assignment => ({
    assignment,
    stats: calculateProgramStats(assignment)
  }));

  // Only active incomplete programs
  const activePrograms = programsWithStats.filter(item => 
    item.assignment.status === 'active' && item.stats.progress < 100
  );

  const handleDelete = async (assignmentId: string) => {
    console.log('Delete not allowed for user profiles');
  };

  if (isLoading) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Ενεργά Προγράμματα
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500 text-sm">
            Φόρτωση...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Ενεργά Προγράμματα
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-500 text-sm">
            Σφάλμα φόρτωσης
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" />
          Ενεργά Προγράμματα ({activePrograms.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activePrograms.length > 0 ? (
          <div className="space-y-3">
            {activePrograms.map((item) => (
              <div key={item.assignment.id} className="flex justify-center">
                <ProgramCard
                  assignment={item.assignment}
                  workoutStats={item.stats}
                  onRefresh={refetch}
                  onDelete={handleDelete}
                  userMode={true}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-none">
            <CreditCard className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Δεν υπάρχουν ενεργά προγράμματα</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
