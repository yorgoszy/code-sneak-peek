
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { WorkoutCompletion } from "./useWorkoutCompletions";

interface WorkoutStats {
  completed: number;
  total: number;
  missed: number;
  progress: number;
  averageRpe?: number;
}

export const useWorkoutCompletionsCache = () => {
  const [completionsCache, setCompletionsCache] = useState<Map<string, WorkoutCompletion[]>>(new Map());
  const [loading, setLoading] = useState(false);

  const getWorkoutCompletions = useCallback(async (assignmentId: string): Promise<WorkoutCompletion[]> => {
    // Επιστρέφουμε από cache αν υπάρχει
    if (completionsCache.has(assignmentId)) {
      return completionsCache.get(assignmentId)!;
    }

    try {
      const { data, error } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      // Type cast the data to ensure status is properly typed
      const completions = (data || []).map(item => ({
        ...item,
        status: item.status as 'completed' | 'missed' | 'makeup' | 'scheduled'
      })) as WorkoutCompletion[];
      
      // Αποθηκεύουμε στο cache
      setCompletionsCache(prev => new Map(prev.set(assignmentId, completions)));
      
      return completions;
    } catch (error) {
      console.error('Error fetching workout completions:', error);
      return [];
    }
  }, [completionsCache]);

  const getAllWorkoutCompletions = useCallback(async (): Promise<WorkoutCompletion[]> => {
    try {
      const { data, error } = await supabase
        .from('workout_completions')
        .select('*')
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      // Type cast the data to ensure status is properly typed
      const completions = (data || []).map(item => ({
        ...item,
        status: item.status as 'completed' | 'missed' | 'makeup' | 'scheduled'
      })) as WorkoutCompletion[];
      
      return completions;
    } catch (error) {
      console.error('Error fetching all workout completions:', error);
      return [];
    }
  }, []);

  const calculateWorkoutStats = useCallback((
    completions: WorkoutCompletion[], 
    trainingDates: string[]
  ): WorkoutStats => {
    const totalWorkouts = trainingDates?.length || 0;
    
    // Βρίσκουμε μοναδικές ημερομηνίες που έχουν ολοκληρωθεί (μόνο με status 'completed')
    const uniqueCompletedDates = new Set();
    completions.forEach(c => {
      if (c.status === 'completed' && trainingDates?.includes(c.scheduled_date)) {
        uniqueCompletedDates.add(c.scheduled_date);
      }
    });
    
    const completedWorkouts = uniqueCompletedDates.size;
    const missedWorkouts = completions.filter(c => c.status === 'missed').length;
    
    // Calculate average RPE from completed workouts
    const rpeScores = completions
      .filter(c => c.status === 'completed' && c.rpe_score)
      .map(c => c.rpe_score as number);
    const averageRpe = rpeScores.length > 0 
      ? rpeScores.reduce((a, b) => a + b, 0) / rpeScores.length 
      : undefined;
    
    // Περιορίζουμε το progress στο 100%
    const progress = totalWorkouts > 0 
      ? Math.min(100, Math.round((completedWorkouts / totalWorkouts) * 100))
      : 0;

    console.log('📊 Calculated stats:', {
      completedWorkouts,
      totalWorkouts,
      missedWorkouts,
      progress,
      averageRpe,
      completions: completions.map(c => ({ date: c.scheduled_date, status: c.status, rpe: c.rpe_score }))
    });

    return {
      completed: completedWorkouts,
      total: totalWorkouts,
      missed: missedWorkouts,
      progress,
      averageRpe
    };
  }, []);

  // Bulk fetch για πολλαπλά assignments
  const fetchMultipleCompletions = useCallback(async (assignmentIds: string[]): Promise<void> => {
    setLoading(true);
    try {
      // Φιλτράρουμε μόνο τα IDs που δεν υπάρχουν στο cache
      const uncachedIds = assignmentIds.filter(id => !completionsCache.has(id));
      
      if (uncachedIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('workout_completions')
        .select('*')
        .in('assignment_id', uncachedIds)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      // Type cast and group the results by assignment_id
      const groupedCompletions = (data || []).reduce((acc, completion) => {
        const typedCompletion = {
          ...completion,
          status: completion.status as 'completed' | 'missed' | 'makeup' | 'scheduled'
        } as WorkoutCompletion;
        
        if (!acc[completion.assignment_id]) {
          acc[completion.assignment_id] = [];
        }
        acc[completion.assignment_id].push(typedCompletion);
        return acc;
      }, {} as Record<string, WorkoutCompletion[]>);

      // Ενημερώνουμε το cache
      setCompletionsCache(prev => {
        const newCache = new Map(prev);
        Object.entries(groupedCompletions).forEach(([assignmentId, completions]) => {
          newCache.set(assignmentId, completions);
        });
        // Προσθέτουμε και τα IDs που δεν είχαν completions
        uncachedIds.forEach(id => {
          if (!groupedCompletions[id]) {
            newCache.set(id, []);
          }
        });
        return newCache;
      });

    } catch (error) {
      console.error('Error fetching multiple completions:', error);
    } finally {
      setLoading(false);
    }
  }, [completionsCache]);

  const clearCache = useCallback(() => {
    setCompletionsCache(new Map());
  }, []);

  const invalidateAssignmentCache = useCallback((assignmentId: string) => {
    setCompletionsCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(assignmentId);
      return newCache;
    });
  }, []);

  return {
    getWorkoutCompletions,
    getAllWorkoutCompletions,
    calculateWorkoutStats,
    fetchMultipleCompletions,
    clearCache,
    invalidateAssignmentCache,
    loading,
    cacheSize: completionsCache.size
  };
};
