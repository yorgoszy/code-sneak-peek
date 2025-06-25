
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { User, Exercise } from '../../types';
import type { ProgramStructure } from './useProgramBuilderState';
import { assignmentService } from '../services/assignmentService';
import { groupAssignmentService } from '../services/groupAssignmentService';

interface UseProgramBuilderDialogLogicProps {
  users: User[];
  exercises: Exercise[];
  onCreateProgram: (program: any) => Promise<any>;
  onOpenChange: () => void;
  editingProgram?: any;
  editingAssignment?: any;
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
      
      toast.success('Το πρόγραμμα αποθηκεύτηκε επιτυχώς!');
      handleClose();
    } catch (error) {
      console.error('❌ Error saving program:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος');
    }
  };

  const handleOpenAssignments = () => {
    if (!program.name?.trim()) {
      toast.error('Πρώτα αποθηκεύστε το πρόγραμμα');
      return;
    }
    setAssignmentDialogOpen(true);
  };

  const handleAssign = async (
    userId: string, 
    trainingDates: string[], 
    assignmentType: 'individual' | 'group' = 'individual',
    groupId?: string
  ) => {
    try {
      console.log('🎯 Starting assignment process:', { assignmentType, userId, groupId, trainingDates });

      if (!program.id) {
        // Save program first if it doesn't have an ID
        const savedProgram = await onCreateProgram(program);
        if (!savedProgram || !savedProgram.id) {
          throw new Error('Αποτυχία αποθήκευσης προγράμματος');
        }
        program.id = savedProgram.id;
      }

      if (assignmentType === 'group' && groupId) {
        console.log('👥 Creating group assignment');
        const result = await groupAssignmentService.assignProgramToGroup(
          groupId,
          program,
          trainingDates
        );
        
        toast.success(`Το πρόγραμμα ανατέθηκε επιτυχώς στην ομάδα! Δημιουργήθηκαν ${result.totalMembers} ατομικές αναθέσεις.`);
      } else {
        console.log('👤 Creating individual assignment');
        const assignmentData = {
          program,
          userId,
          trainingDates
        };

        await assignmentService.saveAssignment(assignmentData);
        toast.success('Το πρόγραμμα ανατέθηκε επιτυχώς!');
      }

      setAssignmentDialogOpen(false);
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
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    handleClose,
    handleSave,
    handleOpenAssignments,
    handleAssign,
    availableUsers,
    editingAssignment: editingAssignment
  };
};
