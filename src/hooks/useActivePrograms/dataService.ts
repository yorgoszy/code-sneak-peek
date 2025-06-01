
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
  const { data: userData, error: userError } = await supabase
    .from('app_users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .single();

  if (userError) {
    console.error('❌ Error fetching user data:', userError);
    return null;
  }

  if (!userData) {
    console.log('⚠️ No user data found');
    return null;
  }

  console.log('✅ Found user data:', userData);
  return userData;
};

export const fetchProgramAssignments = async (athleteId: string) => {
  const { data: assignments, error: assignmentsError } = await supabase
    .from('program_assignments')
    .select('*')
    .eq('athlete_id', athleteId)
    .eq('status', 'active');

  if (assignmentsError) {
    console.error('❌ Error fetching program assignments:', assignmentsError);
    return null;
  }

  console.log('📊 Program assignments fetched:', assignments);

  if (!assignments || assignments.length === 0) {
    console.log('⚠️ No program assignments found for athlete_id:', athleteId);
    return [];
  }

  return assignments;
};

export const enrichAssignmentWithProgramData = async (assignment: any): Promise<EnrichedAssignment> => {
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

    // Return assignment with enriched program data
    return {
      ...assignment,
      programs: {
        ...programData,
        program_weeks: weeksWithDays
      }
    };
  } catch (error) {
    console.error('❌ Error enriching program data:', error);
    return assignment;
  }
};
