
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
      
      // Fetch users with coach_id for filtering
      const { data: usersData } = await supabase
        .from('app_users')
        .select('id, name, email, photo_url, avatar_url, role, is_athlete, coach_id')
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
      // First fetch programs with their basic structure using explicit foreign key hints
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select(`
          *,
          program_weeks!fk_program_weeks_program_id(
            *,
            program_days!fk_program_days_week_id(
              *,
              program_blocks!fk_program_blocks_day_id(
                *,
                program_exercises!fk_program_exercises_block_id(
                  *,
                  exercises!fk_program_exercises_exercise_id(
                    id,
                    name,
                    description
                  )
                )
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (programsError) throw programsError;

      // Then fetch assignments separately
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('program_assignments')
        .select(`
          id,
          program_id,
          user_id,
          training_dates,
          status,
          start_date,
          end_date,
          created_at
        `);

      if (assignmentsError) throw assignmentsError;

      // Fetch user data separately  
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('id, name, email, photo_url');

      if (usersError) throw usersError;

      // Manually join the data
      const programsWithAssignments = (programsData || []).map(program => {
        const assignments = (assignmentsData || [])
          .filter(assignment => assignment.program_id === program.id)
          .map(assignment => {
            const user = (usersData || []).find(user => user.id === assignment.user_id);
            return {
              ...assignment,
              app_users: user || null
            };
          });

        return {
          ...program,
          program_assignments: assignments
        };
      });

      return programsWithAssignments as Program[];
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
