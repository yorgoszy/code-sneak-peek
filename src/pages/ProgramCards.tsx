
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { ProgramCard } from "@/components/active-programs/ProgramCard";
import { supabase } from "@/integrations/supabase/client";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { Sidebar } from "@/components/Sidebar";

const ProgramCards = () => {
  const navigate = useNavigate();
  const { data: activePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const { getAllWorkoutCompletions } = useWorkoutCompletionsCache();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [workoutCompletions, setWorkoutCompletions] = React.useState<any[]>([]);

  // Fetch all workout completions - same as calendar
  React.useEffect(() => {
    const loadCompletions = async () => {
      if (activePrograms.length > 0) {
        const allCompletions = await getAllWorkoutCompletions();
        setWorkoutCompletions(allCompletions);
      }
    };
    loadCompletions();
  }, [activePrograms, getAllWorkoutCompletions]);

  // Calculate stats the same way as calendar does
  const calculateProgramStats = (assignment: any) => {
    const trainingDates = assignment.training_dates || [];
    const assignmentCompletions = workoutCompletions.filter(c => c.assignment_id === assignment.id);
    
    const completed = assignmentCompletions.filter(c => c.status === 'completed').length;
    const total = trainingDates.length;
    const missed = assignmentCompletions.filter(c => c.status === 'missed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      completed,
      total,
      missed,
      progress
    };
  };

  const handleDeleteProgram = async (assignmentId: string) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα;')) {
      return;
    }

    try {
      console.log('🗑️ Διαγραφή assignment:', assignmentId);
      
      // Διαγραφή workout completions πρώτα
      const { error: completionsError } = await supabase
        .from('workout_completions')
        .delete()
        .eq('assignment_id', assignmentId);

      if (completionsError) {
        console.error('❌ Σφάλμα κατά τη διαγραφή workout completions:', completionsError);
      }

      // Διαγραφή exercise results
      const { error: exerciseResultsError } = await supabase
        .from('exercise_results')
        .delete()
        .eq('workout_completion_id', assignmentId);

      if (exerciseResultsError) {
        console.error('❌ Σφάλμα κατά τη διαγραφή exercise results:', exerciseResultsError);
      }

      // Διαγραφή assignment
      const { error: deleteError } = await supabase
        .from('program_assignments')
        .delete()
        .eq('id', assignmentId);

      if (deleteError) {
        console.error('❌ Σφάλμα κατά τη διαγραφή:', deleteError);
        alert('Σφάλμα κατά τη διαγραφή του προγράμματος');
        return;
      }

      console.log('✅ Assignment διαγράφηκε επιτυχώς');
      refetch();
    } catch (error) {
      console.error('❌ Σφάλμα κατά τη διαγραφή:', error);
      alert('Σφάλμα κατά τη διαγραφή του προγράμματος');
    }
  };

  // Calculate stats for each program
  const programsWithStats = activePrograms.map(assignment => ({
    assignment,
    stats: calculateProgramStats(assignment)
  }));

  // Διαχωρισμός προγραμμάτων σε ενεργά και ολοκληρωμένα
  const activeIncompletePrograms = programsWithStats.filter(item => item.stats.progress < 100);
  const completedPrograms = programsWithStats.filter(item => item.stats.progress >= 100);

  if (isLoading) {
    return (
      <div className="min-h-screen flex w-full">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className="flex-1 flex items-center justify-center">
          <div>Φόρτωση προγραμμάτων...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex w-full">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-600">Σφάλμα κατά τη φόρτωση: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex-1 p-3 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="rounded-none"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Επιστροφή
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <CreditCard className="h-6 md:h-8 w-6 md:w-8 text-[#00ffba]" />
                Program Cards
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {/* Αριστερή στήλη - Ενεργά Προγράμματα */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
                  Ενεργά Προγράμματα
                </h2>
                <div className="text-sm text-gray-500">
                  {activeIncompletePrograms.length} προγράμματα
                </div>
              </div>

              {activeIncompletePrograms.length > 0 ? (
                <div className="space-y-4">
                  {activeIncompletePrograms.map((item) => (
                    <div key={item.assignment.id} className="flex justify-center">
                      <ProgramCard
                        assignment={item.assignment}
                        workoutStats={item.stats}
                        onRefresh={refetch}
                        onDelete={handleDeleteProgram}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-none">
                  <Clock className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-base md:text-lg mb-2">Δεν υπάρχουν ενεργά προγράμματα</p>
                  <p className="text-sm">Δημιουργήστε νέες αναθέσεις από το ProgramBuilder</p>
                </div>
              )}
            </div>

            {/* Δεξιά στήλη - Ολοκληρωμένα Προγράμματα */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="h-4 md:h-5 w-4 md:w-5 text-[#00ffba]" />
                  Ολοκληρωμένα Προγράμματα
                </h2>
                <div className="text-sm text-gray-500">
                  {completedPrograms.length} προγράμματα
                </div>
              </div>

              {completedPrograms.length > 0 ? (
                <div className="space-y-4">
                  {completedPrograms.map((item) => (
                    <div key={item.assignment.id} className="flex justify-center">
                      <ProgramCard
                        assignment={item.assignment}
                        workoutStats={item.stats}
                        onRefresh={refetch}
                        onDelete={handleDeleteProgram}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-none">
                  <CheckCircle className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-base md:text-lg mb-2">Δεν υπάρχουν ολοκληρωμένα προγράμματα</p>
                  <p className="text-sm">Τα προγράμματα με 100% πρόοδο θα εμφανίζονται εδώ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramCards;
