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
    let processedCount = 0;
    let errorCount = 0;
    let processedUsers = new Set();

    for (const assignment of assignments) {
      if (!assignment.training_dates || !Array.isArray(assignment.training_dates)) {
        continue;
      }

      // Βρες προπονήσεις στο παρελθόν που δεν έχουν completion
      const pastDates = assignment.training_dates.filter(date => date < today);
      if (pastDates.length === 0) continue;

      processedUsers.add(assignment.user_id);
      console.log(`🔄 Processing assignment ${assignment.id} with ${pastDates.length} past dates`);

      // Πάρε τη δομή του προγράμματος για σωστό υπολογισμό των week/day numbers
      const { data: programStructure } = await supabaseClient
        .from('programs')
        .select(`
          id,
          program_weeks (
            id,
            week_number,
            program_days (
              id,
              day_number
            )
          )
        `)
        .eq('id', assignment.program_id)
        .single();

      if (!programStructure?.program_weeks) {
        console.error(`❌ No program structure found for program ${assignment.program_id}`);
        continue;
      }

      // Δημιούργησε mapping από date index σε week/day numbers
      const dateToWeekDay = new Map();
      let dateIndex = 0;
      
      for (const week of programStructure.program_weeks.sort((a, b) => a.week_number - b.week_number)) {
        for (const day of week.program_days.sort((a, b) => a.day_number - b.day_number)) {
          if (dateIndex < assignment.training_dates.length) {
            dateToWeekDay.set(assignment.training_dates[dateIndex], {
              week_number: week.week_number,
              day_number: day.day_number
            });
            dateIndex++;
          }
        }
      }

      for (const date of pastDates) {
        try {
          // Ελέγξε αν υπάρχει ήδη completion για αυτή την ημερομηνία
          const { data: existingCompletion } = await supabaseClient
            .from('workout_completions')
            .select('id, status')
            .eq('assignment_id', assignment.id)
            .eq('scheduled_date', date)
            .maybeSingle();

          if (!existingCompletion) {
            // Πάρε τα σωστά week/day numbers από το mapping
            const weekDayInfo = dateToWeekDay.get(date);
            if (!weekDayInfo) {
              console.error(`❌ No week/day info found for date ${date}`);
              continue;
            }

            // Δημιούργησε νέο record
            const { error: insertError } = await supabaseClient
              .from('workout_completions')
              .insert({
                assignment_id: assignment.id,
                user_id: assignment.user_id,
                program_id: assignment.program_id,
                scheduled_date: date,
                week_number: weekDayInfo.week_number,
                day_number: weekDayInfo.day_number,
                status: 'missed',
                status_color: 'red',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              console.error('❌ Error creating missed workout:', insertError);
              errorCount++;
            } else {
              processedCount++;
              console.log(`✅ Created missed workout for user ${assignment.user_id} on ${date} (Week ${weekDayInfo.week_number}, Day ${weekDayInfo.day_number})`);
            }

          } else if (existingCompletion.status === 'scheduled' || existingCompletion.status === 'pending') {
            // Ενημέρωση του υπάρχοντος record μόνο αν είναι scheduled/pending
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
              errorCount++;
            } else {
              processedCount++;
              console.log(`✅ Updated workout ${existingCompletion.id} to missed`);
            }
          }
        } catch (error) {
          console.error(`❌ Error processing date ${date}:`, error);
          errorCount++;
        }
      }
    }

    const result = {
      success: true,
      message: `Processed missed workouts for ${processedUsers.size} users`,
      processed: processedCount,
      errors: errorCount,
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