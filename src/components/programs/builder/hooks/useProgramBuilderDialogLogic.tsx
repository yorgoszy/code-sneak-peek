import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { User, Exercise } from '../../types';
import type { ProgramStructure } from './useProgramBuilderState';
import { assignmentService } from '../services/assignmentService';

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
  updateProgram
}: UseProgramBuilderDialogLogicProps) => {
  const availableUsers = useMemo(() => {
    return users.filter(user => 
      user.role === 'athlete' || 
      user.role === 'user' || 
      !user.role  // Include users without role defined
    );
  }, [users]);

  const handleClose = () => {
    onOpenChange();
  };

  const handleSave = async () => {
    try {
      console.log('💾 Saving program:', program);
      
      if (!program.name?.trim()) {
        toast.error('Το όνομα του προγράμματος είναι υποχρεωτικό');
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
      
      // Don't close dialog, keep it open for assignments
    } catch (error) {
      console.error('❌ Error saving program:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος');
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

      // Ensure program is saved first
      let programToAssign = program;
      if (!program.id) {
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

      console.log('🎯 Creating assignments for users:', program.user_ids);
      console.log('🎯 Training dates:', trainingDates);

      // Create assignments for each selected user
      for (const userId of program.user_ids) {
        console.log(`📝 Creating assignment for user: ${userId}`);
        
        const assignmentData = {
          program: programToAssign,
          userId,
          trainingDates
        };

        await assignmentService.saveAssignment(assignmentData);
        console.log(`✅ Assignment created for user: ${userId}`);
      }

      toast.success(`Το πρόγραμμα ανατέθηκε επιτυχώς σε ${program.user_ids.length} χρήστες!`);
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
