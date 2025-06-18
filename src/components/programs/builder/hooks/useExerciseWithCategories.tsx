
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
}

interface ExerciseWithCategories extends Exercise {
  categories?: string[];
}

export const useExerciseWithCategories = (exercises: Exercise[]) => {
  const [exercisesWithCategories, setExercisesWithCategories] = useState<ExerciseWithCategories[]>([]);

  // Fetch exercise categories when exercises change
  useEffect(() => {
    if (exercises.length > 0) {
      fetchExerciseCategories();
    }
  }, [exercises]);

  const fetchExerciseCategories = async () => {
    try {
      // Fetch exercise categories from the database
      const { data: exerciseCategories, error } = await supabase
        .from('exercise_to_category')
        .select(`
          exercise_id,
          exercise_categories!inner(name)
        `);

      if (error) {
        console.error('Error fetching exercise categories:', error);
        setExercisesWithCategories(exercises);
        return;
      }

      // Map exercises with their categories
      const exercisesWithCats = exercises.map(exercise => {
        const exerciseCats = exerciseCategories
          .filter(ec => ec.exercise_id === exercise.id)
          .map(ec => ec.exercise_categories?.name)
          .filter(Boolean) as string[];
        
        return {
          ...exercise,
          categories: exerciseCats
        };
      });

      setExercisesWithCategories(exercisesWithCats);
    } catch (error) {
      console.error('Error processing exercise categories:', error);
      setExercisesWithCategories(exercises);
    }
  };

  const addExerciseWithCategories = async (exercise: Exercise) => {
    try {
      const { data: exerciseCategories, error } = await supabase
        .from('exercise_to_category')
        .select(`
          exercise_categories!inner(name)
        `)
        .eq('exercise_id', exercise.id);

      if (!error && exerciseCategories) {
        const categories = exerciseCategories
          .map(ec => ec.exercise_categories?.name)
          .filter(Boolean) as string[];
        
        const exerciseWithCategories = {
          ...exercise,
          categories: categories
        };
        
        setExercisesWithCategories(prev => {
          const exists = prev.some(ex => ex.id === exercise.id);
          if (exists) return prev;
          return [...prev, exerciseWithCategories];
        });
      } else {
        // Add without categories if fetch fails
        setExercisesWithCategories(prev => {
          const exists = prev.some(ex => ex.id === exercise.id);
          if (exists) return prev;
          return [...prev, { ...exercise, categories: [] }];
        });
      }
    } catch (error) {
      console.error('Error fetching categories for new exercise:', error);
      // Add without categories if fetch fails
      setExercisesWithCategories(prev => {
        const exists = prev.some(ex => ex.id === exercise.id);
        if (exists) return prev;
        return [...prev, { ...exercise, categories: [] }];
      });
    }
  };

  return {
    exercisesWithCategories,
    addExerciseWithCategories
  };
};
