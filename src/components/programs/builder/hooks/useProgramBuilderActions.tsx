
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
  // Βελτιωμένη updateProgram που διατηρεί όλες τις βασικές πληροφορίες
  const updateProgramWithPreservation = (updates: Partial<ProgramStructure>) => {
    const preservedUpdates = {
      ...updates,
      user_id: program.user_id, // Διατήρηση του επιλεγμένου χρήστη
      name: program.name, // Διατήρηση του ονόματος
      description: program.description, // Διατήρηση της περιγραφής
      training_dates: program.training_dates // Διατήρηση των επιλεγμένων ημερομηνιών
    };
    updateProgram(preservedUpdates);
  };

  const weekActions = useWeekActions(program, updateProgramWithPreservation, generateId);
  const dayActions = useDayActions(program, updateProgramWithPreservation, generateId);
  const blockActions = useBlockActions(program, updateProgramWithPreservation, generateId);
  const exerciseActions = useExerciseActions(program, updateProgramWithPreservation, generateId, exercises);
  const reorderActions = useReorderActions(program, updateProgramWithPreservation);

  return {
    ...weekActions,
    ...dayActions,
    ...blockActions,
    ...exerciseActions,
    ...reorderActions
  };
};
