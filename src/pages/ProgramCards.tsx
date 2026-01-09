
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, CheckCircle, Clock, Menu, LogOut } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { ProgramCard } from "@/components/active-programs/ProgramCard";
import { supabase } from "@/integrations/supabase/client";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { useRealtimePrograms } from "@/hooks/useRealtimePrograms";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const ProgramCards = () => {
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const { data: activePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const completionsCache = useWorkoutCompletionsCache();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = React.useState(false);
  const [hasCheckedRedirect, setHasCheckedRedirect] = React.useState(false);
  const [workoutCompletions, setWorkoutCompletions] = React.useState<any[]>([]);
  const [realtimeKey, setRealtimeKey] = React.useState(0);
  const [deleteDialog, setDeleteDialog] = React.useState<{open: boolean, assignmentId: string | null}>({
    open: false,
    assignmentId: null
  });

  // Authentication and redirect logic
  React.useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!isAuthenticated) {
        setHasCheckedRedirect(true);
        return;
      }
      
      if (userProfile && !isAdmin) {
        navigate(`/user/${userProfile.user_id}`);
        return;
      }
      
      setHasCheckedRedirect(true);
    }
  }, [authLoading, rolesLoading, isAuthenticated, userProfile, isAdmin, navigate]);

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
    
    // Υπολογισμός average RPE
    const rpeScores = assignmentCompletions
      .filter(c => c.status === 'completed' && c.rpe_score)
      .map(c => c.rpe_score as number);
    const averageRpe = rpeScores.length > 0 
      ? rpeScores.reduce((a, b) => a + b, 0) / rpeScores.length 
      : undefined;
    
    // Το progress υπολογίζεται από completed + missed (όλες οι "ολοκληρωμένες" προπονήσεις)
    const processedWorkouts = completed + missed;
    const progress = total > 0 ? Math.round((processedWorkouts / total) * 100) : 0;
    
    return {
      completed,
      total,
      missed,
      progress,
      averageRpe
    };
  };

  const handleDeleteProgram = async (assignmentId: string) => {
    setDeleteDialog({ open: true, assignmentId });
  };

  // Force complete a program - marks future workouts as missed and sets status to completed
  const handleForceComplete = async (assignmentId: string) => {
    try {
      console.log('🏁 Force completing assignment:', assignmentId);
      
      const assignment = activePrograms.find(a => a.id === assignmentId);
      if (!assignment) {
        console.error('Assignment not found');
        return;
      }

      const trainingDates = assignment.training_dates || [];
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Get existing completions for this assignment
      const { data: existingCompletions } = await supabase
        .from('workout_completions')
        .select('scheduled_date')
        .eq('assignment_id', assignmentId);
      
      const existingDates = new Set(existingCompletions?.map(c => c.scheduled_date) || []);
      
      // Find dates that don't have completions yet and mark them as missed
      const missedDates = trainingDates.filter(date => !existingDates.has(date));
      
      // Get program info for required fields
      const programId = assignment.program_id;
      const daysPerWeek = assignment.programs?.program_weeks?.[0]?.program_days?.length || 1;
      
      // Create missed workout completions for remaining dates
      if (missedDates.length > 0) {
        const missedCompletions = missedDates.map((date, idx) => {
          // Calculate week and day number based on position in training dates
          const dateIndex = trainingDates.indexOf(date);
          const weekNumber = Math.floor(dateIndex / daysPerWeek) + 1;
          const dayNumber = (dateIndex % daysPerWeek) + 1;
          
          return {
            assignment_id: assignmentId,
            user_id: assignment.user_id,
            program_id: programId,
            scheduled_date: date,
            status: 'missed',
            completed_at: new Date().toISOString(),
            week_number: weekNumber,
            day_number: dayNumber
          };
        });

        const { error: insertError } = await supabase
          .from('workout_completions')
          .insert(missedCompletions);

        if (insertError) {
          console.error('Error creating missed completions:', insertError);
        } else {
          console.log(`✅ Created ${missedCompletions.length} missed workout completions`);
        }
      }

      // Update assignment status to completed
      const { error: updateError } = await supabase
        .from('program_assignments')
        .update({ status: 'completed' })
        .eq('id', assignmentId);

      if (updateError) {
        console.error('Error updating assignment status:', updateError);
        alert('Σφάλμα κατά την ολοκλήρωση του προγράμματος');
        return;
      }

      console.log('✅ Assignment force completed successfully');
      completionsCache.clearCache();
      setRealtimeKey(prev => prev + 1);
      refetch();
    } catch (error) {
      console.error('Error force completing program:', error);
      alert('Σφάλμα κατά την ολοκλήρωση του προγράμματος');
    }
  };

  const confirmDelete = async () => {
    const assignmentId = deleteDialog.assignmentId;
    if (!assignmentId) return;

    setDeleteDialog({ open: false, assignmentId: null });

    try {
      console.log('🗑️ Διαγραφή assignment:', assignmentId);
      
      // Πρώτα βρίσκουμε όλα τα workout_completion IDs για αυτό το assignment
      const { data: completions } = await supabase
        .from('workout_completions')
        .select('id')
        .eq('assignment_id', assignmentId);

      const completionIds = completions?.map(c => c.id) || [];
      console.log('📋 Workout completions to delete:', completionIds.length);

      // Διαγραφή exercise results για αυτά τα completions
      if (completionIds.length > 0) {
        const { error: exerciseResultsError } = await supabase
          .from('exercise_results')
          .delete()
          .in('workout_completion_id', completionIds);

        if (exerciseResultsError) {
          console.error('❌ Σφάλμα κατά τη διαγραφή exercise results:', exerciseResultsError);
        }
      }

      // Διαγραφή workout completions
      const { error: completionsError } = await supabase
        .from('workout_completions')
        .delete()
        .eq('assignment_id', assignmentId);

      if (completionsError) {
        console.error('❌ Σφάλμα κατά τη διαγραφή workout completions:', completionsError);
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

  // Admin βλέπει μόνο assignments χρηστών που δημιουργήθηκαν από admin (coach_id = admin ID)
  const ADMIN_ID = 'c6d44641-3b95-46bd-8270-e5ed72de25ad';
  const adminPrograms = activePrograms.filter(p => p.app_users?.coach_id === ADMIN_ID);

  // Calculate stats for each program
  const programsWithStats = adminPrograms.map(assignment => ({
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

  // Handle loading states
  if (authLoading || rolesLoading) {
    return <CustomLoadingScreen />;
  }

  // Handle redirection
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasCheckedRedirect) {
    return <CustomLoadingScreen />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex w-full">
        <div className="hidden lg:block">
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div>Φόρτωση προγραμμάτων...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex w-full">
        <div className="hidden lg:block">
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-600">Σφάλμα κατά τη φόρτωση: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile/Tablet Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-lg">
            <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile/Tablet Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            {/* Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileSidebar(true)}
              className="rounded-none flex items-center gap-2"
            >
              <Menu className="h-5 w-5" />
              <span className="text-sm font-medium">Μενού</span>
            </Button>
            
            {/* User Info & Logout */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {userProfile && (
                <span className="text-xs sm:text-sm text-gray-600 max-w-[120px] sm:max-w-none truncate">
                  {userProfile.display_name || 'Διαχειριστής'}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="rounded-none flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Έξοδος</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 md:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="rounded-none"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Επιστροφή</span>
                </Button>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold flex items-center gap-1 sm:gap-2">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-[#00ffba]" />
                  <span className="hidden xs:inline">Program Cards</span>
                  <span className="xs:hidden text-sm">Cards</span>
                </h1>
              </div>
            </div>

            {/* Content Grid - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Ενεργά Προγράμματα */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span className="hidden sm:inline">Ενεργά Προγράμματα</span>
                    <span className="sm:hidden">Ενεργά</span>
                  </h2>
                  <div className="text-xs sm:text-sm text-gray-500">
                    {activeIncompletePrograms.length} προγράμματα
                  </div>
                </div>

                {activeIncompletePrograms.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {activeIncompletePrograms.map((item) => (
                      <div key={item.assignment.id} className="flex justify-center">
                        <ProgramCard
                          assignment={item.assignment}
                          workoutStats={item.stats}
                          onRefresh={refetch}
                          onDelete={handleDeleteProgram}
                          onForceComplete={handleForceComplete}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-none">
                    <Clock className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm sm:text-lg mb-2">Δεν υπάρχουν ενεργά προγράμματα</p>
                    <p className="text-xs sm:text-sm">Δημιουργήστε νέες αναθέσεις από το ProgramBuilder</p>
                  </div>
                )}
              </div>

              {/* Ολοκληρωμένα Προγράμματα */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#00ffba]" />
                    <span className="hidden sm:inline">Ολοκληρωμένα Προγράμματα</span>
                    <span className="sm:hidden">Ολοκλήρωμένα</span>
                  </h2>
                  <div className="text-xs sm:text-sm text-gray-500">
                    {completedPrograms.length} προγράμματα
                  </div>
                </div>

                {completedPrograms.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
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
                  <div className="text-center py-8 sm:py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-none">
                    <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm sm:text-lg mb-2">Δεν υπάρχουν ολοκληρωμένα προγράμματα</p>
                    <p className="text-xs sm:text-sm">Τα προγράμματα με 100% πρόοδο θα εμφανίζονται εδώ</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, assignmentId: null })}>
        <AlertDialogContent className="rounded-none max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">Επιβεβαίωση Διαγραφής</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα;
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, assignmentId: null })}
              className="rounded-none px-6 sm:px-8 w-full sm:w-auto"
            >
              Ακύρωση
            </Button>
            <Button 
              onClick={confirmDelete}
              className="rounded-none px-6 sm:px-8 w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
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
