
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
}

export const useExerciseRealtime = (
  initialExercises: Exercise[],
  onExerciseAdded: (exercise: Exercise) => void
) => {
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>(initialExercises);
  const onExerciseAddedRef = useRef(onExerciseAdded);
  onExerciseAddedRef.current = onExerciseAdded;

  useEffect(() => {
    setCurrentExercises(initialExercises);
  }, [initialExercises]);

  // Single subscription - stable deps, no re-subscribe on callback change
  useEffect(() => {
    const exercisesSubscription = supabase
      .channel('exercises-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'exercises'
        },
        async (payload) => {
          const newExercise = payload.new as Exercise;
          setCurrentExercises(prev => {
            if (prev.some(ex => ex.id === newExercise.id)) return prev;
            return [...prev, newExercise];
          });
          onExerciseAddedRef.current(newExercise);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(exercisesSubscription);
    };
  }, []); // stable - no deps that change

  return { currentExercises };
};
