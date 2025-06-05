
import { useState, useEffect, useMemo } from 'react';
import { useProgramAssignments } from '@/hooks/programs/useProgramAssignments';
import { useProgramWorkoutCompletions } from '@/hooks/programs/useProgramWorkoutCompletions';
import { toast } from 'sonner';
import type { User, Exercise } from '../../types';
import type { ProgramStructure } from './useProgramBuilderState';

interface UseProgramBuilderDialogLogicProps {
  users: User[];
  exercises: Exercise[];
  onCreateProgram: (program: any) => Promise<any>;
  onOpenChange: () => void;
  editingProgram?: any | null;
  editingAssignment?: {
    id: string;
    user_id: string;
    training_dates: string[];
  } | null;
  isOpen: boolean;
  program: ProgramStructure;
}

export const useProgramBuilderDialogLogic = ({
  users,
  exercises,
  onCreateProgram,
  onOpenChange,
  editingProgram,
  editingAssignment,
  isOpen,
  program
}: UseProgramBuilderDialogLogicProps) => {
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const { createOrUpdateAssignment } = useProgramAssignments();
  const { createWorkoutCompletions } = useProgramWorkoutCompletions();

  const availableUsers = useMemo(() => {
    if (editingAssignment) {
      // Όταν επεξεργαζόμαστε assignment, επιστρέφουμε όλους τους χρήστες
      return users;
    }
    
    if (program.user_id) {
      // Αν έχει επιλεγεί χρήστης στο πρόγραμμα, επιστρέφουμε μόνο αυτόν
      return users.filter(user => user.id === program.user_id);
    }
    
    // Αλλιώς επιστρέφουμε όλους τους χρήστες
    return users;
  }, [users, program.user_id, editingAssignment]);

  const assignmentEditData = useMemo(() => {
    if (editingAssignment) {
      return {
        user_id: editingAssignment.user_id,
        training_dates: editingAssignment.training_dates || []
      };
    }
    return null;
  }, [editingAssignment]);

  const handleClose = () => {
    console.log('Closing program builder dialog');
    setAssignmentDialogOpen(false);
    onOpenChange();
  };

  const handleSave = async () => {
    try {
      console.log('🔄 Saving program as draft...', program);
      
      if (!program.name?.trim()) {
        toast.error('Παρακαλώ εισάγετε όνομα προγράμματος');
        return;
      }

      // Αποθήκευση ως προσχέδιο
      const savedProgram = await onCreateProgram({
        ...program,
        status: 'draft'
      });
      
      console.log('✅ Program saved as draft:', savedProgram);
      toast.success('Το πρόγραμμα αποθηκεύτηκε ως προσχέδιο');
      onOpenChange();
    } catch (error) {
      console.error('❌ Error saving program:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος');
    }
  };

  const handleOpenAssignments = async () => {
    try {
      console.log('🔄 Opening assignments dialog...', program);
      
      if (!program.name?.trim()) {
        toast.error('Παρακαλώ εισάγετε όνομα προγράμματος');
        return;
      }

      if (!program.weeks || program.weeks.length === 0) {
        toast.error('Παρακαλώ προσθέστε τουλάχιστον μία εβδομάδα');
        return;
      }

      // Αποθήκευση πρώτα το πρόγραμμα αν δεν έχει ID
      if (!program.id) {
        console.log('💾 Saving program before assignment...');
        const savedProgram = await onCreateProgram({
          ...program,
          status: 'template'
        });
        console.log('✅ Program saved before assignment:', savedProgram);
      }

      setAssignmentDialogOpen(true);
    } catch (error) {
      console.error('❌ Error opening assignments:', error);
      toast.error('Σφάλμα κατά το άνοιγμα των αναθέσεων');
    }
  };

  const handleAssign = async (userId: string, trainingDates: string[]) => {
    try {
      console.log('🔄 Creating assignment...', {
        programId: program.id,
        userId,
        trainingDates: trainingDates.length
      });

      if (!program.id) {
        toast.error('Πρέπει πρώτα να αποθηκευτεί το πρόγραμμα');
        return;
      }

      // Δημιουργία assignment
      const assignment = await createOrUpdateAssignment(
        program.id,
        userId,
        trainingDates[0], // start_date
        trainingDates[trainingDates.length - 1], // end_date
        trainingDates
      );

      console.log('✅ Assignment created:', assignment);

      // Δημιουργία workout completions
      await createWorkoutCompletions(
        assignment.id,
        userId,
        program.id,
        trainingDates,
        program
      );

      console.log('✅ Assignment process completed successfully');
      toast.success('Το πρόγραμμα ανατέθηκε επιτυχώς');
      
      setAssignmentDialogOpen(false);
      onOpenChange();
    } catch (error) {
      console.error('❌ Error creating assignment:', error);
      toast.error('Σφάλμα κατά την ανάθεση του προγράμματος');
    }
  };

  return {
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    handleClose,
    handleSave,
    handleOpenAssignments,
    handleAssign,
    availableUsers,
    assignmentEditData
  };
};
