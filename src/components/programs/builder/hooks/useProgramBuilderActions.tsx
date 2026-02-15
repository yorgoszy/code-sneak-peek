
import { ProgramStructure } from './useProgramBuilderState';
import { useWeekActions } from './useWeekActions';
import { useDayActions } from './useDayActions';
import { useBlockActions } from './useBlockActions';
import { useExerciseActions } from './useExerciseActions';
import { useReorderActions } from './useReorderActions';

export const useProgramBuilderActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure> | ((prev: ProgramStructure) => Partial<ProgramStructure>)) => void,
  generateId: () => string,
  exercises: any[],
  saveProgram?: (programData: any) => Promise<any>
) => {
  // Βελτιωμένη updateProgram που διατηρεί όλες τις βασικές πληροφορίες
  const updateProgramWithPreservation = (updates: Partial<ProgramStructure> | ((prev: ProgramStructure) => Partial<ProgramStructure>)) => {
    if (typeof updates === 'function') {
      // For functional updates, pass through directly (caller handles everything)
      updateProgram(updates);
      return;
    }
    const preservedUpdates = {
      ...updates,
      id: program.id,
      user_id: program.user_id,
      user_ids: program.user_ids,
      is_multiple_assignment: program.is_multiple_assignment,
      name: program.name,
      description: program.description,
      training_dates: program.training_dates,
      is_template: program.is_template
    };
    updateProgram(preservedUpdates);
  };

  const weekActions = useWeekActions(program, updateProgramWithPreservation, generateId, saveProgram, exercises);
  const dayActions = useDayActions(program, updateProgramWithPreservation, generateId, saveProgram, exercises);
  const blockActions = useBlockActions(program, updateProgramWithPreservation, generateId, saveProgram);
  const exerciseActions = useExerciseActions(program, updateProgramWithPreservation, generateId, exercises, saveProgram);
  const reorderActions = useReorderActions(program, updateProgramWithPreservation);

  // Νέες λειτουργίες για πολλαπλούς χρήστες
  const handleMultipleAthleteChange = (userIds: string[]) => {
    updateProgram({ 
      user_ids: userIds,
      is_multiple_assignment: true
    });
  };

  const handleToggleAssignmentMode = (isMultiple: boolean) => {
    // Διατηρούμε τους επιλεγμένους χρήστες όταν αλλάζει mode
    updateProgram({ 
      is_multiple_assignment: isMultiple
    });
  };

  return {
    ...weekActions,
    ...dayActions,
    ...blockActions,
    ...exerciseActions,
    ...reorderActions,
    handleMultipleAthleteChange,
    handleToggleAssignmentMode
  };
};
