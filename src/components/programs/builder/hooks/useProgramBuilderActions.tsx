
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
  const weekActions = useWeekActions(program, updateProgram, generateId);
  const dayActions = useDayActions(program, updateProgram, generateId);
  const blockActions = useBlockActions(program, updateProgram, generateId);
  const exerciseActions = useExerciseActions(program, updateProgram, generateId, exercises);
  const reorderActions = useReorderActions(program, updateProgram);

  return {
    ...weekActions,
    ...dayActions,
    ...blockActions,
    ...exerciseActions,
    ...reorderActions
  };
};
