
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
  const [currentProgramId, setCurrentProgramId] = useState<string | null>(null);
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

  // Ενημέρωση του currentProgramId όταν αλλάζει το program.id
  useEffect(() => {
    if (program.id) {
      setCurrentProgramId(program.id);
    }
  }, [program.id]);

  const handleClose = () => {
    console.log('Closing program builder dialog');
    setAssignmentDialogOpen(false);
    setCurrentProgramId(null);
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
      setCurrentProgramId(savedProgram.id);
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

      let programId = program.id || currentProgramId;

      // Αποθήκευση πρώτα το πρόγραμμα ως ACTIVE (όχι draft) γιατί θα γίνει ανάθεση
      if (!programId) {
        console.log('💾 Saving program for assignment...');
        try {
          const savedProgram = await onCreateProgram({
            ...program,
            status: 'active'  // Αποθηκεύουμε ως active γιατί θα γίνει ανάθεση
          });
          programId = savedProgram.id;
          setCurrentProgramId(programId);
          console.log('✅ Program saved as active for assignment:', savedProgram);
        } catch (error) {
          console.error('❌ Error saving program for assignment:', error);
          toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος');
          return;
        }
      } else {
        // Αν υπάρχει ήδη, ενημερώνουμε το status σε active
        try {
          await onCreateProgram({
            ...program,
            id: programId,
            status: 'active'
          });
          console.log('✅ Program updated to active status');
        } catch (error) {
          console.error('❌ Error updating program status:', error);
          toast.error('Σφάλμα κατά την ενημέρωση του προγράμματος');
          return;
        }
      }

      setAssignmentDialogOpen(true);
    } catch (error) {
      console.error('❌ Error opening assignments:', error);
      toast.error('Σφάλμα κατά το άνοιγμα των αναθέσεων');
    }
  };

  const handleAssign = async (userId: string, trainingDates: string[]) => {
    try {
      const programId = program.id || currentProgramId;
      
      console.log('🔄 Creating assignment...', {
        programId,
        userId,
        trainingDates: trainingDates.length
      });

      if (!programId) {
        toast.error('Πρέπει πρώτα να αποθηκευτεί το πρόγραμμα');
        return;
      }

      // Δημιουργία assignment (το πρόγραμμα είναι ήδη active)
      const assignment = await createOrUpdateAssignment(
        programId,
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
        programId,
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
