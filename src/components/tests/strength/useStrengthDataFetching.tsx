
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Exercise, SessionWithDetails } from "./types";

export const useStrengthDataFetching = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);

  const fetchExercises = async (selectedAthleteId: string) => {
    const { data: exercisesData } = await supabase
      .from('exercises')
      .select('id, name')
      .order('name');

    if (!exercisesData) {
      setExercises([]);
      return;
    }

const { data: usageStats } = await supabase
      .from('strength_test_data')
      .select(`
        exercise_id,
        test_sessions!inner(user_id)
      `)
      .eq('test_sessions.user_id', selectedAthleteId);

    const usageMap = new Map();
    usageStats?.forEach(stat => {
      const count = usageMap.get(stat.exercise_id) || 0;
      usageMap.set(stat.exercise_id, count + 1);
    });

    const exercisesWithUsage = exercisesData.map(exercise => ({
      ...exercise,
      usage_count: usageMap.get(exercise.id) || 0
    }));

    exercisesWithUsage.sort((a, b) => {
      if (a.usage_count !== b.usage_count) {
        return b.usage_count - a.usage_count;
      }
      return a.name.localeCompare(b.name);
    });

    setExercises(exercisesWithUsage);
  };

  const fetchSessions = async (selectedAthleteId: string) => {
    if (!selectedAthleteId) return;

const { data: sessionsData } = await supabase
      .from('test_sessions')
      .select(`
        *,
        app_users!user_id(name)
      `)
      .eq('user_id', selectedAthleteId)
      .eq('test_types', '["strength"]')
      .order('created_at', { ascending: false });

    if (sessionsData) {
      const sessionsWithAttempts = await Promise.all(
        sessionsData.map(async (session) => {
const { data: attempts } = await supabase
            .from('strength_test_data')
            .select(`
              *,
              exercises(name)
            `)
            .eq('test_session_id', session.id)
            .order('exercise_id, attempt_number');

          const exerciseTests: any[] = [];
          const exerciseMap = new Map();

          attempts?.forEach((attempt) => {
            const exerciseId = attempt.exercise_id;
            if (!exerciseMap.has(exerciseId)) {
              exerciseMap.set(exerciseId, {
                exercise_id: exerciseId,
                exercise_name: attempt.exercises?.name,
                test_date: session.test_date,
                attempts: []
              });
              exerciseTests.push(exerciseMap.get(exerciseId));
            }
            exerciseMap.get(exerciseId).attempts.push(attempt);
          });

          return {
            ...session,
            start_date: session.test_date,
            end_date: session.test_date,
            exercise_tests: exerciseTests
          };
        })
      );
      setSessions(sessionsWithAttempts);
    }
  };

  return {
    exercises,
    sessions,
    setExercises,
    setSessions,
    fetchExercises,
    fetchSessions
  };
};
