
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
  const { currentProgramId, setCurrentProgramId, handleSave, handleClose } = useProgramSaveOperations({
    program,
    onCreateProgram,
    onOpenChange
  });

  const {
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    availableUsers,
    assignmentEditData,
    handleOpenAssignments,
    handleAssign
  } = useAssignmentDialog({
    users,
    program,
    editingAssignment,
    currentProgramId,
    onCreateProgram,
    onDialogClose: handleClose
  });

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
