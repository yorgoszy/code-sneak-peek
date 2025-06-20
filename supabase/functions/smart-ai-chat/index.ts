
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

    console.log('🤖 Smart AI Chat request for user:', userId);

    // Συλλογή όλων των δεδομένων του χρήστη
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

    console.log('✅ Smart AI response generated successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Smart AI Chat Error:', error);
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
  console.log('📊 Collecting user data for:', userId);

  // Βασικά στοιχεία χρήστη
  const { data: user } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', userId)
    .single();

  // Τελευταία σωματομετρικά δεδομένα
  const { data: latestAnthropometric } = await supabase
    .from('test_sessions')
    .select(`
      test_date,
      anthropometric_test_data (*)
    `)
    .eq('user_id', userId)
    .contains('test_types', ['Σωματομετρικά'])
    .order('test_date', { ascending: false })
    .limit(1)
    .single();

  // Ενεργά προγράμματα
  const { data: activePrograms } = await supabase
    .from('program_assignments')
    .select(`
      *,
      programs (
        name,
        description,
        program_weeks (
          program_days (
            name,
            program_blocks (
              program_exercises (
                sets,
                reps,
                kg,
                exercises (name)
              )
            )
          )
        )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  // Τελευταία ολοκλήρωση προπόνησης
  const { data: lastWorkout } = await supabase
    .from('workout_completions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_date', { ascending: false })
    .limit(1)
    .single();

  // Τελευταία τεστ δύναμης
  const { data: latestStrength } = await supabase
    .from('test_sessions')
    .select(`
      test_date,
      strength_test_data (
        exercise_id,
        weight_kg,
        velocity_ms,
        is_1rm,
        exercises (name)
      )
    `)
    .eq('user_id', userId)
    .contains('test_types', ['Δύναμη'])
    .order('test_date', { ascending: false })
    .limit(1)
    .single();

  // AI προφίλ χρήστη
  const { data: aiProfile } = await supabase
    .from('ai_user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return {
    user,
    anthropometric: latestAnthropometric?.anthropometric_test_data?.[0],
    activePrograms,
    lastWorkout,
    strengthTests: latestStrength?.strength_test_data || [],
    aiProfile
  };
}

async function getConversationHistory(supabase: any, userId: string) {
  const { data: history } = await supabase
    .from('ai_conversations')
    .select('message_type, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(20); // Τελευταία 20 μηνύματα

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
  const { user, anthropometric, activePrograms, lastWorkout, strengthTests, aiProfile } = userData;

  let prompt = `Είσαι ένας εξειδικευμένος AI προπονητής για τον αθλητή ${user?.name}. Έχεις πρόσβαση σε όλα τα δεδομένα του και μαθαίνεις από κάθε αλληλεπίδραση.

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
    activePrograms.forEach((program: any) => {
      prompt += `- ${program.programs?.name}: ${program.status}\n`;
      if (program.training_dates) {
        prompt += `  Προπονήσεις: ${program.training_dates.length} συνολικά\n`;
      }
    });
  }

  // Τελευταία προπόνηση
  if (lastWorkout) {
    prompt += `\nΤΕΛΕΥΤΑΙΑ ΠΡΟΠΟΝΗΣΗ:\n`;
    prompt += `- Ημερομηνία: ${lastWorkout.completed_date}\n`;
    prompt += `- Διάρκεια: ${lastWorkout.actual_duration_minutes || 'Δεν καταγράφηκε'} λεπτά\n`;
    prompt += `- Κατάσταση: ${lastWorkout.status}\n`;
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

  prompt += `\nΟΔΗΓΙΕΣ:
1. Χρησιμοποίησε όλα τα παραπάνω δεδομένα για εξατομικευμένες συμβουλές
2. Θυμήσου τις προηγούμενες συμβουλές και βασίσου σε αυτές
3. Υπολόγισε θερμίδες βάσει των δεδομένων του χρήστη
4. Λάβε υπόψη τους στόχους και τα ιατρικά προβλήματα
5. Αν ο χρήστης σε διορθώσει, θυμήσου τη διόρθωση
6. Δώσε πρακτικές και εφαρμόσιμες συμβουλές
7. Απάντα στα ελληνικά και με φιλικό τόνο
8. Αν δεν έχεις αρκετά δεδομένα, ζήτα περισσότερες πληροφορίες

Είσαι ο προσωπικός του προπονητής και διατροφολόγος!`;

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
      content: aiResponse.substring(0, 500), // Πρώτα 500 χαρακτήρες
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
