
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExerciseCategory {
  id: string;
  name: string;
  type: string;
}

export const useExerciseCategories = () => {
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('exercise_categories')
          .select('id, name, type')
          .order('type', { ascending: true })
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching exercise categories:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error
  };
};
