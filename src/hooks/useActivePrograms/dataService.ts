
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
