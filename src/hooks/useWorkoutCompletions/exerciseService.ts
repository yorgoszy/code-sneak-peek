
import { supabase } from "@/integrations/supabase/client";
import type { ExerciseResult } from "./types";

export const saveExerciseResults = async (
  workoutCompletionId: string,
  exerciseResults: Omit<ExerciseResult, 'id' | 'workout_completion_id' | 'created_at' | 'updated_at'>[]
) => {
  const resultsToInsert = exerciseResults.map(result => ({
    ...result,
    workout_completion_id: workoutCompletionId
  }));

  const { data, error } = await supabase
    .from('exercise_results')
    .insert(resultsToInsert)
    .select();

  if (error) throw error;
  return data;
};

export const getExerciseResults = async (workoutCompletionId: string) => {
  const { data, error } = await supabase
    .from('exercise_results')
    .select('*')
    .eq('workout_completion_id', workoutCompletionId);

  if (error) throw error;
  return data || [];
};
