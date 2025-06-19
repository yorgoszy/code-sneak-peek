import { supabase } from "@/integrations/supabase/client";
import type { EnrichedAssignment } from "./types";

export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('app_users').select('id').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Unexpected Supabase connection error:', error);
    return false;
  }
};

export const fetchUserData = async (authUserId: string) => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('id, name, email')
      .eq('auth_user_id', authUserId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user data:', userError);
      return null;
    }

    return userData;
  } catch (error) {
    console.error('❌ Unexpected error fetching user data:', error);
    return null;
  }
};

export const fetchProgramAssignments = async (userId: string) => {
  try {
    const { data: assignments, error: assignmentsError } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('user_id', userId);

    if (assignmentsError) {
      console.error('❌ Error fetching program assignments:', assignmentsError);
      return null;
    }

    return assignments;
  } catch (error) {
    console.error('❌ Unexpected error fetching program assignments:', error);
    return null;
  }
};

export const enrichAssignmentWithProgramData = async (assignment: any): Promise<EnrichedAssignment> => {
  try {
    // Fetch complete program data with all nested relationships
    const { data: programData, error: programError } = await supabase
      .from('programs')
      .select(`
        *,
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
        )
      `)
      .eq('id', assignment.program_id)
      .single();

    if (programError) {
      console.error('❌ Error fetching program data:', programError);
      return assignment;
    }

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('id, name, email, photo_url')
      .eq('id', assignment.user_id)
      .single();

    if (userError) {
      console.error('❌ Error fetching user data for assignment:', userError);
    }

    return {
      ...assignment,
      programs: programData,
      app_users: userData || null
    };
  } catch (error) {
    console.error('❌ Unexpected error enriching assignment:', error);
    return assignment;
  }
};

export const fetchActivePrograms = async (): Promise<EnrichedAssignment[]> => {
  try {
    console.log('🔄 Fetching active programs from database...');
    
    // Κάνω ακριβώς το ίδιο query που κάνει το exercises page
    const { data: assignments, error: assignmentsError } = await supabase
      .from('program_assignments')
      .select(`
        *,
        programs!inner(
          id,
          name,
          description,
          training_days,
          program_weeks(
            id,
            name,
            week_number,
            program_days(
              id,
              name,
              day_number,
              estimated_duration_minutes,
              program_blocks(
                id,
                name,
                block_order,
                program_exercises(
                  id,
                  exercise_id,
                  sets,
                  reps,
                  kg,
                  percentage_1rm,
                  velocity_ms,
                  tempo,
                  rest,
                  notes,
                  exercise_order,
                  exercises(
                    id,
                    name,
                    description,
                    video_url
                  )
                )
              )
            )
          )
        ),
        app_users!inner(
          id,
          name,
          email,
          photo_url
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error('❌ Error fetching program assignments:', assignmentsError);
      throw assignmentsError;
    }

    console.log('✅ Assignments with programs and users:', assignments);

    if (!assignments || assignments.length === 0) {
      return [];
    }

    // Τώρα τα δεδομένα έρχονται ήδη enriched, απλά τα επιστρέφω
    const enrichedAssignments: EnrichedAssignment[] = assignments.map(assignment => ({
      id: assignment.id,
      program_id: assignment.program_id,
      user_id: assignment.user_id,
      assigned_by: assignment.assigned_by,
      start_date: assignment.start_date,
      end_date: assignment.end_date,
      status: assignment.status,
      notes: assignment.notes,
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
      assignment_type: assignment.assignment_type,
      group_id: assignment.group_id,
      progress: assignment.progress,
      training_dates: assignment.training_dates,
      programs: assignment.programs,
      app_users: assignment.app_users
    }));

    console.log('✅ Final enriched assignments:', enrichedAssignments);
    return enrichedAssignments;
  } catch (error) {
    console.error('❌ Unexpected error fetching active programs:', error);
    throw error;
  }
};
