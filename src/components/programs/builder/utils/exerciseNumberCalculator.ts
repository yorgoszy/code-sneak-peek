
import { ProgramExercise } from '../../types';

export const calculateExerciseNumber = (
  currentExercise: ProgramExercise,
  allBlockExercises: ProgramExercise[]
): number | null => {
  const sameExercises = allBlockExercises
    .filter(ex => ex.exercise_id === currentExercise.exercise_id && currentExercise.exercise_id)
    .sort((a, b) => a.exercise_order - b.exercise_order);
  
  const currentIndex = sameExercises.findIndex(ex => ex.id === currentExercise.id);
  return sameExercises.length > 1 ? currentIndex + 1 : null;
};
