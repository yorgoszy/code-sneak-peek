import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProgramExercise {
  exercise_name: string;
  exercise_id?: string;
  sets: number;
  reps: string;
  kg?: string;
  tempo?: string;
  rest?: string;
  notes?: string;
}

interface ProgramBlock {
  name: string;
  training_type?: string;
  exercises: ProgramExercise[];
}

interface ProgramDay {
  name: string;
  blocks: ProgramBlock[];
}

interface ProgramWeek {
  name: string;
  days: ProgramDay[];
}

interface CreateProgramRequest {
  action: 'create_program';
  name: string;
  description?: string;
  weeks: ProgramWeek[];
  user_id?: string; // Αν δίνεται, ανατίθεται αμέσως
  training_dates?: string[]; // Για ανάθεση
}

interface AssignProgramRequest {
  action: 'assign_program';
  program_id: string;
  user_id: string;
  training_dates: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    console.log('🤖 AI Program Action:', action, body);

    // Helper: Βρίσκει user_id από όνομα αν δεν είναι UUID
    const resolveUserId = async (userIdOrName: string | undefined): Promise<string | undefined> => {
      if (!userIdOrName) return undefined;
      
      // Αν είναι UUID, επέστρεψε άμεσα
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(userIdOrName)) {
        return userIdOrName;
      }
      
      // Αλλιώς, ψάξε στη βάση με το όνομα
      console.log('🔍 Searching user by name:', userIdOrName);
      const userResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/app_users?name=ilike.*${encodeURIComponent(userIdOrName)}*&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const users = await userResponse.json();
      if (users && users.length > 0) {
        console.log(`✅ Found user "${userIdOrName}" -> ${users[0].id}`);
        return users[0].id;
      }
      console.log(`⚠️ User "${userIdOrName}" not found`);
      return undefined;
    };

    if (action === 'create_program') {
      const { name, description, weeks, user_id: rawUserId, training_dates } = body as CreateProgramRequest;
      
      // Resolve user_id αν δόθηκε
      const user_id = await resolveUserId(rawUserId);

      // 1. Δημιουργία του προγράμματος
      const programResponse = await fetch(`${SUPABASE_URL}/rest/v1/programs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name,
          description: description || '',
          status: 'draft',
          type: 'strength',
          duration: weeks?.length || 1,
          training_days: weeks?.[0]?.days?.length || 1
        })
      });

      if (!programResponse.ok) {
        const error = await programResponse.text();
        console.error('❌ Error creating program:', error);
        throw new Error('Σφάλμα δημιουργίας προγράμματος');
      }

      const [savedProgram] = await programResponse.json();
      console.log('✅ Program created:', savedProgram.id);

      // 2. Δημιουργία δομής (weeks, days, blocks, exercises)
      if (weeks && weeks.length > 0) {
        for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
          const week = weeks[weekIndex];
          
          // Create week
          const weekResponse = await fetch(`${SUPABASE_URL}/rest/v1/program_weeks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              program_id: savedProgram.id,
              name: week.name || `Εβδομάδα ${weekIndex + 1}`,
              week_number: weekIndex + 1
            })
          });

          if (!weekResponse.ok) {
            console.error('❌ Error creating week:', await weekResponse.text());
            continue;
          }

          const [savedWeek] = await weekResponse.json();
          console.log('✅ Week created:', savedWeek.id);

          // Create days
          if (week.days && week.days.length > 0) {
            for (let dayIndex = 0; dayIndex < week.days.length; dayIndex++) {
              const day = week.days[dayIndex];

              const dayResponse = await fetch(`${SUPABASE_URL}/rest/v1/program_days`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': SUPABASE_SERVICE_ROLE_KEY,
                  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                  week_id: savedWeek.id,
                  name: day.name || `Ημέρα ${dayIndex + 1}`,
                  day_number: dayIndex + 1,
                  estimated_duration_minutes: 60
                })
              });

              if (!dayResponse.ok) {
                console.error('❌ Error creating day:', await dayResponse.text());
                continue;
              }

              const [savedDay] = await dayResponse.json();
              console.log('✅ Day created:', savedDay.id);

              // Create blocks
              if (day.blocks && day.blocks.length > 0) {
                for (let blockIndex = 0; blockIndex < day.blocks.length; blockIndex++) {
                  const block = day.blocks[blockIndex];

                  const blockResponse = await fetch(`${SUPABASE_URL}/rest/v1/program_blocks`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'apikey': SUPABASE_SERVICE_ROLE_KEY,
                      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                      'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                      day_id: savedDay.id,
                      name: block.name || `Block ${blockIndex + 1}`,
                      block_order: blockIndex + 1,
                      training_type: block.training_type || null
                    })
                  });

                  if (!blockResponse.ok) {
                    console.error('❌ Error creating block:', await blockResponse.text());
                    continue;
                  }

                  const [savedBlock] = await blockResponse.json();
                  console.log('✅ Block created:', savedBlock.id);

                  // Create exercises
                  if (block.exercises && block.exercises.length > 0) {
                    for (let exIndex = 0; exIndex < block.exercises.length; exIndex++) {
                      const exercise = block.exercises[exIndex];

                      // Βρίσκουμε το exercise_id από το όνομα
                      let exerciseId = exercise.exercise_id;
                      if (!exerciseId && exercise.exercise_name) {
                        const searchResponse = await fetch(
                          `${SUPABASE_URL}/rest/v1/exercises?name=ilike.*${encodeURIComponent(exercise.exercise_name)}*&limit=1`,
                          {
                            headers: {
                              'apikey': SUPABASE_SERVICE_ROLE_KEY,
                              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                            }
                          }
                        );
                        const exercises = await searchResponse.json();
                        if (exercises && exercises.length > 0) {
                          exerciseId = exercises[0].id;
                          console.log(`✅ Found exercise "${exercise.exercise_name}" -> ${exerciseId}`);
                        } else {
                          console.log(`⚠️ Exercise "${exercise.exercise_name}" not found, skipping`);
                          continue;
                        }
                      }

                      if (!exerciseId) continue;

                      const exerciseResponse = await fetch(`${SUPABASE_URL}/rest/v1/program_exercises`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'apikey': SUPABASE_SERVICE_ROLE_KEY,
                          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                          'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                          block_id: savedBlock.id,
                          exercise_id: exerciseId,
                          sets: exercise.sets || 3,
                          reps: exercise.reps || '10',
                          kg: exercise.kg || '',
                          tempo: exercise.tempo || '',
                          rest: exercise.rest || '60',
                          notes: exercise.notes || '',
                          exercise_order: exIndex + 1
                        })
                      });

                      if (!exerciseResponse.ok) {
                        console.error('❌ Error creating exercise:', await exerciseResponse.text());
                      } else {
                        console.log('✅ Exercise created');
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      // 3. Αν δόθηκε user_id και training_dates, κάνουμε ανάθεση
      let assignment = null;
      if (user_id && training_dates && training_dates.length > 0) {
        const sortedDates = [...training_dates].sort();
        const assignmentResponse = await fetch(`${SUPABASE_URL}/rest/v1/program_assignments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            program_id: savedProgram.id,
            user_id,
            training_dates,
            status: 'active',
            assignment_type: 'individual',
            is_group_assignment: false,
            start_date: sortedDates[0],
            end_date: sortedDates[sortedDates.length - 1]
          })
        });

        if (assignmentResponse.ok) {
          [assignment] = await assignmentResponse.json();
          console.log('✅ Program assigned:', assignment.id);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          program: savedProgram,
          assignment,
          message: assignment 
            ? `Το πρόγραμμα "${name}" δημιουργήθηκε και ανατέθηκε επιτυχώς!`
            : `Το πρόγραμμα "${name}" δημιουργήθηκε επιτυχώς!`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === 'assign_program') {
      const { program_id, user_id, training_dates } = body as AssignProgramRequest;

      if (!program_id || !user_id || !training_dates || training_dates.length === 0) {
        throw new Error('Λείπουν απαραίτητα πεδία για την ανάθεση');
      }

      const sortedDates = [...training_dates].sort();
      const assignmentResponse = await fetch(`${SUPABASE_URL}/rest/v1/program_assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          program_id,
          user_id,
          training_dates,
          status: 'active',
          assignment_type: 'individual',
          is_group_assignment: false,
          start_date: sortedDates[0],
          end_date: sortedDates[sortedDates.length - 1]
        })
      });

      if (!assignmentResponse.ok) {
        const error = await assignmentResponse.text();
        console.error('❌ Error assigning program:', error);
        throw new Error('Σφάλμα ανάθεσης προγράμματος');
      }

      const [assignment] = await assignmentResponse.json();
      console.log('✅ Program assigned:', assignment.id);

      return new Response(
        JSON.stringify({
          success: true,
          assignment,
          message: 'Το πρόγραμμα ανατέθηκε επιτυχώς!'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      throw new Error(`Άγνωστη ενέργεια: ${action}`);
    }

  } catch (error) {
    console.error("AI Program Action error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
