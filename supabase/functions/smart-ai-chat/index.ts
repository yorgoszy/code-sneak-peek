
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

    // Συλλογή όλων των δεδομένων του χρήστη με βελτιωμένες queries
    const userData = await collectUserData(supabase, userId);
    
    // Φόρτωση ιστορικού συνομιλίας
    const conversationHistory = await getConversationHistory(supabase, userId);
    
    // Φόρτωση γενικής γνώσης AI
    const globalKnowledge = await getGlobalKnowledge(supabase);

    // Δημιουργία εξατομικευμένου system prompt
    const systemPrompt = createPersonalizedPrompt(userData, globalKnowledge);

    // Καλώντας το OpenAI API
    const aiResponse = await callOpenAI(systemPrompt, conversationHistory, message);

    // Αποθήκευση συνομιλίας
    await saveConversation(supabase, userId, message, aiResponse);

    // Ανάλυση και ενημέρωση AI προφίλ
    await updateAIProfile(supabase, userId, message, aiResponse);

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

async function collectUserData(supabase: any, userId: string) {
  console.log('📊 Collecting comprehensive user data for:', userId);

  try {
    // Βασικά στοιχεία χρήστη
    const { data: user } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('👤 User basic info loaded:', user?.name);

    // Τελευταία σωματομετρικά δεδομένα - ΔΙΟΡΘΩΜΕΝΟ QUERY
    const { data: latestAnthropometric, error: anthroError } = await supabase
      .from('test_sessions')
      .select(`
        test_date,
        anthropometric_test_data (*)
      `)
      .eq('user_id', userId)
      .contains('test_types', ['Σωματομετρικά'])
      .order('test_date', { ascending: false })
      .limit(1);

    if (anthroError) {
      console.error('❌ Error fetching anthropometric data:', anthroError);
    } else {
      console.log('📊 Anthropometric data loaded:', latestAnthropometric?.length || 0, 'sessions');
    }

    // Ενεργά προγράμματα - ΒΕΛΤΙΩΜΕΝΟ QUERY
    const { data: activePrograms, error: programsError } = await supabase
      .from('program_assignments')
      .select(`
        *,
        programs (
          name,
          description,
          program_weeks (
            name,
            week_number,
            program_days (
              name,
              day_number,
              program_blocks (
                name,
                program_exercises (
                  sets,
                  reps,
                  kg,
                  tempo,
                  rest,
                  exercises (name, description)
                )
              )
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (programsError) {
      console.error('❌ Error fetching programs:', programsError);
    } else {
      console.log('💪 Active programs loaded:', activePrograms?.length || 0);
    }

    // Τελευταίες ολοκληρώσεις προπονήσεων - ΒΕΛΤΙΩΜΕΝΟ
    const { data: recentWorkouts, error: workoutsError } = await supabase
      .from('workout_completions')
      .select(`
        *,
        exercise_results (
          *,
          program_exercises (
            exercises (name)
          )
        )
      `)
      .eq('user_id', userId)
      .order('completed_date', { ascending: false })
      .limit(10);

    if (workoutsError) {
      console.error('❌ Error fetching workouts:', workoutsError);
    } else {
      console.log('🏃 Recent workouts loaded:', recentWorkouts?.length || 0);
    }

    // Τελευταία τεστ δύναμης - ΒΕΛΤΙΩΜΕΝΟ
    const { data: latestStrength, error: strengthError } = await supabase
      .from('test_sessions')
      .select(`
        test_date,
        strength_test_data (
          exercise_id,
          weight_kg,
          velocity_ms,
          is_1rm,
          exercises (name, description)
        )
      `)
      .eq('user_id', userId)
      .contains('test_types', ['Δύναμη'])
      .order('test_date', { ascending: false })
      .limit(1);

    if (strengthError) {
      console.error('❌ Error fetching strength data:', strengthError);
    } else {
      console.log('💪 Strength tests loaded:', latestStrength?.length || 0, 'sessions');
    }

    // Λειτουργικά τεστ
    const { data: functionalTests, error: functionalError } = await supabase
      .from('test_sessions')
      .select(`
        test_date,
        functional_test_data (*)
      `)
      .eq('user_id', userId)
      .contains('test_types', ['Λειτουργική'])
      .order('test_date', { ascending: false })
      .limit(3);

    if (functionalError) {
      console.error('❌ Error fetching functional data:', functionalError);
    } else {
      console.log('🧘 Functional tests loaded:', functionalTests?.length || 0, 'sessions');
    }

    // Jump τεστ
    const { data: jumpTests, error: jumpError } = await supabase
      .from('test_sessions')
      .select(`
        test_date,
        jump_test_data (*)
      `)
      .eq('user_id', userId)
      .contains('test_types', ['Jump'])
      .order('test_date', { ascending: false })
      .limit(3);

    if (jumpError) {
      console.error('❌ Error fetching jump data:', jumpError);
    } else {
      console.log('🦘 Jump tests loaded:', jumpTests?.length || 0, 'sessions');
    }

    // Endurance τεστ
    const { data: enduranceTests, error: enduranceError } = await supabase
      .from('test_sessions')
      .select(`
        test_date,
        endurance_test_data (*)
      `)
      .eq('user_id', userId)
      .contains('test_types', ['Αντοχή'])
      .order('test_date', { ascending: false })
      .limit(3);

    if (enduranceError) {
      console.error('❌ Error fetching endurance data:', enduranceError);
    } else {
      console.log('🏃‍♂️ Endurance tests loaded:', enduranceTests?.length || 0, 'sessions');
    }

    // AI προφίλ χρήστη
    const { data: aiProfile, error: aiProfileError } = await supabase
      .from('ai_user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (aiProfileError && aiProfileError.code !== 'PGRST116') {
      console.error('❌ Error fetching AI profile:', aiProfileError);
    } else {
      console.log('🧠 AI profile loaded:', aiProfile ? 'exists' : 'not found');
    }

    console.log('✅ User data collection completed successfully');

    return {
      user,
      anthropometric: latestAnthropometric?.[0]?.anthropometric_test_data?.[0],
      activePrograms: activePrograms || [],
      recentWorkouts: recentWorkouts || [],
      strengthTests: latestStrength?.[0]?.strength_test_data || [],
      functionalTests: functionalTests || [],
      jumpTests: jumpTests || [],
      enduranceTests: enduranceTests || [],
      aiProfile
    };

  } catch (error) {
    console.error('💥 Error in collectUserData:', error);
    return {
      user: null,
      anthropometric: null,
      activePrograms: [],
      recentWorkouts: [],
      strengthTests: [],
      functionalTests: [],
      jumpTests: [],
      enduranceTests: [],
      aiProfile: null
    };
  }
}

async function getConversationHistory(supabase: any, userId: string) {
  const { data: history } = await supabase
    .from('ai_conversations')
    .select('message_type, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(20);

  return history || [];
}

async function getGlobalKnowledge(supabase: any) {
  const { data: knowledge } = await supabase
    .from('ai_global_knowledge')
    .select('*')
    .order('confidence_score', { ascending: false })
    .limit(50);

  return knowledge || [];
}

function createPersonalizedPrompt(userData: any, globalKnowledge: any[]) {
  const { user, anthropometric, activePrograms, recentWorkouts, strengthTests, functionalTests, jumpTests, enduranceTests, aiProfile } = userData;

  let prompt = `Είσαι ο RID, ένας εξειδικευμένος AI προπονητής για τον αθλητή ${user?.name}. Έχεις πρόσβαση σε όλα τα δεδομένα του και μαθαίνεις από κάθε αλληλεπίδραση.

**ΤΑΥΤΟΤΗΤΑ:**
- Όνομα: RID (Rapid Intelligent Development)
- Ρόλος: Προσωπικός AI προπονητής και διατροφολόγος
- Χαρακτήρας: Φιλικός, εξειδικευμένος, επιστημονικός αλλά προσιτός

ΣΤΟΙΧΕΙΑ ΑΘΛΗΤΗ:
`;

  // Βασικά στοιχεία
  if (user) {
    prompt += `- Όνομα: ${user.name}\n`;
    prompt += `- Email: ${user.email}\n`;
    if (user.birth_date) {
      const age = new Date().getFullYear() - new Date(user.birth_date).getFullYear();
      prompt += `- Ηλικία: ${age} χρόνια\n`;
    }
  }

  // Σωματομετρικά δεδομένα
  if (anthropometric) {
    prompt += `\nΣΩΜΑΤΟΜΕΤΡΙΚΑ ΣΤΟΙΧΕΙΑ (τελευταία μέτρηση):\n`;
    if (anthropometric.height) prompt += `- Ύψος: ${anthropometric.height} cm\n`;
    if (anthropometric.weight) prompt += `- Βάρος: ${anthropometric.weight} kg\n`;
    if (anthropometric.body_fat_percentage) prompt += `- Λίπος: ${anthropometric.body_fat_percentage}%\n`;
    if (anthropometric.muscle_mass_percentage) prompt += `- Μυϊκή μάζα: ${anthropometric.muscle_mass_percentage}%\n`;
    
    // Υπολογισμός BMI
    if (anthropometric.height && anthropometric.weight) {
      const bmi = (anthropometric.weight / ((anthropometric.height / 100) ** 2)).toFixed(1);
      prompt += `- BMI: ${bmi}\n`;
    }
  }

  // Ενεργά προγράμματα
  if (activePrograms && activePrograms.length > 0) {
    prompt += `\nΕΝΕΡΓΑ ΠΡΟΓΡΑΜΜΑΤΑ:\n`;
    activePrograms.forEach((assignment: any) => {
      if (assignment.programs) {
        prompt += `- ${assignment.programs.name}: ${assignment.status}\n`;
        if (assignment.training_dates) {
          prompt += `  Προπονήσεις: ${assignment.training_dates.length} συνολικά\n`;
        }
        
        // Σημερινό πρόγραμμα
        const today = new Date().toISOString().split('T')[0];
        const todayIndex = assignment.training_dates?.indexOf(today);
        if (todayIndex >= 0 && assignment.programs.program_weeks) {
          const daysPerWeek = assignment.programs.program_weeks[0]?.program_days?.length || 7;
          const dayIndex = todayIndex % daysPerWeek;
          const todayProgram = assignment.programs.program_weeks[0]?.program_days?.[dayIndex];
          if (todayProgram) {
            prompt += `  ΣΗΜΕΡΙΝΟ ΠΡΟΓΡΑΜΜΑ: ${todayProgram.name}\n`;
            todayProgram.program_blocks?.forEach((block: any) => {
              prompt += `    ${block.name}:\n`;
              block.program_exercises?.forEach((ex: any) => {
                prompt += `      - ${ex.exercises?.name}: ${ex.sets}x${ex.reps || '?'} @ ${ex.kg || '?'}kg\n`;
              });
            });
          }
        }
      }
    });
  }

  // Τελευταίες προπονήσεις
  if (recentWorkouts && recentWorkouts.length > 0) {
    prompt += `\nΤΕΛΕΥΤΑΙΕΣ ΠΡΟΠΟΝΗΣΕΙΣ:\n`;
    recentWorkouts.slice(0, 5).forEach((workout: any) => {
      prompt += `- ${workout.completed_date || workout.scheduled_date}: ${workout.status}`;
      if (workout.actual_duration_minutes) {
        prompt += ` (${workout.actual_duration_minutes} λεπτά)`;
      }
      prompt += `\n`;
    });
  }

  // Δεδομένα δύναμης
  if (strengthTests && strengthTests.length > 0) {
    prompt += `\nΤΕΛΕΥΤΑΙΑ ΤΕΣΤ ΔΥΝΑΜΗΣ:\n`;
    strengthTests.forEach((test: any) => {
      if (test.exercises?.name) {
        prompt += `- ${test.exercises.name}: ${test.weight_kg}kg`;
        if (test.velocity_ms) prompt += ` @ ${test.velocity_ms}m/s`;
        if (test.is_1rm) prompt += ` (1RM)`;
        prompt += `\n`;
      }
    });
  }

  // Λειτουργικά τεστ
  if (functionalTests && functionalTests.length > 0) {
    prompt += `\nΛΕΙΤΟΥΡΓΙΚΑ ΤΕΣΤ:\n`;
    functionalTests.forEach((session: any) => {
      session.functional_test_data?.forEach((test: any) => {
        if (test.fms_score) prompt += `- FMS Score: ${test.fms_score}\n`;
        if (test.sit_and_reach) prompt += `- Sit & Reach: ${test.sit_and_reach} cm\n`;
      });
    });
  }

  // Jump τεστ
  if (jumpTests && jumpTests.length > 0) {
    prompt += `\nJUMP ΤΕΣΤ:\n`;
    jumpTests.forEach((session: any) => {
      session.jump_test_data?.forEach((test: any) => {
        if (test.counter_movement_jump) prompt += `- CMJ: ${test.counter_movement_jump} cm\n`;
        if (test.broad_jump) prompt += `- Broad Jump: ${test.broad_jump} m\n`;
      });
    });
  }

  // Endurance τεστ
  if (enduranceTests && enduranceTests.length > 0) {
    prompt += `\nΤΕΣΤ ΑΝΤΟΧΗΣ:\n`;
    enduranceTests.forEach((session: any) => {
      session.endurance_test_data?.forEach((test: any) => {
        if (test.vo2_max) prompt += `- VO2 Max: ${test.vo2_max}\n`;
        if (test.max_hr) prompt += `- Max HR: ${test.max_hr} bpm\n`;
      });
    });
  }

  // AI προφίλ (στόχοι, προτιμήσεις κτλ)
  if (aiProfile) {
    if (aiProfile.goals && Object.keys(aiProfile.goals).length > 0) {
      prompt += `\nΣΤΟΧΟΙ:\n${JSON.stringify(aiProfile.goals, null, 2)}\n`;
    }
    if (aiProfile.medical_conditions && Object.keys(aiProfile.medical_conditions).length > 0) {
      prompt += `\nΙΑΤΡΙΚΑ ΣΤΟΙΧΕΙΑ:\n${JSON.stringify(aiProfile.medical_conditions, null, 2)}\n`;
    }
    if (aiProfile.dietary_preferences && Object.keys(aiProfile.dietary_preferences).length > 0) {
      prompt += `\nΔΙΑΤΡΟΦΙΚΕΣ ΠΡΟΤΙΜΗΣΕΙΣ:\n${JSON.stringify(aiProfile.dietary_preferences, null, 2)}\n`;
    }
    if (aiProfile.last_nutrition_advice && Object.keys(aiProfile.last_nutrition_advice).length > 0) {
      prompt += `\nΤΕΛΕΥΤΑΙΕΣ ΔΙΑΤΡΟΦΙΚΕΣ ΣΥΜΒΟΥΛΕΣ:\n${JSON.stringify(aiProfile.last_nutrition_advice, null, 2)}\n`;
    }
  }

  // Γενική γνώση που έμαθε το AI
  if (globalKnowledge.length > 0) {
    prompt += `\nΓΝΩΣΗ ΠΟΥ ΕΧΕΙΣ ΜΑΘΕΙ:\n`;
    globalKnowledge.forEach((knowledge: any) => {
      prompt += `- ${knowledge.category}: ${knowledge.corrected_info} (εμπιστοσύνη: ${knowledge.confidence_score})\n`;
    });
  }

  prompt += `\nΟΔΗΓΙΕΣ ΓΙΑ ΤΟΝ RID:
1. Συστήσου πάντα ως "RID" στην αρχή αν είναι νέα συνομιλία
2. Χρησιμοποίησε όλα τα παραπάνω δεδομένα για εξατομικευμένες συμβουλές
3. Θυμήσου τις προηγούμενες συμβουλές και βασίσου σε αυτές
4. Υπολόγισε θερμίδες βάσει των δεδομένων του χρήστη
5. Λάβε υπόψη τους στόχους και τα ιατρικά προβλήματα
6. Αν ο χρήστης σε διορθώσει, θυμήσου τη διόρθωση
7. Δώσε πρακτικές και εφαρμόσιμες συμβουλές
8. Απάντα στα ελληνικά και με φιλικό τόνο
9. Αν δεν έχεις αρκετά δεδομένα, ζήτα περισσότερες πληροφορίες
10. Είσαι ο προσωπικός του προπονητής, διατροφολόγος και σύντροφος στην υγεία!

Χρησιμοποίησε emoji όπου ταιριάζουν για να κάνεις τη συνομιλία πιο ζωντανή! 💪🏃‍♀️🥗`;

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
      model: 'gpt-4-turbo-preview',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500,
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

async function updateAIProfile(supabase: any, userId: string, userMessage: string, aiResponse: string) {
  // Ανάλυση για εξαγωγή πληροφοριών από τη συνομιλία
  const updates: any = {};
  
  // Ανίχνευση στόχων
  const weightLossKeywords = ['αδυνάτισμα', 'χάσω κιλά', 'αδυνατίσω', 'foremata', 'δίαιτα'];
  const muscleGainKeywords = ['όγκος', 'μυϊκή μάζα', 'γυμναστική', 'δύναμη', 'μυς'];
  
  if (weightLossKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
    updates.goals = { primary: 'weight_loss', updated_at: new Date().toISOString() };
  }
  
  if (muscleGainKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
    updates.goals = { primary: 'muscle_gain', updated_at: new Date().toISOString() };
  }

  // Ανίχνευση ιατρικών προβλημάτων
  const medicalKeywords = ['διαβήτης', 'υπέρταση', 'αλλεργία', 'τραυματισμός', 'πόνος'];
  if (medicalKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
    updates.medical_conditions = { 
      detected: userMessage,
      needs_attention: true,
      updated_at: new Date().toISOString()
    };
  }

  // Αποθήκευση διατροφικών συμβουλών
  if (aiResponse.includes('θερμίδες') || aiResponse.includes('διατροφή') || aiResponse.includes('γεύμα')) {
    updates.last_nutrition_advice = {
      content: aiResponse.substring(0, 500),
      date: new Date().toISOString()
    };
  }

  // Ενημέρωση AI προφίλ αν υπάρχουν αλλαγές
  if (Object.keys(updates).length > 0) {
    await supabase
      .from('ai_user_profiles')
      .upsert({
        user_id: userId,
        ...updates
      }, {
        onConflict: 'user_id'
      });
  }
}
