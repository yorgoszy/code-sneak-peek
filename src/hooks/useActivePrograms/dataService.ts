
import { supabase } from "@/integrations/supabase/client";
import type { EnrichedAssignment } from "./types";

export const testSupabaseConnection = async () => {
  const { data: testData, error: testError } = await supabase
    .from('app_users')
    .select('count')
    .limit(1);
  
  if (testError) {
    console.error('❌ Supabase connection error:', testError);
    return false;
  }

  console.log('✅ Supabase connection successful');
  return true;
};

export const fetchUserData = async (authUserId: string) => {
  if (!authUserId) {
    console.error('❌ No auth user ID provided');
    return null;
  }

  console.log('🔍 Fetching user data for auth_user_id:', authUserId);

  const { data: userData, error: userError } = await supabase
    .from('app_users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .single();

  if (userError) {
    console.error('❌ Error fetching user data:', userError);
    return null;
  }

  if (!userData || !userData.id) {
    console.log('⚠️ No valid user data found or missing user ID');
    return null;
  }

  console.log('✅ Found user data:', userData);
  return userData;
};

export const fetchProgramAssignments = async (userId: string) => {
  if (!userId) {
    console.error('❌ No user ID provided for fetching assignments');
    return null;
  }

  console.log('🔍 Fetching assignments for user_id:', userId);
  
  const { data: assignments, error: assignmentsError } = await supabase
    .from('program_assignments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (assignmentsError) {
    console.error('❌ Error fetching program assignments:', assignmentsError);
    return null;
  }

  console.log('📊 Raw assignments from database:', assignments);

  if (!assignments || assignments.length === 0) {
    console.log('⚠️ No program assignments found for user_id:', userId);
    return [];
  }

  // Log each assignment's dates
  assignments.forEach(assignment => {
    console.log(`📅 Assignment ${assignment.id} dates:`, {
      start_date: assignment.start_date,
      end_date: assignment.end_date,
      start_date_type: typeof assignment.start_date,
      end_date_type: typeof assignment.end_date
    });
  });

  return assignments;
};

export const enrichAssignmentWithProgramData = async (assignment: any): Promise<EnrichedAssignment> => {
  console.log('🔄 Enriching assignment:', assignment.id, 'with dates:', {
    start_date: assignment.start_date,
    end_date: assignment.end_date
  });

  if (!assignment.program_id) {
    console.log('❌ Assignment without valid program_id:', assignment.id);
    return assignment;
  }

  try {
    // Fetch basic program info
    const { data: programData, error: programError } = await supabase
      .from('programs')
      .select('id, name, description')
      .eq('id', assignment.program_id)
      .single();

    if (programError) {
      console.error('❌ Error fetching program:', assignment.program_id, programError);
      return assignment;
    }

    // Fetch program weeks
    const { data: weeks, error: weeksError } = await supabase
      .from('program_weeks')
      .select('*')
      .eq('program_id', assignment.program_id)
      .order('week_number');

    if (weeksError) {
      console.error('❌ Error fetching weeks for program:', assignment.program_id, weeksError);
      return assignment;
    }

    // Fetch days for each week
    const weeksWithDays = await Promise.all(
      (weeks || []).map(async (week) => {
        const { data: days, error: daysError } = await supabase
          .from('program_days')
          .select('*')
          .eq('week_id', week.id)
          .order('day_number');

        if (daysError) {
          console.error('❌ Error fetching days for week:', week.id, daysError);
          return { ...week, program_days: [] };
        }

        // Fetch blocks for each day
        const daysWithBlocks = await Promise.all(
          (days || []).map(async (day) => {
            const { data: blocks, error: blocksError } = await supabase
              .from('program_blocks')
              .select('*')
              .eq('day_id', day.id)
              .order('block_order');

            if (blocksError) {
              console.error('❌ Error fetching blocks for day:', day.id, blocksError);
              return { ...day, program_blocks: [] };
            }

            return { ...day, program_blocks: blocks || [] };
          })
        );

        return { ...week, program_days: daysWithBlocks };
      })
    );

    // Return assignment with enriched program data - preserve original dates
    const enrichedAssignment = {
      ...assignment,
      programs: {
        ...programData,
        program_weeks: weeksWithDays
      }
    };

    console.log('✅ Enriched assignment with preserved dates:', {
      id: enrichedAssignment.id,
      start_date: enrichedAssignment.start_date,
      end_date: enrichedAssignment.end_date,
      program_name: enrichedAssignment.programs?.name
    });

    return enrichedAssignment;
  } catch (error) {
    console.error('❌ Error enriching program data:', error);
    return assignment;
  }
};
