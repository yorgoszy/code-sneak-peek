import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { User, Exercise } from '../../types';
import type { ProgramStructure } from './useProgramBuilderState';
import { coachAssignmentService } from '../services/coachAssignmentService';

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

      // Αποθήκευση/Ενημέρωση του προγράμματος πρώτα
      let programToAssign = program;
      
      // Αν υπάρχει ID, ενημερώνουμε το υπάρχον πρόγραμμα
      if (program.id) {
        console.log('🔄 [Coach] Updating existing program:', program.id);
        const savedProgram = await onCreateProgram(program);
        programToAssign = { ...program, id: savedProgram?.id || program.id };
      } else {
        // Δημιουργία νέου προγράμματος
        console.log('📋 [Coach] Creating new program...');
        const savedProgram = await onCreateProgram(program);
        if (!savedProgram || !savedProgram.id) {
          throw new Error('Αποτυχία αποθήκευσης προγράμματος');
        }
        programToAssign = { ...program, id: savedProgram.id };
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

        // Redirect to coach active programs
        setTimeout(() => {
          window.location.href = `/dashboard/coach-active-programs?coachId=${coachId}`;
        }, 1500);

        return;
      }

      console.log('🎯 [Coach] Creating new assignments for coach_users:', program.user_ids);

      // Create assignments for each selected coach_user - ΒΕΛΤΙΣΤΟΠΟΙΗΣΗ:
      // Η δομή δημιουργείται μόνο μία φορά (στον πρώτο χρήστη), μετά μόνο assignments
      let structureCreated = false;
      
      for (const coachUserId of program.user_ids) {
        console.log(`📝 [Coach] Creating assignment for coach_user: ${coachUserId}`);
        
        const assignmentData = {
          program: programToAssign,
          coachUserId, // ID από coach_users table
          coachId, // ID του coach
          trainingDates,
          skipStructureRecreation: structureCreated // Skip recreation after first one
        };

        await coachAssignmentService.saveAssignment(assignmentData);
        structureCreated = true; // After first assignment, skip structure recreation
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
