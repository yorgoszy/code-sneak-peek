import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date().toISOString().split('T')[0];
    console.log('🔄 [FORCE-MISSED] Starting force missed workouts check for:', today);

    // 1. Βρες όλες τις ενεργές αναθέσεις
    const { data: assignments, error: assignmentsError } = await supabaseClient
      .from('program_assignments')
      .select('id, user_id, program_id, training_dates')
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
      throw assignmentsError;
    }

    if (!assignments || assignments.length === 0) {
      console.log('ℹ️ No active assignments found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active assignments found',
          processed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`📊 [FORCE-MISSED] Found ${assignments.length} active assignments`);

    // 2. Για κάθε ανάθεση, δημιούργησε missed workouts
    let processedCount = 0;
    let errorCount = 0;

    for (const assignment of assignments) {
      if (!assignment.training_dates || !Array.isArray(assignment.training_dates)) {
        console.log(`⚠️ [FORCE-MISSED] No training dates for assignment ${assignment.id}`);
        continue;
      }

      console.log(`🔄 [FORCE-MISSED] Processing assignment ${assignment.id} with ${assignment.training_dates.length} dates`);

      // Βρες προπονήσεις στο παρελθόν
      const pastDates = assignment.training_dates.filter(date => date < today);
      console.log(`📅 [FORCE-MISSED] Found ${pastDates.length} past dates for assignment ${assignment.id}`);

      for (const date of pastDates) {
        try {
          // Ελέγξε αν υπάρχει ήδη completion
          const { data: existingCompletion } = await supabaseClient
            .from('workout_completions')
            .select('id, status')
            .eq('assignment_id', assignment.id)
            .eq('scheduled_date', date)
            .maybeSingle();

          if (existingCompletion) {
            console.log(`ℹ️ [FORCE-MISSED] Completion already exists for ${date}: ${existingCompletion.status}`);
            continue;
          }

          // Δημιούργησε missed workout
          const dateIndex = assignment.training_dates.indexOf(date);
          const weekNumber = Math.floor(dateIndex / 7) + 1;
          const dayNumber = (dateIndex % 7) + 1;

          const { error: insertError } = await supabaseClient
            .from('workout_completions')
            .insert({
              assignment_id: assignment.id,
              user_id: assignment.user_id,
              program_id: assignment.program_id,
              scheduled_date: date,
              week_number: weekNumber,
              day_number: dayNumber,
              status: 'missed',
              status_color: 'red'
            });

          if (insertError) {
            console.error(`❌ [FORCE-MISSED] Error creating missed workout for ${date}:`, insertError);
            errorCount++;
          } else {
            console.log(`✅ [FORCE-MISSED] Created missed workout for ${date}`);
            processedCount++;
          }

        } catch (error) {
          console.error(`❌ [FORCE-MISSED] Unexpected error for ${date}:`, error);
          errorCount++;
        }
      }
    }

    const result = {
      success: true,
      message: `Force processed ${processedCount} missed workouts`,
      processed: processedCount,
      errors: errorCount,
      totalAssignments: assignments.length
    };

    console.log('✅ [FORCE-MISSED] Process completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ [FORCE-MISSED] Error in force-missed-workouts function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
})