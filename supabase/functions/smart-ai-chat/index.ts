
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

    // Συλλογή μόνο των βασικών δεδομένων του χρήστη
    const userData = await collectEssentialUserData(supabase, userId);
    
    // Φόρτωση μόνο του πρόσφατου ιστορικού συνομιλίας
    const conversationHistory = await getRecentConversationHistory(supabase, userId);

    // Δημιουργία εξατομικευμένου system prompt
    const systemPrompt = createOptimizedPrompt(userData);

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

async function collectEssentialUserData(supabase: any, userId: string) {
  console.log('📊 Collecting essential user data for:', userId);

  try {
    // Βασικά στοιχεία χρήστη
    const { data: user } = await supabase
      .from('app_users')
      .select('id, name, email, birth_date, category, subscription_status')
      .eq('id', userId)
      .single();

    console.log('👤 User basic info loaded:', user?.name);

    // Τελευταία σωματομετρικά δεδομένα (μόνο τα πιο πρόσφατα)
    const { data: latestAnthropometric } = await supabase
      .from('test_sessions')
      .select(`
        test_date,
        anthropometric_test_data!fk_anthropometric_test_data_session (
          height, weight, body_fat_percentage, muscle_mass_percentage
        )
      `)
      .eq('user_id', userId)
      .contains('test_types', ['Σωματομετρικά'])
      .order('test_date', { ascending: false })
      .limit(1);

    console.log('📊 Latest anthropometric data loaded');

    // Μόνο τα ενεργά προγράμματα (απλοποιημένα)
    const { data: activePrograms } = await supabase
      .from('program_assignments')
      .select(`
        id, status, training_dates,
        programs!fk_program_assignments_program_id (
          name, description, type
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(3);

    console.log('💪 Active programs loaded:', activePrograms?.length || 0);

    // Μόνο τις πιο πρόσφατες προπονήσεις
    const { data: recentWorkouts } = await supabase
      .from('workout_completions')
      .select('scheduled_date, completed_date, status, actual_duration_minutes')
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: false })
      .limit(5);

    console.log('🏃 Recent workouts loaded:', recentWorkouts?.length || 0);

    // Τελευταία τεστ δύναμης (μόνο τα βασικά)
    const { data: latestStrength } = await supabase
      .from('test_sessions')
      .select(`
        test_date,
        strength_test_data!fk_strength_test_data_session (
          weight_kg, is_1rm,
          exercises!fk_strength_test_data_exercise (name)
        )
      `)
      .eq('user_id', userId)
      .contains('test_types', ['Δύναμη'])
      .order('test_date', { ascending: false })
      .limit(1);

    console.log('💪 Latest strength tests loaded');

    // AI προφίλ χρήστη
    const { data: aiProfile } = await supabase
      .from('ai_user_profiles')
      .select('goals, medical_conditions, dietary_preferences, last_nutrition_advice')
      .eq('user_id', userId)
      .single();

    console.log('🧠 AI profile loaded:', aiProfile ? 'exists' : 'not found');

    console.log('✅ Essential user data collection completed');

    return {
      user,
      anthropometric: latestAnthropometric?.[0]?.anthropometric_test_data?.[0],
      activePrograms: activePrograms || [],
      recentWorkouts: recentWorkouts || [],
      strengthTests: latestStrength?.[0]?.strength_test_data || [],
      aiProfile
    };

  } catch (error) {
    console.error('💥 Error in collectEssentialUserData:', error);
    return {
      user: null,
      anthropometric: null,
      activePrograms: [],
      recentWorkouts: [],
      strengthTests: [],
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

function createOptimizedPrompt(userData: any) {
  const { user, anthropometric, activePrograms, recentWorkouts, strengthTests, aiProfile } = userData;

  let prompt = `Είσαι ο RID, ένας εξειδικευμένος AI προπονητής για τον αθλητή ${user?.name}. Έχεις πρόσβαση στα βασικά δεδομένα του.

**ΤΑΥΤΟΤΗΤΑ:**
- Όνομα: RID (Rapid Intelligent Development)
- Ρόλος: Προσωπικός AI προπονητής και διατροφολόγος
- Χαρακτήρας: Φιλικός, εξειδικευμένος, επιστημονικός αλλά προσιτός

ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ ΑΘΛΗΤΗ:
`;

  // Βασικά στοιχεία
  if (user) {
    prompt += `- Όνομα: ${user.name}\n`;
    if (user.birth_date) {
      const age = new Date().getFullYear() - new Date(user.birth_date).getFullYear();
      prompt += `- Ηλικία: ${age} χρόνια\n`;
    }
    if (user.category) prompt += `- Κατηγορία: ${user.category}\n`;
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
      }
    });
  }

  // Τελευταίες προπονήσεις
  if (recentWorkouts && recentWorkouts.length > 0) {
    prompt += `\nΤΕΛΕΥΤΑΙΕΣ ΠΡΟΠΟΝΗΣΕΙΣ:\n`;
    recentWorkouts.slice(0, 3).forEach((workout: any) => {
      prompt += `- ${workout.scheduled_date || workout.completed_date}: ${workout.status}`;
      if (workout.actual_duration_minutes) {
        prompt += ` (${workout.actual_duration_minutes} λεπτά)`;
      }
      prompt += `\n`;
    });
  }

  // Δεδομένα δύναμης
  if (strengthTests && strengthTests.length > 0) {
    prompt += `\nΤΕΛΕΥΤΑΙΑ ΤΕΣΤ ΔΥΝΑΜΗΣ:\n`;
    strengthTests.slice(0, 3).forEach((test: any) => {
      if (test.exercises?.name) {
        prompt += `- ${test.exercises.name}: ${test.weight_kg}kg`;
        if (test.is_1rm) prompt += ` (1RM)`;
        prompt += `\n`;
      }
    });
  }

  // AI προφίλ (στόχοι, προτιμήσεις κτλ)
  if (aiProfile) {
    if (aiProfile.goals && Object.keys(aiProfile.goals).length > 0) {
      prompt += `\nΣΤΟΧΟΙ: ${JSON.stringify(aiProfile.goals)}\n`;
    }
    if (aiProfile.medical_conditions && Object.keys(aiProfile.medical_conditions).length > 0) {
      prompt += `\nΙΑΤΡΙΚΑ ΣΤΟΙΧΕΙΑ: ${JSON.stringify(aiProfile.medical_conditions)}\n`;
    }
    if (aiProfile.dietary_preferences && Object.keys(aiProfile.dietary_preferences).length > 0) {
      prompt += `\nΔΙΑΤΡΟΦΙΚΕΣ ΠΡΟΤΙΜΗΣΕΙΣ: ${JSON.stringify(aiProfile.dietary_preferences)}\n`;
    }
  }

  prompt += `\nΟΔΗΓΙΕΣ ΓΙΑ ΤΟΝ RID:
1. Συστήσου πάντα ως "RID" στην αρχή αν είναι νέα συνομιλία
2. Χρησιμοποίησε τα παραπάνω δεδομένα για εξατομικευμένες συμβουλές
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
      model: 'gpt-4o-mini', // Πιο γρήγορο μοντέλο
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000, // Μειωμένο για ταχύτητα
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
