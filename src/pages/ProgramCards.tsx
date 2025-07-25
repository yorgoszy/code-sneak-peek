
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { ProgramCard } from "@/components/active-programs/ProgramCard";
import { supabase } from "@/integrations/supabase/client";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { useRealtimePrograms } from "@/hooks/useRealtimePrograms";
import { Sidebar } from "@/components/Sidebar";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const ProgramCards = () => {
  const navigate = useNavigate();
  const { data: activePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const completionsCache = useWorkoutCompletionsCache();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [workoutCompletions, setWorkoutCompletions] = React.useState<any[]>([]);
  const [realtimeKey, setRealtimeKey] = React.useState(0);
  const [deleteDialog, setDeleteDialog] = React.useState<{open: boolean, assignmentId: string | null}>({
    open: false,
    assignmentId: null
  });

  // Fetch all workout completions - same as calendar
  React.useEffect(() => {
    const loadCompletions = async () => {
      if (activePrograms.length > 0) {
        const allCompletions = await completionsCache.getAllWorkoutCompletions();
        setWorkoutCompletions(allCompletions);
      }
    };
    loadCompletions();
  }, [activePrograms, completionsCache, realtimeKey]);

  // Calculate stats the same way as UserProfileProgramCards but with better completion logic
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
      const workoutDate = new Date(date);
      const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      if (completion?.status === 'completed') {
        completed++;
      } else if (isPast || completion?.status === 'missed') {
        missed++;
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

  const handleDeleteProgram = async (assignmentId: string) => {
    setDeleteDialog({ open: true, assignmentId });
  };

  const confirmDelete = async () => {
    const assignmentId = deleteDialog.assignmentId;
    if (!assignmentId) return;

    setDeleteDialog({ open: false, assignmentId: null });

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

  // Realtime subscriptions for immediate updates
  useRealtimePrograms({
    onProgramsChange: () => {
      console.log('📡 ProgramCards: Programs changed - refetching...');
      completionsCache.clearCache();
      setRealtimeKey(prev => prev + 1);
      refetch();
    },
    onAssignmentsChange: async () => {
      console.log('📡 ProgramCards: Assignments changed - refetching...');
      completionsCache.clearCache();
      setRealtimeKey(prev => prev + 1);
      
      // Έλεγχος για αυτόματη ολοκλήρωση προγραμμάτων
      try {
        const { programCompletionService } = await import('@/hooks/useWorkoutCompletions/programCompletionService');
        await programCompletionService.checkAndCompleteProgramAssignments();
      } catch (error) {
        console.error('Error checking program completions:', error);
      }
      
      refetch();
    }
  });

  // Calculate stats for each program
  const programsWithStats = activePrograms.map(assignment => ({
    assignment,
    stats: calculateProgramStats(assignment)
  }));

  // Διαχωρισμός προγραμμάτων σε ενεργά και ολοκληρωμένα βάσει status και progress
  const activeIncompletePrograms = programsWithStats.filter(item => 
    item.assignment.status === 'active' && item.stats.progress < 100
  );
  const completedPrograms = programsWithStats.filter(item => 
    item.assignment.status === 'completed' || item.stats.progress >= 100
  );

  // Debug για να δούμε τι συμβαίνει με το φιλτράρισμα
  console.log('🔍 Program filtering results:', {
    totalPrograms: programsWithStats.length,
    activeIncomplete: activeIncompletePrograms.length,
    completed: completedPrograms.length,
    programsDetails: programsWithStats.map(item => ({
      id: item.assignment.id,
      name: item.assignment.programs?.name,
      status: item.assignment.status,
      progress: item.stats.progress,
      category: item.assignment.status === 'completed' || item.stats.progress >= 100 ? 'completed' : 'active'
    }))
  });

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
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
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
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CreditCard className="h-8 w-8 text-[#00ffba]" />
                Program Cards
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Αριστερή στήλη - Ενεργά Προγράμματα */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
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
                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-none">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">Δεν υπάρχουν ενεργά προγράμματα</p>
                  <p className="text-sm">Δημιουργήστε νέες αναθέσεις από το ProgramBuilder</p>
                </div>
              )}
            </div>

            {/* Δεξιά στήλη - Ολοκληρωμένα Προγράμματα */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#00ffba]" />
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
                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-none">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">Δεν υπάρχουν ολοκληρωμένα προγράμματα</p>
                  <p className="text-sm">Τα προγράμματα με 100% πρόοδο θα εμφανίζονται εδώ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, assignmentId: null })}>
        <AlertDialogContent className="rounded-none max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">Επιβεβαίωση Διαγραφής</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα;
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center gap-4 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, assignmentId: null })}
              className="rounded-none px-8"
            >
              Ακύρωση
            </Button>
            <Button 
              onClick={confirmDelete}
              className="rounded-none px-8 bg-red-600 hover:bg-red-700 text-white"
            >
              Διαγραφή
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProgramCards;
