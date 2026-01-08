
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
      console.log('📋 Fetching categories for', exercises.length, 'exercises');
      fetchExerciseCategories();
    }
  }, [exercises]);

  const fetchExerciseCategories = async () => {
    try {
      // Fetch ALL exercise categories with pagination (Supabase default limit is 1000)
      const pageSize = 1000;
      let from = 0;
      let allExerciseCategories: { exercise_id: string; exercise_categories: { name: string } | null }[] = [];

      while (true) {
        const { data, error } = await supabase
          .from('exercise_to_category')
          .select(`
            exercise_id,
            exercise_categories!inner(name)
          `)
          .range(from, from + pageSize - 1);

        if (error) {
          console.error('Error fetching exercise categories:', error);
          setExercisesWithCategories(exercises.map(ex => ({ ...ex, categories: [] })));
          return;
        }

        const batch = data ?? [];
        allExerciseCategories = allExerciseCategories.concat(batch as any);

        if (batch.length < pageSize) break;
        from += pageSize;
      }

      console.log('📊 Fetched exercise categories:', allExerciseCategories.length);

      // Map exercises with their categories
      const exercisesWithCats = exercises.map(exercise => {
        const exerciseCats = allExerciseCategories
          .filter(ec => ec.exercise_id === exercise.id)
          .map(ec => ec.exercise_categories?.name)
          .filter(Boolean) as string[];
        
        return {
          ...exercise,
          categories: exerciseCats || []
        };
      });

      console.log('✅ Mapped exercises with categories:', exercisesWithCats.length);
      setExercisesWithCategories(exercisesWithCats);
    } catch (error) {
      console.error('Error processing exercise categories:', error);
      setExercisesWithCategories(exercises.map(ex => ({ ...ex, categories: [] })));
    }
  };

  const addExerciseWithCategories = async (exercise: Exercise) => {
    console.log('🆕 Adding exercise with categories:', exercise.name);
    
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
        
        console.log('📂 Exercise categories found:', categories.length);
        
        setExercisesWithCategories(prev => {
          const exists = prev.some(ex => ex.id === exercise.id);
          if (exists) {
            console.log('⚠️ Exercise with categories already exists:', exercise.id);
            return prev;
          }
          console.log('➕ Adding exercise with categories to list');
          return [...prev, exerciseWithCategories];
        });
      } else {
        console.log('📂 No categories found for exercise, adding without categories');
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
