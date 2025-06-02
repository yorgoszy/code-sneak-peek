
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
    .select('id, name, email, photo_url')
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
  
  // Fetch assignments with user data included using the correct foreign key constraint
  const { data: assignments, error: assignmentsError } = await supabase
    .from('program_assignments')
    .select(`
      *,
      app_users!fk_program_assignments_user_id(id, name, email, photo_url)
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  if (assignmentsError) {
    console.error('❌ Error fetching program assignments:', assignmentsError);
    
    // Fallback to simple query if foreign key fails
    const { data: simpleAssignments, error: simpleError } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (simpleError) {
      console.error('❌ Error with fallback query:', simpleError);
      return null;
    }

    console.log('📊 Fallback assignments from database:', simpleAssignments);
    return simpleAssignments || [];
  }

  console.log('📊 Raw assignments from database:', assignments);

  if (!assignments || assignments.length === 0) {
    console.log('⚠️ No program assignments found for user_id:', userId);
    return [];
  }

  return assignments;
};

export const enrichAssignmentWithProgramData = async (assignment: any): Promise<EnrichedAssignment> => {
  console.log('🔄 Enriching assignment:', assignment.id, 'with training_dates:', assignment.training_dates);

  if (!assignment.program_id) {
    console.log('❌ Assignment without valid program_id:', assignment.id);
    return assignment;
  }

  try {
    // Fetch basic program info
    const { data: programData, error: programError } = await supabase
      .from('programs')
      .select('id, name, description, training_days')
      .eq('id', assignment.program_id)
      .single();

    if (programError) {
      console.error('❌ Error fetching program:', assignment.program_id, programError);
      return assignment;
    }

    console.log('📊 Program data:', programData);

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

    // Return assignment with enriched program data and ensure training_dates are preserved
    const enrichedAssignment = {
      ...assignment,
      training_dates: assignment.training_dates || [], // Ensure this field is preserved
      programs: {
        ...programData,
        program_weeks: weeksWithDays
      }
    };

    console.log('✅ Enriched assignment with training_dates:', {
      id: enrichedAssignment.id,
      training_dates: enrichedAssignment.training_dates,
      training_dates_length: enrichedAssignment.training_dates?.length,
      program_name: enrichedAssignment.programs?.name,
      user_name: enrichedAssignment.app_users?.name
    });

    return enrichedAssignment;
  } catch (error) {
    console.error('❌ Error enriching program data:', error);
    return assignment;
  }
};
