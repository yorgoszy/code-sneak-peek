import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { User, Exercise } from '../../types';
import type { ProgramStructure } from './useProgramBuilderState';
import { assignmentService } from '../services/assignmentService';
import { recalculateWeeksForUser } from '../services/perUserRecalculation';
import { applyUserWarmUps } from '../services/applyUserWarmUps';
import { clearProgramDraft } from './useProgramBuilderState';
import { supabase } from '@/integrations/supabase/client';

interface UseProgramBuilderDialogLogicProps {
  users: User[];
  exercises: Exercise[];
  onCreateProgram: (program: any) => Promise<any>;
  onOpenChange: () => void;
  editingProgram?: any;
  editingAssignment?: any;
  isOpen: boolean;
  program: ProgramStructure;
  updateProgram?: (updates: Partial<ProgramStructure>) => void;
  /** όταν είμαστε admin “μέσα” σε προφίλ coach */
  coachId?: string;
}

export const useProgramBuilderDialogLogic = ({
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
}: UseProgramBuilderDialogLogicProps) => {
  const availableUsers = useMemo(() => {
    console.log('🔍 useProgramBuilderDialogLogic - users:', users.length, 'coachId:', coachId);
    // Ο parent (Programs.tsx ή CoachProgramsPage.tsx) ήδη φιλτράρει τους χρήστες
    // Δεν χρειάζεται επιπλέον φιλτράρισμα εδώ
    return [...users];
  }, [users]);

  const handleClose = () => {
    // Καθαρίζουμε το draft για να μην κολλάει στο επόμενο άνοιγμα
    if (!editingProgram) {
      clearProgramDraft();
    }
    onOpenChange();
  };

  const handleSave = async () => {
    try {
      console.log('💾 [handleSave] Starting save...');
      console.log('💾 [handleSave] Program name:', program.name);
      console.log('💾 [handleSave] Program ID:', program.id);
      console.log('💾 [handleSave] Weeks count:', program.weeks?.length || 0);
      
      // Λεπτομερές logging της δομής
      let totalExercises = 0;
      program.weeks?.forEach((week, wi) => {
        console.log(`💾 [handleSave] Week ${wi + 1}: ${week.name}, Days: ${week.program_days?.length || 0}`);
        week.program_days?.forEach((day, di) => {
          console.log(`💾 [handleSave]   Day ${di + 1}: ${day.name}, Blocks: ${day.program_blocks?.length || 0}`);
          day.program_blocks?.forEach((block, bi) => {
            const exerciseCount = block.program_exercises?.length || 0;
            totalExercises += exerciseCount;
            console.log(`💾 [handleSave]     Block ${bi + 1}: ${block.name}, Exercises: ${exerciseCount}`);
          });
        });
      });
      
      console.log(`💾 [handleSave] Total exercises to save: ${totalExercises}`);
      
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
      
      // Ενημέρωση του program state με το νέο ID
      if (savedProgram?.id && updateProgram) {
        updateProgram({ id: savedProgram.id });
        console.log('✅ Program ID updated in state:', savedProgram.id);
      }
      
      toast.success('Το πρόγραμμα αποθηκεύτηκε επιτυχώς!');
      clearProgramDraft();
      // Don't close dialog, keep it open for assignments
    } catch (error) {
      console.error('❌ Error saving program:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος. Ελέγξτε τη σύνδεση και δοκιμάστε ξανά.');
    }
  };

  const handleAssign = async () => {
    try {
      console.log('🎯 Starting assignment process:', { program, user_ids: program.user_ids });

      if (!program.name?.trim()) {
        toast.error('Πρώτα αποθηκεύστε το πρόγραμμα');
        return;
      }

      if (!program.user_ids || program.user_ids.length === 0) {
        toast.error('Παρακαλώ επιλέξτε τουλάχιστον έναν χρήστη');
        return;
      }

      if (!program.training_dates || program.training_dates.length === 0) {
        toast.error('Παρακαλώ επιλέξτε ημερομηνίες προπόνησης');
        return;
      }

      // Ensure base program is saved first (as a "template" reference)
      let baseProgramId = program.id;
      if (!baseProgramId) {
        const savedProgram = await onCreateProgram(program);
        if (!savedProgram || !savedProgram.id) {
          throw new Error('Αποτυχία αποθήκευσης προγράμματος');
        }
        baseProgramId = savedProgram.id;
      }

      // Convert Date objects to strings
      const trainingDates = program.training_dates.map(date => {
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        return typeof date === 'string' ? date : String(date);
      });

      console.log('🎯 Creating assignments for users:', program.user_ids);
      console.log('🎯 Training dates:', trainingDates);

      const isSingleUser = program.user_ids.length === 1;

      for (let i = 0; i < program.user_ids.length; i++) {
        const userId = program.user_ids[i];
        console.log(`📝 Creating assignment for user: ${userId}`);
        
        // 🔄 Recalculate kg/m/s based on this user's personal 1RM data
        console.log(`🔄 Recalculating kg/m/s for user ${userId}...`);
        const personalizedWeeks = applyUserWarmUps(program.weeks || [], userId);
        const userWeeks = await recalculateWeeksForUser(personalizedWeeks, userId);

        let programIdForUser = baseProgramId;

        // For multiple users: each user gets their OWN program copy
        // so per-user kg/velocity values are stored independently
        if (!isSingleUser) {
          console.log(`📋 Creating unique program copy for user ${userId}...`);
          const userProgramCopy = await onCreateProgram({
            ...program,
            id: undefined, // Force new creation
            name: program.user_ids.length > 1 ? `${program.name}` : program.name,
            weeks: userWeeks,
          });
          if (!userProgramCopy || !userProgramCopy.id) {
            throw new Error(`Αποτυχία δημιουργίας αντιγράφου προγράμματος για χρήστη ${userId}`);
          }
          programIdForUser = userProgramCopy.id;
        }

        const assignmentData = {
          program: { ...program, id: programIdForUser, weeks: userWeeks },
          userId,
          trainingDates,
          coachId,
          skipStructureRecreation: !isSingleUser, // For multi-user, structure was already created by onCreateProgram
        };

        await assignmentService.saveAssignment(assignmentData);
        console.log(`✅ Assignment created for user: ${userId}`);
      }

      toast.success(`Το πρόγραμμα ανατέθηκε επιτυχώς σε ${program.user_ids.length} χρήστες!`);
      clearProgramDraft();
      handleClose();

      // Redirect to active programs
      setTimeout(() => {
        window.location.href = '/dashboard/active-programs';
      }, 1500);

    } catch (error) {
      console.error('❌ Assignment error:', error);
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
