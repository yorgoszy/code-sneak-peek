
import { useState } from 'react';
import type { User, Exercise } from '../../types';
import type { ProgramStructure } from './useProgramBuilderState';
import { useAssignmentDialog } from './useAssignmentDialog';
import { useProgramSaveOperations } from './useProgramSaveOperations';

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

  const { currentProgramId, setCurrentProgramId, handleSave, handleClose } = useProgramSaveOperations({
    program,
    onCreateProgram,
    onOpenChange
  });

  const assignmentDialog = useAssignmentDialog(
    program,
    () => {
      setAssignmentDialogOpen(false);
      handleClose();
    }
  );

  const handleOpenAssignments = () => {
    setAssignmentDialogOpen(true);
  };

  const handleAssign = async () => {
    try {
      await assignmentDialog.handleSave();
      setAssignmentDialogOpen(false);
      handleClose();
    } catch (error) {
      console.error('❌ Error during assignment:', error);
    }
  };

  console.log('🔄 ProgramBuilderDialogLogic - Program state:', {
    programId: program.id,
    programName: program.name,
    programWeeks: program.weeks?.length,
    trainingDates: program.training_dates?.length,
    currentProgramId
  });

  return {
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    handleClose,
    handleSave,
    handleOpenAssignments,
    handleAssign,
    availableUsers: users, // Χρησιμοποιούμε όλους τους users
    editingAssignment
  };
};
