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
  const { data, error } = await supabase
    .from('program_assignments')
    .select(`
      id,
      program_id,
      user_id,
      progress,
      start_date,
      end_date,
      created_at,
      updated_at,
      assigned_by,
      group_id,
      training_dates,
      status,
      assignment_type,
      notes,
      programs!inner(
        id,
        name,
        description,
        duration,
        created_by,
        created_at,
        updated_at,
        is_template,
        user_id,
        start_date,
        training_days,
        status,
        type,
        program_weeks(
          id,
          week_number,
          name,
          program_days(
            id,
            day_number,
            name,
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
        photo_url,
        role
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching active programs:', error);
    throw error;
  }

  console.log('✅ Raw data from Supabase:', data);
  return data || [];
};
