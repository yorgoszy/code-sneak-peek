
import { ProgramStructure } from './useProgramBuilderState';
import { useWeekActions } from './useWeekActions';
import { useDayActions } from './useDayActions';
import { useBlockActions } from './useBlockActions';
import { useExerciseActions } from './useExerciseActions';
import { useReorderActions } from './useReorderActions';

export const useProgramBuilderActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string,
  exercises: any[]
) => {
  // Wrap the updateProgram to preserve user_id
  const updateProgramWithUserId = (updates: Partial<ProgramStructure>) => {
    const updatesWithUserId = {
      ...updates,
      user_id: program.user_id // Διατήρηση του επιλεγμένου χρήστη
    };
    updateProgram(updatesWithUserId);
  };

  const weekActions = useWeekActions(program, updateProgramWithUserId, generateId);
  const dayActions = useDayActions(program, updateProgramWithUserId, generateId);
  const blockActions = useBlockActions(program, updateProgramWithUserId, generateId);
  const exerciseActions = useExerciseActions(program, updateProgramWithUserId, generateId, exercises);
  const reorderActions = useReorderActions(program, updateProgramWithUserId);

  return {
    ...weekActions,
    ...dayActions,
    ...blockActions,
    ...exerciseActions,
    ...reorderActions
  };
};
