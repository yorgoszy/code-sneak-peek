import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAssignmentOperation, assignedProgramCopy } from '../services/assignmentOperation';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { User, Exercise } from '../../types';
import type { ProgramStructure } from './useProgramBuilderState';
import { coachAssignmentService } from '../services/coachAssignmentService';
import { recalculateWeeksForUser } from '../services/perUserRecalculation';
import { applyUserWarmUps } from '../services/applyUserWarmUps';

interface UseCoachProgramBuilderDialogLogicProps {
  users: User[]; // Αυτοί είναι coach_users
  exercises: Exercise[];
  onCreateProgram: (program: any) => Promise<any>;
  onOpenChange: () => void;
  editingProgram?: any;
  editingAssignment?: any;
  isOpen: boolean;
  program: ProgramStructure;
  updateProgram?: (updates: Partial<ProgramStructure>) => void;
  coachId: string; // ID του coach
}

export const useCoachProgramBuilderDialogLogic = ({
  users,
  exercises,
  onCreateProgram,
  onOpenChange,
  editingProgram,
  editingAssignment,
  isOpen,
  program,
  updateProgram,
  coachId
}: UseCoachProgramBuilderDialogLogicProps) => {
  const navigate = useNavigate();
  const operation = useRef(createAssignmentOperation());
  const savedId = useRef<string | undefined>(program.id);
  const [isAssigning, setIsAssigning] = useState(false);
  // Όλοι οι users είναι coach_users, οπότε δεν χρειάζεται φιλτράρισμα
  const availableUsers = useMemo(() => {
    return users;
  }, [users]);

  const handleClose = () => {
    if (operation.current.busy) return;
    onOpenChange();
  };

  const handleSave = async () => {
    if (!operation.current.acquire()) return;
    try {
      console.log('💾 [Coach handleSave] Starting save...');
      
      if (!program.name?.trim()) {
        toast.error('Το όνομα του προγράμματος είναι υποχρεωτικό');
        return;
      }

      if (program.weeks?.length === 0) {
        toast.error('Προσθέστε τουλάχιστον μία εβδομάδα στο πρόγραμμα');
        return;
      }

      const savedProgram = await onCreateProgram({ ...program, id: program.id || savedId.current, deferBuilderRefresh: true });
      if (savedProgram?.id) savedId.current = savedProgram.id;
      console.log('✅ Program saved:', savedProgram);
      
      if (savedProgram?.id && updateProgram) {
        updateProgram({ id: savedProgram.id });
      }
      
      toast.success('Το πρόγραμμα αποθηκεύτηκε επιτυχώς!');
      
    } catch (error) {
      console.error('❌ Error saving program:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος.');
    } finally {
      operation.current.release();
    }
  };

  const handleAssign = async () => {
    if (!operation.current.acquire()) return;
    setIsAssigning(true);
    try {
      console.log('🎯 [Coach] Starting assignment process:', { 
        program, 
        user_ids: program.user_ids, 
        coachId,
        editingAssignment 
      });

      if (!program.name?.trim()) {
        toast.error('Πρώτα αποθηκεύστε το πρόγραμμα');
        return;
      }

      if (!program.user_ids || program.user_ids.length === 0) {
        toast.error('Παρακαλώ επιλέξτε τουλάχιστον έναν αθλητή');
        return;
      }

      if (!program.training_dates || program.training_dates.length === 0) {
        toast.error('Παρακαλώ επιλέξτε ημερομηνίες προπόνησης');
        return;
      }

      // Save base program first
      let baseProgramId = program.id || savedId.current;
      if (!baseProgramId && program.user_ids.length > 1) {
        console.log('📋 [Coach] Creating base program...');
        const savedProgram = await onCreateProgram({ ...program, deferBuilderRefresh: true });
        if (!savedProgram || !savedProgram.id) {
          throw new Error('Αποτυχία αποθήκευσης προγράμματος');
        }
        baseProgramId = savedProgram.id;
        savedId.current = savedProgram.id;
        updateProgram?.({ id: savedProgram.id });
      } else if (editingAssignment?.id) {
        console.log('🔄 [Coach] Updating existing program:', program.id);
        await onCreateProgram({ ...program, deferBuilderRefresh: true });
      }

      // Convert Date objects to strings
      const trainingDates = program.training_dates.map(date => {
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        return typeof date === 'string' ? date : String(date);
      });

      // Αν υπάρχει editingAssignment, ενημερώνουμε αντί να δημιουργούμε νέο
      if (editingAssignment?.id) {
        console.log('🔄 [Coach] Updating existing assignment:', editingAssignment.id);
        
        const sortedDates = [...trainingDates].sort();
        const startDate = sortedDates[0];
        const endDate = sortedDates[sortedDates.length - 1];

        const { error: updateError } = await supabase
          .from('program_assignments')
          .update({
            training_dates: trainingDates,
            start_date: startDate,
            end_date: endDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAssignment.id);

        if (updateError) {
          throw new Error(`Σφάλμα ενημέρωσης assignment: ${updateError.message}`);
        }

        console.log('✅ [Coach] Assignment updated successfully');
        toast.success('Το πρόγραμμα ενημερώθηκε επιτυχώς!');
        onOpenChange();

        navigate(`/dashboard/coach-active-programs?coachId=${coachId}`);

        return;
      }

      console.log('🎯 [Coach] Creating new assignments for coach_users:', program.user_ids);

      const isSingleUser = program.user_ids.length === 1;

      for (let i = 0; i < program.user_ids.length; i++) {
        const coachUserId = program.user_ids[i];
        console.log(`📝 [Coach] Creating assignment for coach_user: ${coachUserId}`);
        
        // 🔄 Recalculate kg/m/s based on this user's personal 1RM data
        console.log(`🔄 [Coach] Recalculating kg/m/s for user ${coachUserId}...`);
        const personalizedWeeks = applyUserWarmUps(program.weeks || [], coachUserId);
        const userWeeks = await recalculateWeeksForUser(personalizedWeeks, coachUserId);

        // Save each recipient's personalized structure exactly once.
        const savedUserProgram = await onCreateProgram(isSingleUser
          ? { ...program, id: baseProgramId, weeks: userWeeks, deferBuilderRefresh: true }
          : assignedProgramCopy(program, coachUserId, userWeeks));
        if (!savedUserProgram?.id) throw new Error('Αποτυχία αποθήκευσης προγράμματος χρήστη');
        const programIdForUser = savedUserProgram.id;
        if (isSingleUser) {
          savedId.current = programIdForUser;
          updateProgram?.({ id: programIdForUser });
        }

        const assignmentData = {
          program: { ...program, id: programIdForUser, weeks: userWeeks },
          coachUserId,
          coachId,
          trainingDates,
          skipStructureRecreation: true, // For multi-user, structure already created by onCreateProgram
        };

        await coachAssignmentService.saveAssignment(assignmentData);
        console.log(`✅ [Coach] Assignment created for coach_user: ${coachUserId}`);
      }

      toast.success(`Το πρόγραμμα ανατέθηκε επιτυχώς σε ${program.user_ids.length} αθλητές!`);
      onOpenChange();

      // Redirect to coach active programs
      navigate(`/dashboard/coach-active-programs?coachId=${coachId}`);

    } catch (error) {
      console.error('❌ [Coach] Assignment error:', error);
      toast.error(`Σφάλμα ανάθεσης: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`);
    } finally {
      operation.current.release();
      setIsAssigning(false);
    }
  };

  return {
    handleClose,
    handleSave,
    handleAssign,
    isAssigning,
    availableUsers
  };
};
