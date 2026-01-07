
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  categories: { name: string; type: string }[];
}

interface Category {
  id: string;
  name: string;
  type: string;
}

export const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const { data, error } = await supabase
        .from('exercise_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των κατηγοριών');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchExercises = async () => {
    try {
      setLoadingExercises(true);
      
      // Admin βλέπει μόνο global ασκήσεις (χωρίς coach_id)
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select(`
          id,
          name,
          description,
          video_url,
          exercise_to_category!inner(
            exercise_categories(
              name,
              type
            )
          )
        `)
        .is('coach_id', null);

      if (exercisesError) throw exercisesError;

      const transformedExercises: Exercise[] = exercisesData?.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        video_url: exercise.video_url,
        categories: exercise.exercise_to_category?.map((etc: any) => ({
          name: etc.exercise_categories.name,
          type: etc.exercise_categories.type
        })) || []
      })) || [];

      console.log('Fetched exercises:', transformedExercises.length);
      setExercises(transformedExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των ασκήσεων');
    } finally {
      setLoadingExercises(false);
    }
  };

  const deleteExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;

      toast.success('Η άσκηση διαγράφηκε επιτυχώς');
      fetchExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast.error('Σφάλμα κατά τη διαγραφή της άσκησης');
    }
  };

  useEffect(() => {
    fetchExercises();
    fetchCategories();
  }, []);

  return {
    exercises,
    categories,
    loadingExercises,
    loadingCategories,
    fetchExercises,
    deleteExercise
  };
};
