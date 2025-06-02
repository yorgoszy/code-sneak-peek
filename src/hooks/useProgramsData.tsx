
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Exercise, Program } from "@/components/programs/types";

export const useProgramsData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const { data: usersData } = await supabase
        .from('app_users')
        .select('*')
        .order('name');

      // Fetch exercises with categories
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select(`
          *,
          exercise_categories:exercise_to_category(
            exercise_categories(*)
          )
        `)
        .order('name');

      setUsers(usersData || []);
      setExercises(exercisesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramsWithAssignments = async (): Promise<Program[]> => {
    try {
      const { data: programsData } = await supabase
        .from('programs')
        .select(`
          *,
          app_users(*),
          program_weeks(
            *,
            program_days(
              *,
              program_blocks(
                *,
                program_exercises(
                  *,
                  exercises(*)
                )
              )
            )
          ),
          program_assignments(
            *,
            app_users(*)
          )
        `)
        .order('created_at', { ascending: false });

      return programsData || [];
    } catch (error) {
      console.error('Error fetching programs with assignments:', error);
      return [];
    }
  };

  return {
    users,
    exercises,
    loading,
    fetchProgramsWithAssignments
  };
};
