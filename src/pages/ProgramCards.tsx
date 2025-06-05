
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
  const { calculateWorkoutStats, getWorkoutCompletions } = useWorkoutCompletionsCache();

  const [programsWithStats, setProgramsWithStats] = React.useState<any[]>([]);

  React.useEffect(() => {
    const loadProgramsWithStats = async () => {
      const programsWithStatsData = await Promise.all(
        activePrograms.map(async (assignment) => {
          const completions = await getWorkoutCompletions(assignment.id);
          const stats = calculateWorkoutStats(completions, assignment.training_dates || []);
          return {
            ...assignment,
            stats
          };
        })
      );
      setProgramsWithStats(programsWithStatsData);
    };

    if (activePrograms.length > 0) {
      loadProgramsWithStats();
    }
  }, [activePrograms, getWorkoutCompletions, calculateWorkoutStats]);

  const handleDeleteProgram = async (assignmentId: string) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα;')) {
      return;
    }

    try {
      console.log('🗑️ Διαγραφή assignment:', assignmentId);
      
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

  // Διαχωρισμός προγραμμάτων σε ενεργά και ολοκληρωμένα
  const activeIncompletePrograms = programsWithStats.filter(program => program.stats.progress < 100);
  const completedPrograms = programsWithStats.filter(program => program.stats.progress >= 100);

  if (isLoading) {
    return (
      <div className="min-h-screen flex w-full">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div>Φόρτωση προγραμμάτων...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex w-full">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-600">Σφάλμα κατά τη φόρτωση: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar />
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
                  {activeIncompletePrograms.map((assignment) => (
                    <div key={assignment.id} className="flex justify-center">
                      <ProgramCard
                        assignment={assignment}
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
                  {completedPrograms.map((assignment) => (
                    <div key={assignment.id} className="flex justify-center">
                      <ProgramCard
                        assignment={assignment}
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
    </div>
  );
};

export default ProgramCards;
