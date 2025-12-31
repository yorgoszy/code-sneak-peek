import React from 'react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, CheckCircle, Clock, Menu, LogOut } from "lucide-react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ProgramCard } from "@/components/active-programs/ProgramCard";
import { supabase } from "@/integrations/supabase/client";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { useRealtimePrograms } from "@/hooks/useRealtimePrograms";
import { CoachSidebar } from "@/components/CoachSidebar";
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
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

const CoachProgramCardsPage = () => {
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const { userProfile, loading: rolesLoading, isAdmin } = useRoleCheck();
  const [searchParams] = useSearchParams();
  const coachIdFromUrl = searchParams.get('coachId');
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Για admin απαιτείται coachId στο URL
  // Για coach χρησιμοποιεί το δικό του ID  
  const effectiveCoachId = (isAdmin() && coachIdFromUrl) 
    ? coachIdFromUrl 
    : (!isAdmin() ? userProfile?.id : null);

  const [activePrograms, setActivePrograms] = React.useState<EnrichedAssignment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const completionsCache = useWorkoutCompletionsCache();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = React.useState(false);
  const [workoutCompletions, setWorkoutCompletions] = React.useState<any[]>([]);
  const [realtimeKey, setRealtimeKey] = React.useState(0);
  const [deleteDialog, setDeleteDialog] = React.useState<{open: boolean, assignmentId: string | null}>({
    open: false,
    assignmentId: null
  });

  // Fetch coach's program assignments
  const fetchCoachPrograms = React.useCallback(async () => {
    // Αν είμαστε admin χωρίς coachId, πάμε στο admin view
    if (isAdmin() && !coachIdFromUrl) {
      toast.info('Επιλέξτε coach (coachId) για να δείτε coach program cards');
      navigate('/dashboard/program-cards');
      return;
    }

    setIsLoading(true);
    try {
      if (!effectiveCoachId) {
        setActivePrograms([]);
        return;
      }

      // Τραβάμε program_assignments με app_users (όχι coach_users)
        const { data: assignments, error: assignError } = await supabase
          .from('program_assignments')
          .select(`
            *,
            programs!fk_program_assignments_program_id (
              *,
              program_weeks (
                *,
                program_days (
                  *,
                  program_blocks (
                    *,
                    program_exercises (
                      *,
                      exercises (*)
                    )
                  )
                )
              )
            ),
            app_users!fk_program_assignments_user_id (*)
          `)
          .eq('coach_id', effectiveCoachId)
          .in('status', ['active', 'completed']);

      if (assignError) throw assignError;

      console.log('✅ Coach program cards loaded:', (assignments || []).length);
      setActivePrograms((assignments || []) as unknown as EnrichedAssignment[]);
    } catch (error: any) {
      console.error('Error fetching coach programs:', error);
      const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      toast.error(`Σφάλμα φόρτωσης προγραμμάτων coach: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveCoachId]);

  React.useEffect(() => {
    fetchCoachPrograms();
  }, [fetchCoachPrograms]);

  // Fetch workout completions
  React.useEffect(() => {
    const loadCompletions = async () => {
      if (activePrograms.length > 0) {
        const allCompletions = await completionsCache.getAllWorkoutCompletions();
        setWorkoutCompletions(allCompletions);
      }
    };
    loadCompletions();
  }, [activePrograms, completionsCache, realtimeKey]);

  const calculateProgramStats = (assignment: any) => {
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
    
    const processedWorkouts = completed + missed;
    const progress = total > 0 ? Math.round((processedWorkouts / total) * 100) : 0;
    
    return { completed, total, missed, progress, averageRpe };
  };

  const handleDeleteProgram = async (assignmentId: string) => {
    setDeleteDialog({ open: true, assignmentId });
  };

  const handleForceComplete = async (assignmentId: string) => {
    try {
      const assignment = activePrograms.find(a => a.id === assignmentId);
      if (!assignment) return;

      const trainingDates = assignment.training_dates || [];
      
      const { data: existingCompletions } = await supabase
        .from('workout_completions')
        .select('scheduled_date')
        .eq('assignment_id', assignmentId);
      
      const existingDates = new Set(existingCompletions?.map(c => c.scheduled_date) || []);
      const missedDates = trainingDates.filter(date => !existingDates.has(date));
      
      const programId = assignment.program_id;
      const daysPerWeek = assignment.programs?.program_weeks?.[0]?.program_days?.length || 1;
      
      if (missedDates.length > 0) {
        const missedCompletions = missedDates.map((date, idx) => {
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

        await supabase.from('workout_completions').insert(missedCompletions);
      }

      await supabase
        .from('program_assignments')
        .update({ status: 'completed' })
        .eq('id', assignmentId);

      completionsCache.clearCache();
      setRealtimeKey(prev => prev + 1);
      fetchCoachPrograms();
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
      const { data: completions } = await supabase
        .from('workout_completions')
        .select('id')
        .eq('assignment_id', assignmentId);

      const completionIds = completions?.map(c => c.id) || [];

      if (completionIds.length > 0) {
        await supabase.from('exercise_results').delete().in('workout_completion_id', completionIds);
      }

      await supabase.from('workout_completions').delete().eq('assignment_id', assignmentId);
      await supabase.from('program_assignments').delete().eq('id', assignmentId);

      fetchCoachPrograms();
    } catch (error) {
      console.error('❌ Σφάλμα κατά τη διαγραφή:', error);
      alert('Σφάλμα κατά τη διαγραφή του προγράμματος');
    }
  };

  useRealtimePrograms({
    onProgramsChange: () => {
      completionsCache.clearCache();
      setRealtimeKey(prev => prev + 1);
      fetchCoachPrograms();
    },
    onAssignmentsChange: async () => {
      completionsCache.clearCache();
      setRealtimeKey(prev => prev + 1);
      fetchCoachPrograms();
    }
  });

  const programsWithStats = activePrograms.map(assignment => ({
    assignment,
    stats: calculateProgramStats(assignment)
  }));

  const activeIncompletePrograms = programsWithStats.filter(item => 
    item.assignment.status === 'active' && item.stats.progress < 100
  );
  const completedPrograms = programsWithStats.filter(item => 
    item.assignment.status === 'completed' || item.stats.progress >= 100
  );

  if (authLoading || rolesLoading) {
    return <CustomLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
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
          <CoachSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} contextCoachId={effectiveCoachId || undefined} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div>Φόρτωση προγραμμάτων...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <CoachSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} contextCoachId={effectiveCoachId || undefined} />
      </div>

      {/* Mobile/Tablet Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-lg">
            <CoachSidebar isCollapsed={false} setIsCollapsed={() => {}} contextCoachId={effectiveCoachId || undefined} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile/Tablet Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileSidebar(true)}
              className="rounded-none flex items-center gap-2"
            >
              <Menu className="h-5 w-5" />
              <span className="text-sm font-medium">Μενού</span>
            </Button>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {userProfile && (
                <span className="text-xs sm:text-sm text-gray-600 max-w-[120px] sm:max-w-none truncate">
                  {userProfile.name || 'Coach'}
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
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold flex items-center gap-1 sm:gap-2">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-[#00ffba]" />
                  <span>Program Cards</span>
                </h1>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Active Programs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span>Ενεργά Προγράμματα</span>
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
                          onRefresh={fetchCoachPrograms}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-white border border-gray-200 rounded-none">
                    Δεν υπάρχουν ενεργά προγράμματα
                  </div>
                )}
              </div>

              {/* Completed Programs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    <span>Ολοκληρωμένα</span>
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
                          onRefresh={fetchCoachPrograms}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-white border border-gray-200 rounded-none">
                    Δεν υπάρχουν ολοκληρωμένα προγράμματα
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Αυτή η ενέργεια θα διαγράψει οριστικά το πρόγραμμα και όλα τα σχετικά δεδομένα.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-none">
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CoachProgramCardsPage;