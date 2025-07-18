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
    console.log('🔄 Starting daily missed workouts check for:', today);

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

    console.log(`📊 Found ${assignments.length} active assignments`);

    // 2. Για κάθε ανάθεση, ελέγξε για χαμένες προπονήσεις
    let createdCount = 0;
    let updatedCount = 0;
    let processedUsers = new Set();

    for (const assignment of assignments) {
      if (!assignment.training_dates || !Array.isArray(assignment.training_dates)) {
        continue;
      }

      // Βρες προπονήσεις στο παρελθόν που δεν έχουν completion
      const pastDates = assignment.training_dates.filter(date => date < today);
      processedUsers.add(assignment.user_id);

      for (const date of pastDates) {
        // Ελέγξε αν υπάρχει ήδη completion για αυτή την ημερομηνία
        const { data: existingCompletion } = await supabaseClient
          .from('workout_completions')
          .select('id, status')
          .eq('assignment_id', assignment.id)
          .eq('scheduled_date', date)
          .maybeSingle();

        if (!existingCompletion) {
          // Υπολόγισε week_number και day_number από τη θέση στο array
          const dateIndex = assignment.training_dates.indexOf(date);
          const weekNumber = Math.floor(dateIndex / 7) + 1;
          const dayNumber = (dateIndex % 7) + 1;

          // Δημιούργησε νέο record
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
              status_color: 'red',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('❌ Error creating missed workout:', insertError);
          } else {
            createdCount++;
            console.log(`✅ Created missed workout for user ${assignment.user_id} on ${date}`);
          }
        } else if (existingCompletion.status !== 'completed' && existingCompletion.status !== 'missed') {
          // Ενημέρωση του υπάρχοντος record
          const { error: updateError } = await supabaseClient
            .from('workout_completions')
            .update({
              status: 'missed',
              status_color: 'red',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingCompletion.id);

          if (updateError) {
            console.error('❌ Error updating workout to missed:', updateError);
          } else {
            updatedCount++;
            console.log(`✅ Updated workout ${existingCompletion.id} to missed`);
          }
        }
      }
    }

    const result = {
      success: true,
      message: `Processed missed workouts for ${processedUsers.size} users`,
      created: createdCount,
      updated: updatedCount,
      processedUsers: processedUsers.size,
      totalAssignments: assignments.length
    };

    console.log('✅ Daily missed workouts check completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error in mark-missed-workouts function:', error);
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