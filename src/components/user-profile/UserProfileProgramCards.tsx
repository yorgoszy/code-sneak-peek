
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAllPrograms } from "@/hooks/useAllPrograms";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { ProgramCard } from "@/components/active-programs/ProgramCard";

interface UserProfileProgramCardsProps {
  userProfile: any;
}

export const UserProfileProgramCards: React.FC<UserProfileProgramCardsProps> = ({ userProfile }) => {
  const { data: allActivePrograms = [], isLoading, error, refetch } = useAllPrograms();
  const { getAllWorkoutCompletions } = useWorkoutCompletionsCache();
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);

  // Filter programs for the specific user
  const userPrograms = allActivePrograms.filter(program => program.user_id === userProfile.id);

  // Fetch all workout completions - same as calendar and ProgramCards
  useEffect(() => {
    const loadCompletions = async () => {
      if (userPrograms.length > 0) {
        const allCompletions = await getAllWorkoutCompletions();
        // Filter completions for this user's assignments
        const userAssignmentIds = userPrograms.map(p => p.id);
        const userCompletions = allCompletions.filter(c => userAssignmentIds.includes(c.assignment_id));
        setWorkoutCompletions(userCompletions);
      }
    };
    loadCompletions();
  }, [userPrograms.length, userProfile.id, getAllWorkoutCompletions]);

  // Calculate stats the same way as calendar and ProgramCards
  const calculateProgramStats = (assignment: any) => {
    const trainingDates = assignment.training_dates || [];
    const assignmentCompletions = workoutCompletions.filter(c => c.assignment_id === assignment.id);
    
    let completed = 0;
    let missed = 0;
    const total = trainingDates.length;
    const today = new Date();
    
    // Για κάθε training date, έλεγξε το status
    for (const date of trainingDates) {
      const completion = assignmentCompletions.find(c => c.scheduled_date === date);
      
      if (completion?.status === 'completed') {
        completed++;
      } else {
        // Έλεγχος αν έχει περάσει η ημερομηνία
        const workoutDate = new Date(date);
        const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        if (isPast || completion?.status === 'missed') {
          missed++;
        }
      }
    }
    
    // Το progress υπολογίζεται από completed + missed (όλες οι "ολοκληρωμένες" προπονήσεις)
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

  // Διαχωρισμός προγραμμάτων σε ενεργά και ολοκληρωμένα βάσει status και progress
  const activeIncompletePrograms = programsWithStats.filter(item => 
    item.assignment.status === 'active' && item.stats?.progress < 100
  );
  const completedPrograms = programsWithStats.filter(item => 
    item.assignment.status === 'completed' || item.stats?.progress >= 100
  );

  const handleDelete = async (assignmentId: string) => {
    // Regular users typically cannot delete programs
    console.log('Delete not allowed for user profiles');
  };

  if (isLoading) {
    return (
      <Card className="rounded-none">
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Φόρτωση προγραμμάτων...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-none">
        <CardContent>
          <div className="text-center py-8 text-red-500">
            Σφάλμα κατά τη φόρτωση των προγραμμάτων
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userPrograms.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Δεν έχετε ενεργά προγράμματα</p>
            <p className="text-sm">Επικοινωνήστε με τον προπονητή σας για ανάθεση προγράμματος</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="active" className="rounded-none flex items-center gap-2 text-sm">
              <Clock className="h-3 w-3" />
              Ενεργά ({activeIncompletePrograms.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-none flex items-center gap-2 text-sm">
              <CheckCircle className="h-3 w-3" />
              Ολοκληρωμένα ({completedPrograms.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {activeIncompletePrograms.length > 0 ? (
              <div className="space-y-4">
                {activeIncompletePrograms.map((item) => (
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
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-none">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Δεν υπάρχουν ενεργά προγράμματα</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completedPrograms.length > 0 ? (
              <div className="space-y-4">
                {completedPrograms.map((item) => (
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
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-none">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Δεν υπάρχουν ολοκληρωμένα προγράμματα</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
