
import { useEffect, useState } from 'react';
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

  // Update current exercises when initial exercises change
  useEffect(() => {
    console.log('📥 Initial exercises updated:', initialExercises.length);
    setCurrentExercises(initialExercises);
  }, [initialExercises]);

  // Set up real-time subscription for exercises
  useEffect(() => {
    console.log('🔄 Setting up real-time subscription for exercises...');
    
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
          console.log('✅ New exercise added via realtime:', payload.new);
          
          const newExercise = payload.new as Exercise;
          
          // Add the new exercise to the current list immediately
          setCurrentExercises(prev => {
            const exists = prev.some(ex => ex.id === newExercise.id);
            if (exists) {
              console.log('⚠️ Exercise already exists in list:', newExercise.id);
              return prev;
            }
            console.log('➕ Adding new exercise to list:', newExercise.name);
            return [...prev, newExercise];
          });
          
          // Notify parent component about the new exercise
          onExerciseAdded(newExercise);
        }
      )
      .subscribe((status) => {
        console.log('🔗 Real-time subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up exercises subscription...');
      supabase.removeChannel(exercisesSubscription);
    };
  }, [onExerciseAdded]);

  return {
    currentExercises
  };
};
