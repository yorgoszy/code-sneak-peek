
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🤖 RID AI Chat request for user:', userId);

    // Έλεγχος συνδρομής πρώτα
    const { data: hasSubscription, error: subscriptionError } = await supabase.rpc('has_active_subscription', { 
      user_uuid: userId 
    });

    if (subscriptionError) {
      console.error('❌ Error checking subscription:', subscriptionError);
      throw new Error('Σφάλμα κατά τον έλεγχο συνδρομής');
    }

    if (!hasSubscription) {
      return new Response(JSON.stringify({ 
        error: 'No active subscription',
        response: 'Λυπάμαι, χρειάζεσαι ενεργή συνδρομή για να έχεις πρόσβαση στον RID AI. Επικοινώνησε με τον διαχειριστή για να ενεργοποιήσεις τη συνδρομή σου.'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Συλλογή όλων των κρίσιμων δεδομένων του χρήστη
    const userData = await collectComprehensiveUserData(supabase, userId);
    
    // Φόρτωση μόνο του πρόσφατου ιστορικού συνομιλίας
    const conversationHistory = await getRecentConversationHistory(supabase, userId);

    // Δημιουργία εξατομικευμένου system prompt
    const systemPrompt = createEnhancedPrompt(userData);

    // Καλώντας το OpenAI API
    const aiResponse = await callOpenAI(systemPrompt, conversationHistory, message);

    // Αποθήκευση συνομιλίας
    await saveConversation(supabase, userId, message, aiResponse);

    console.log('✅ RID AI response generated successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ RID AI Chat Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'Λυπάμαι, αντιμετωπίζω τεχνικά προβλήματα. Παρακαλώ δοκιμάστε ξανά.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function collectComprehensiveUserData(supabase: any, userId: string) {
  console.log('📊 Collecting comprehensive user data for:', userId);

  try {
    // Βασικά στοιχεία χρήστη
    const { data: user } = await supabase
      .from('app_users')
      .select('id, name, email, birth_date, category, subscription_status')
      .eq('id', userId)
      .single();

    console.log('👤 User basic info loaded:', user?.name);

    // **1. PROGRAM CARDS DATA - Ενεργά προγράμματα με λεπτομέρειες**
    const { data: programCards } = await supabase
      .from('program_assignments')
      .select(`
        id, status, training_dates, start_date, end_date, notes,
        programs!fk_program_assignments_program_id (
          id, name, description, type, duration,
          program_weeks!fk_program_weeks_program_id (
            id, name, week_number,
            program_days!fk_program_days_week_id (
              id, name, day_number, estimated_duration_minutes,
              program_blocks!fk_program_blocks_day_id (
                id, name, block_order,
                program_exercises!fk_program_exercises_block_id (
                  id, sets, reps, kg, percentage_1rm, velocity_ms, tempo, rest, notes, exercise_order,
                  exercises!fk_program_exercises_exercise_id (
                    id, name, description, video_url
                  )
                )
              )
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(5);

    console.log('💪 Program cards loaded:', programCards?.length || 0);

    // **2. DAY PROGRAM DATA - Πρόσφατες προπονήσεις με αποτελέσματα**
    const { data: workoutCompletions } = await supabase
      .from('workout_completions')
      .select(`
        id, scheduled_date, completed_date, status, actual_duration_minutes, notes,
        start_time, end_time, week_number, day_number,
        exercise_results!fk_exercise_results_workout_completion_id (
          id, actual_sets, actual_reps, actual_kg, actual_velocity_ms, actual_rest, notes,
          program_exercises!fk_exercise_results_program_exercise_id (
            sets, reps, kg, percentage_1rm, velocity_ms, tempo, rest,
            exercises!fk_program_exercises_exercise_id (name)
          )
        )
      `)
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: false })
      .limit(10);

    console.log('🏃 Workout completions loaded:', workoutCompletions?.length || 0);

    // **3. TESTS DATA - Όλα τα τεστ με αποτελέσματα**
    
    // Τελευταία σωματομετρικά δεδομένα
    const { data: latestAnthropometric } = await supabase
      .from('test_sessions')
      .select(`
        id, test_date, test_types, notes,
        anthropometric_test_data!fk_anthropometric_test_data_session (
          height, weight, body_fat_percentage, muscle_mass_percentage,
          waist_circumference, hip_circumference, chest_circumference,
          arm_circumference, thigh_circumference
        )
      `)
      .eq('user_id', userId)
      .contains('test_types', ['Σωματομετρικά'])
      .order('test_date', { ascending: false })
      .limit(3);

    console.log('📊 Anthropometric tests loaded:', latestAnthropometric?.length || 0);

    // Τεστ δύναμης
    const { data: strengthTests } = await supabase
      .from('strength_test_sessions')
      .select(`
        id, test_date, notes,
        strength_test_data!fk_strength_test_data_session (
          exercise_id, weight_kg, velocity_ms, is_1rm, attempt_number, notes,
          exercises!fk_strength_test_data_exercise (name, description)
        )
      `)
      .eq('user_id', userId)
      .order('test_date', { ascending: false })
      .limit(5);

    console.log('💪 Strength tests loaded:', strengthTests?.length || 0);

    // Τεστ αντοχής
    const { data: enduranceTests } = await supabase
      .from('endurance_test_sessions')
      .select(`
        id, test_date, notes,
        endurance_test_data!fk_endurance_test_data_session (
          push_ups, pull_ups, crunches, farmer_kg, farmer_meters, farmer_seconds,
          sprint_seconds, sprint_meters, sprint_watt, sprint_resistance,
          mas_meters, mas_minutes, mas_ms, mas_kmh, max_hr, resting_hr_1min, vo2_max
        )
      `)
      .eq('user_id', userId)
      .order('test_date', { ascending: false })
      .limit(3);

    console.log('🏃 Endurance tests loaded:', enduranceTests?.length || 0);

    // Τεστ αλμάτων
    const { data: jumpTests } = await supabase
      .from('jump_test_sessions')
      .select(`
        id, test_date, notes,
        jump_test_data!fk_jump_test_data_session (
          non_counter_movement_jump, counter_movement_jump, depth_jump,
          broad_jump, triple_jump_left, triple_jump_right
        )
      `)
      .eq('user_id', userId)
      .order('test_date', { ascending: false })
      .limit(3);

    console.log('🦘 Jump tests loaded:', jumpTests?.length || 0);

    // Λειτουργικά τεστ
    const { data: functionalTests } = await supabase
      .from('functional_test_sessions')
      .select(`
        id, test_date, notes,
        functional_test_data!fk_functional_test_data_session (
          fms_score, sit_and_reach, shoulder_mobility_left, shoulder_mobility_right,
          flamingo_balance, fms_detailed_scores, posture_assessment,
          muscles_need_stretching, muscles_need_strengthening,
          posture_issues, squat_issues, single_leg_squat_issues
        )
      `)
      .eq('user_id', userId)
      .order('test_date', { ascending: false })
      .limit(3);

    console.log('🧘 Functional tests loaded:', functionalTests?.length || 0);

    // AI προφίλ χρήστη
    const { data: aiProfile } = await supabase
      .from('ai_user_profiles')
      .select('goals, medical_conditions, dietary_preferences, habits, preferences, learned_corrections, last_nutrition_advice')
      .eq('user_id', userId)
      .single();

    console.log('🧠 AI profile loaded:', aiProfile ? 'exists' : 'not found');

    console.log('✅ Comprehensive user data collection completed');

    return {
      user,
      programCards: programCards || [],
      workoutCompletions: workoutCompletions || [],
      anthropometricTests: latestAnthropometric || [],
      strengthTests: strengthTests || [],
      enduranceTests: enduranceTests || [],
      jumpTests: jumpTests || [],
      functionalTests: functionalTests || [],
      aiProfile
    };

  } catch (error) {
    console.error('💥 Error in collectComprehensiveUserData:', error);
    return {
      user: null,
      programCards: [],
      workoutCompletions: [],
      anthropometricTests: [],
      strengthTests: [],
      enduranceTests: [],
      jumpTests: [],
      functionalTests: [],
      aiProfile: null
    };
  }
}

async function getRecentConversationHistory(supabase: any, userId: string) {
  const { data: history } = await supabase
    .from('ai_conversations')
    .select('message_type, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(10); // Μόνο τα 10 πιο πρόσφατα μηνύματα

  return history || [];
}

function createEnhancedPrompt(userData: any) {
  const { 
    user, 
    programCards, 
    workoutCompletions, 
    anthropometricTests, 
    strengthTests, 
    enduranceTests, 
    jumpTests, 
    functionalTests, 
    aiProfile 
  } = userData;

  let prompt = `Είσαι ο RID, ένας εξειδικευμένος AI προπονητής για τον αθλητή ${user?.name}. Έχεις πρόσβαση σε ΟΛΟΚΛΗΡΗ τη βάση δεδομένων του αθλητή.

**ΤΑΥΤΟΤΗΤΑ:**
- Όνομα: RID (Rapid Intelligent Development)
- Ρόλος: Προσωπικός AI προπονητής, διατροφολόγος και συμβουλος υγείας
- Χαρακτήρας: Εξειδικευμένος, επιστημονικός, προσωπικός, φιλικός

**ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ ΑΘΛΗΤΗ:**
`;

  // Βασικά στοιχεία
  if (user) {
    prompt += `- Όνομα: ${user.name}\n`;
    if (user.birth_date) {
      const age = new Date().getFullYear() - new Date(user.birth_date).getFullYear();
      prompt += `- Ηλικία: ${age} χρόνια\n`;
    }
    if (user.category) prompt += `- Κατηγορία: ${user.category}\n`;
    if (user.subscription_status) prompt += `- Συνδρομή: ${user.subscription_status}\n`;
  }

  // **PROGRAM CARDS ANALYSIS**
  if (programCards && programCards.length > 0) {
    prompt += `\n**ΕΝΕΡΓΑ ΠΡΟΓΡΑΜΜΑΤΑ (PROGRAM CARDS):**\n`;
    programCards.forEach((assignment: any, index: number) => {
      if (assignment.programs) {
        const program = assignment.programs;
        prompt += `\n${index + 1}. **${program.name}**\n`;
        if (program.description) prompt += `   Περιγραφή: ${program.description}\n`;
        if (program.type) prompt += `   Τύπος: ${program.type}\n`;
        if (assignment.training_dates) {
          prompt += `   Προπονήσεις: ${assignment.training_dates.length} συνολικά\n`;
          prompt += `   Από: ${assignment.start_date} Έως: ${assignment.end_date}\n`;
        }
        
        // Ανάλυση εβδομάδων και ημερών
        if (program.program_weeks && program.program_weeks.length > 0) {
          prompt += `   Εβδομάδες: ${program.program_weeks.length}\n`;
          
          let totalExercises = 0;
          let totalVolume = 0;
          
          program.program_weeks.forEach((week: any) => {
            if (week.program_days) {
              week.program_days.forEach((day: any) => {
                if (day.estimated_duration_minutes) {
                  prompt += `     - ${day.name}: ${day.estimated_duration_minutes} λεπτά\n`;
                }
                if (day.program_blocks) {
                  day.program_blocks.forEach((block: any) => {
                    if (block.program_exercises) {
                      totalExercises += block.program_exercises.length;
                      block.program_exercises.forEach((exercise: any) => {
                        if (exercise.sets && exercise.reps && exercise.kg) {
                          const volume = parseInt(exercise.sets) * parseInt(exercise.reps) * parseFloat(exercise.kg || '0');
                          totalVolume += volume;
                        }
                      });
                    }
                  });
                }
              });
            }
          });
          
          prompt += `   Σύνολο ασκήσεων: ${totalExercises}\n`;
          if (totalVolume > 0) {
            prompt += `   Εκτιμώμενος όγκος: ${(totalVolume / 1000).toFixed(1)} τόνοι\n`;
          }
        }
      }
    });
  }

  // **DAY PROGRAM ANALYSIS**
  if (workoutCompletions && workoutCompletions.length > 0) {
    prompt += `\n**ΑΝΑΛΥΣΗ ΠΡΟΠΟΝΗΣΕΩΝ (DAY PROGRAMS):**\n`;
    
    const completedWorkouts = workoutCompletions.filter(w => w.status === 'completed');
    const missedWorkouts = workoutCompletions.filter(w => w.status === 'missed');
    
    prompt += `- Ολοκληρωμένες: ${completedWorkouts.length}/${workoutCompletions.length}\n`;
    if (missedWorkouts.length > 0) {
      prompt += `- Χαμένες: ${missedWorkouts.length}\n`;
    }
    
    // Ανάλυση πρόσφατων προπονήσεων
    const recentWorkouts = workoutCompletions.slice(0, 5);
    prompt += `\nΠΡΟΣΦΑΤΕΣ ΠΡΟΠΟΝΗΣΕΙΣ:\n`;
    
    recentWorkouts.forEach((workout: any) => {
      prompt += `- ${workout.scheduled_date}: ${workout.status}`;
      if (workout.actual_duration_minutes) {
        prompt += ` (${workout.actual_duration_minutes} λεπτά)`;
      }
      if (workout.notes) {
        prompt += ` - ${workout.notes}`;
      }
      prompt += `\n`;
      
      // Ανάλυση exercise results
      if (workout.exercise_results && workout.exercise_results.length > 0) {
        workout.exercise_results.forEach((result: any) => {
          if (result.program_exercises?.exercises?.name) {
            prompt += `  └ ${result.program_exercises.exercises.name}: `;
            if (result.actual_sets) prompt += `${result.actual_sets} sets `;
            if (result.actual_reps) prompt += `${result.actual_reps} reps `;
            if (result.actual_kg) prompt += `${result.actual_kg}kg `;
            if (result.actual_velocity_ms) prompt += `${result.actual_velocity_ms}m/s`;
            prompt += `\n`;
          }
        });
      }
    });
  }

  // **COMPREHENSIVE TESTS ANALYSIS**
  
  // Σωματομετρικά τεστ
  if (anthropometricTests && anthropometricTests.length > 0) {
    prompt += `\n**ΣΩΜΑΤΟΜΕΤΡΙΚΑ ΤΕΣΤ:**\n`;
    const latestAnthro = anthropometricTests[0]?.anthropometric_test_data?.[0];
    if (latestAnthro) {
      prompt += `Τελευταία μέτρηση (${anthropometricTests[0].test_date}):\n`;
      if (latestAnthro.height && latestAnthro.weight) {
        const bmi = (latestAnthro.weight / ((latestAnthro.height / 100) ** 2)).toFixed(1);
        prompt += `- Ύψος: ${latestAnthro.height}cm, Βάρος: ${latestAnthro.weight}kg (BMI: ${bmi})\n`;
      }
      if (latestAnthro.body_fat_percentage) prompt += `- Λίπος: ${latestAnthro.body_fat_percentage}%\n`;
      if (latestAnthro.muscle_mass_percentage) prompt += `- Μυϊκή μάζα: ${latestAnthro.muscle_mass_percentage}%\n`;
      if (latestAnthro.waist_circumference) prompt += `- Μέση: ${latestAnthro.waist_circumference}cm\n`;
      if (latestAnthro.chest_circumference) prompt += `- Στήθος: ${latestAnthro.chest_circumference}cm\n`;
    }
  }

  // Τεστ δύναμης
  if (strengthTests && strengthTests.length > 0) {
    prompt += `\n**ΤΕΣΤ ΔΥΝΑΜΗΣ:**\n`;
    strengthTests.forEach((session: any) => {
      if (session.strength_test_data && session.strength_test_data.length > 0) {
        prompt += `${session.test_date}:\n`;
        session.strength_test_data.forEach((test: any) => {
          if (test.exercises?.name) {
            prompt += `- ${test.exercises.name}: ${test.weight_kg}kg`;
            if (test.velocity_ms) prompt += ` (${test.velocity_ms}m/s)`;
            if (test.is_1rm) prompt += ` [1RM]`;
            prompt += `\n`;
          }
        });
      }
    });
  }

  // Τεστ αντοχής
  if (enduranceTests && enduranceTests.length > 0) {
    prompt += `\n**ΤΕΣΤ ΑΝΤΟΧΗΣ:**\n`;
    const latestEndurance = enduranceTests[0]?.endurance_test_data?.[0];
    if (latestEndurance) {
      prompt += `Τελευταία μέτρηση (${enduranceTests[0].test_date}):\n`;
      if (latestEndurance.vo2_max) prompt += `- VO2 Max: ${latestEndurance.vo2_max} ml/kg/min\n`;
      if (latestEndurance.max_hr) prompt += `- Μέγιστος παλμός: ${latestEndurance.max_hr} bpm\n`;
      if (latestEndurance.resting_hr_1min) prompt += `- Παλμός ηρεμίας: ${latestEndurance.resting_hr_1min} bpm\n`;
      if (latestEndurance.push_ups) prompt += `- Push-ups: ${latestEndurance.push_ups}\n`;
      if (latestEndurance.pull_ups) prompt += `- Pull-ups: ${latestEndurance.pull_ups}\n`;
      if (latestEndurance.mas_kmh) prompt += `- MAS: ${latestEndurance.mas_kmh} km/h\n`;
    }
  }

  // Τεστ αλμάτων
  if (jumpTests && jumpTests.length > 0) {
    prompt += `\n**ΤΕΣΤ ΑΛΜΑΤΩΝ:**\n`;
    const latestJump = jumpTests[0]?.jump_test_data?.[0];
    if (latestJump) {
      prompt += `Τελευταία μέτρηση (${jumpTests[0].test_date}):\n`;
      if (latestJump.counter_movement_jump) prompt += `- CMJ: ${latestJump.counter_movement_jump}cm\n`;
      if (latestJump.non_counter_movement_jump) prompt += `- SJ: ${latestJump.non_counter_movement_jump}cm\n`;
      if (latestJump.broad_jump) prompt += `- Άλμα εις μήκος: ${latestJump.broad_jump}cm\n`;
      if (latestJump.triple_jump_left || latestJump.triple_jump_right) {
        prompt += `- Τριπλό άλμα: Α: ${latestJump.triple_jump_left || 'N/A'}cm, Δ: ${latestJump.triple_jump_right || 'N/A'}cm\n`;
      }
    }
  }

  // Λειτουργικά τεστ
  if (functionalTests && functionalTests.length > 0) {
    prompt += `\n**ΛΕΙΤΟΥΡΓΙΚΑ ΤΕΣΤ:**\n`;
    const latestFunctional = functionalTests[0]?.functional_test_data?.[0];
    if (latestFunctional) {
      prompt += `Τελευταία μέτρηση (${functionalTests[0].test_date}):\n`;
      if (latestFunctional.fms_score) prompt += `- FMS Score: ${latestFunctional.fms_score}/21\n`;
      if (latestFunctional.sit_and_reach) prompt += `- Sit & Reach: ${latestFunctional.sit_and_reach}cm\n`;
      if (latestFunctional.flamingo_balance) prompt += `- Ισορροπία: ${latestFunctional.flamingo_balance}s\n`;
      if (latestFunctional.posture_assessment) prompt += `- Στάση σώματος: ${latestFunctional.posture_assessment}\n`;
      if (latestFunctional.muscles_need_stretching && latestFunctional.muscles_need_stretching.length > 0) {
        prompt += `- Μύες για stretching: ${latestFunctional.muscles_need_stretching.join(', ')}\n`;
      }
      if (latestFunctional.muscles_need_strengthening && latestFunctional.muscles_need_strengthening.length > 0) {
        prompt += `- Μύες για ενδυνάμωση: ${latestFunctional.muscles_need_strengthening.join(', ')}\n`;
      }
    }
  }

  // AI προφίλ (στόχοι, προτιμήσεις κτλ)
  if (aiProfile) {
    if (aiProfile.goals && Object.keys(aiProfile.goals).length > 0) {
      prompt += `\n**ΣΤΟΧΟΙ:** ${JSON.stringify(aiProfile.goals)}\n`;
    }
    if (aiProfile.medical_conditions && Object.keys(aiProfile.medical_conditions).length > 0) {
      prompt += `**ΙΑΤΡΙΚΑ ΣΤΟΙΧΕΙΑ:** ${JSON.stringify(aiProfile.medical_conditions)}\n`;
    }
    if (aiProfile.dietary_preferences && Object.keys(aiProfile.dietary_preferences).length > 0) {
      prompt += `**ΔΙΑΤΡΟΦΙΚΕΣ ΠΡΟΤΙΜΗΣΕΙΣ:** ${JSON.stringify(aiProfile.dietary_preferences)}\n`;
    }
    if (aiProfile.habits && Object.keys(aiProfile.habits).length > 0) {
      prompt += `**ΣΥΝΗΘΕΙΕΣ:** ${JSON.stringify(aiProfile.habits)}\n`;
    }
  }

  prompt += `\n**ΟΔΗΓΙΕΣ ΓΙΑ ΤΟΝ RID:**

**ΒΑΣΙΚΟΙ ΚΑΝΟΝΕΣ:**
1. Συστήσου πάντα ως "RID" στην αρχή αν είναι νέα συνομιλία
2. Χρησιμοποίησε ΟΛΕΣ τις παραπάνω πληροφορίες για εξατομικευμένες συμβουλές
3. Αναφέρεσαι συγκεκριμένα στα προγράμματα, τεστ και προπονήσεις του αθλητή
4. Θυμήσου τις προηγούμενες συμβουλές και βασίσου σε αυτές
5. Υπολόγισε θερμίδες βάσει των σωματομετρικών δεδομένων
6. Λάβε υπόψη τους στόχους και τα ιατρικά προβλήματα
7. Αν ο χρήστης σε διορθώσει, θυμήσου τη διόρθωση

**ΕΞΕΙΔΙΚΕΥΜΕΝΕΣ ΣΥΜΒΟΥΛΕΣ:**
- Αναλύε την πρόοδο βάσει των τεστ (πριν/μετά συγκρίσεις)
- Προτείνε τροποποιήσεις στα προγράμματα βάσει των αποτελεσμάτων
- Εντόπισε αδυναμίες από τα λειτουργικά τεστ
- Παρακολούθησε την ανάκαμψη από τις προπονήσεις
- Συμβούλευσε για διατροφή βάσει των στόχων και δραστηριότητας
- Δώσε συγκεκριμένες ασκήσεις βάσει των αναγκών

**ΣΤΥΛ ΕΠΙΚΟΙΝΩΝΙΑΣ:**
- Απάντα στα ελληνικά με φιλικό τόνο
- Χρησιμοποίησε emoji όπου ταιριάζουν 💪🏃‍♀️🥗
- Είσαι ο προσωπικός του προπονητής, διατροφολόγος και σύντροφος στην υγεία!
- Αν δεν έχεις αρκετά δεδομένα, ζήτα περισσότερες πληροφορίες
- Δώσε πρακτικές και εφαρμόσιμες συμβουλές

**ΣΗΜΑΝΤΙΚΟ:** Έχεις πρόσβαση σε ΠΛΗΡΗ ΕΙΚΟΝΑ του αθλητή - χρησιμοποίησε όλα τα δεδομένα!`;

  return prompt;
}

async function callOpenAI(systemPrompt: string, conversationHistory: any[], message: string) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map((msg: any) => ({
      role: msg.message_type === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    { role: 'user', content: message }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500, // Αυξημένο όριο για πιο λεπτομερείς απαντήσεις
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function saveConversation(supabase: any, userId: string, userMessage: string, aiResponse: string) {
  // Αποθήκευση μηνύματος χρήστη
  await supabase
    .from('ai_conversations')
    .insert({
      user_id: userId,
      message_type: 'user',
      content: userMessage
    });

  // Αποθήκευση απάντησης AI
  await supabase
    .from('ai_conversations')
    .insert({
      user_id: userId,
      message_type: 'assistant',
      content: aiResponse
    });
}
