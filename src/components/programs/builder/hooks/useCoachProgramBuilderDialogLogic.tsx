import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { User, Exercise } from '../../types';
import type { ProgramStructure } from './useProgramBuilderState';
import { coachAssignmentService } from '../services/coachAssignmentService';
import { recalculateWeeksForUser } from '../services/perUserRecalculation';

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
  // Όλοι οι users είναι coach_users, οπότε δεν χρειάζεται φιλτράρισμα
  const availableUsers = useMemo(() => {
    return users;
  }, [users]);

  const handleClose = () => {
    onOpenChange();
  };

  const handleSave = async () => {
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

      const savedProgram = await onCreateProgram(program);
      console.log('✅ Program saved:', savedProgram);
      
      if (savedProgram?.id && updateProgram) {
        updateProgram({ id: savedProgram.id });
      }
      
      toast.success('Το πρόγραμμα αποθηκεύτηκε επιτυχώς!');
      
    } catch (error) {
      console.error('❌ Error saving program:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος.');
    }
  };

  const handleAssign = async () => {
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
      let baseProgramId = program.id;
      if (!baseProgramId) {
        console.log('📋 [Coach] Creating base program...');
        const savedProgram = await onCreateProgram(program);
        if (!savedProgram || !savedProgram.id) {
          throw new Error('Αποτυχία αποθήκευσης προγράμματος');
        }
        baseProgramId = savedProgram.id;
      } else {
        console.log('🔄 [Coach] Updating existing program:', program.id);
        await onCreateProgram(program);
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
        handleClose();

        setTimeout(() => {
          window.location.href = `/dashboard/coach-active-programs?coachId=${coachId}`;
        }, 1500);

        return;
      }

      console.log('🎯 [Coach] Creating new assignments for coach_users:', program.user_ids);

      const isSingleUser = program.user_ids.length === 1;

      for (let i = 0; i < program.user_ids.length; i++) {
        const coachUserId = program.user_ids[i];
        console.log(`📝 [Coach] Creating assignment for coach_user: ${coachUserId}`);
        
        // 🔄 Recalculate kg/m/s based on this user's personal 1RM data
        console.log(`🔄 [Coach] Recalculating kg/m/s for user ${coachUserId}...`);
        const userWeeks = await recalculateWeeksForUser(program.weeks || [], coachUserId);

        let programIdForUser = baseProgramId;

        // For multiple users: each user gets their OWN program copy
        // so per-user kg/velocity values are stored independently
        if (!isSingleUser) {
          console.log(`📋 [Coach] Creating unique program copy for user ${coachUserId}...`);
          const userProgramCopy = await onCreateProgram({
            ...program,
            id: undefined, // Force new creation
            weeks: userWeeks,
          });
          if (!userProgramCopy || !userProgramCopy.id) {
            throw new Error(`Αποτυχία δημιουργίας αντιγράφου για χρήστη ${coachUserId}`);
          }
          programIdForUser = userProgramCopy.id;
        }

        const assignmentData = {
          program: { ...program, id: programIdForUser, weeks: userWeeks },
          coachUserId,
          coachId,
          trainingDates,
          skipStructureRecreation: !isSingleUser, // For multi-user, structure already created by onCreateProgram
        };

        await coachAssignmentService.saveAssignment(assignmentData);
        console.log(`✅ [Coach] Assignment created for coach_user: ${coachUserId}`);
      }

      toast.success(`Το πρόγραμμα ανατέθηκε επιτυχώς σε ${program.user_ids.length} αθλητές!`);
      handleClose();

      // Redirect to coach active programs
      setTimeout(() => {
        window.location.href = `/dashboard/coach-active-programs?coachId=${coachId}`;
      }, 1500);

    } catch (error) {
      console.error('❌ [Coach] Assignment error:', error);
      toast.error(`Σφάλμα ανάθεσης: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`);
    }
  };

  return {
    handleClose,
    handleSave,
    handleAssign,
    availableUsers
  };
};
