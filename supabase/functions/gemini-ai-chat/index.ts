
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, userName } = await req.json();

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('🚀 Gemini AI request for user:', userId, 'message:', message);

    // Fetch user's exercises for context
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('exercises')
      .select(`
        id,
        name,
        description,
        video_url,
        exercise_to_category!inner(
          exercise_categories(
            name,
            type
          )
        )
      `);

    if (exercisesError) {
      console.error('Error fetching exercises:', exercisesError);
    }

    // Fetch user's recent programs for context
    const { data: programsData, error: programsError } = await supabase
      .from('program_assignments')
      .select(`
        programs!inner(
          name,
          description,
          program_weeks(
            program_days(
              program_blocks(
                program_exercises(
                  sets,
                  reps,
                  kg,
                  exercises(name)
                )
              )
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(3);

    if (programsError) {
      console.error('Error fetching programs:', programsError);
    }

    // Create context about available exercises with video URLs
    let exerciseContext = '';
    if (exercisesData && exercisesData.length > 0) {
      const exercisesList = exercisesData.map(exercise => {
        const categories = exercise.exercise_to_category?.map((etc: any) => 
          etc.exercise_categories?.name || ''
        ).filter(Boolean).join(', ') || '';
        
        const videoInfo = exercise.video_url ? ` (Video: ${exercise.video_url})` : '';
        
        return `- Άσκηση: ${exercise.name}${categories ? ` (${categories})` : ''}${exercise.description ? `: ${exercise.description}` : ''}${videoInfo}`;
      }).join('\n');
      
      exerciseContext = `\n\nΔιαθέσιμες ασκήσεις στη βάση δεδομένων:\n${exercisesList}`;
    }

    // Create context about user's programs
    let programContext = '';
    if (programsData && programsData.length > 0) {
      const programsList = programsData.map(assignment => {
        const program = assignment.programs;
        return `- ${program.name}${program.description ? `: ${program.description}` : ''}`;
      }).join('\n');
      
      programContext = `\n\nΕνεργά προγράμματα του χρήστη:\n${programsList}`;
    }

    // Enhanced system prompt with exercise knowledge
    const systemPrompt = `Είσαι ο "RID AI Προπονητής", ένας εξειδικευμένος AI βοηθός για fitness και διατροφή. Έχεις πρόσβαση στη βάση δεδομένων ασκήσεων και τα προγράμματα του χρήστη.

Βοηθάς με:
1. Διατροφικές συμβουλές και σχεδιασμό γευμάτων
2. Ασκησιολογικές συμβουλές και τεχνικές
3. Αξιολόγηση αποτελεσμάτων τεστ
4. Προγραμματισμό προπονήσεων
5. Αποκατάσταση και πρόληψη τραυματισμών
6. Συμβουλές για συγκεκριμένες ασκήσεις από τη βάση δεδομένων

${exerciseContext}${programContext}

ΣΗΜΑΝΤΙΚΟ: Όταν αναφέρεις ασκήσεις από τη βάση δεδομένων, γράφε τες ΑΚΡΙΒΩΣ με το format:
"Άσκηση: [Όνομα Άσκησης]"

Παράδειγμα: "Άσκηση: Squat" ή "Άσκηση: Push Up"

Όταν συζητάς για ασκήσεις:
- Αναφέρου τις διαθέσιμες ασκήσεις από τη βάση όταν είναι σχετικό
- Δώσε συγκεκριμένες συμβουλές για τεχνική εκτέλεση
- Πρότεινε εναλλακτικές ασκήσεις από τη βάση
- Εξήγησε τα οφέλη κάθε άσκησης

${userName ? `Μιλάς με τον χρήστη: ${userName}` : ''}

Πάντα:
- Απαντάς στα ελληνικά
- Δίνεις λεπτομερείς, πρακτικές συμβουλές
- Αναφέρεις συγκεκριμένες ασκήσεις από τη βάση όταν χρειάζεται
- Τονίζεις τη σημασία της επαγγελματικής παρακολούθησης
- Είσαι φιλικός και υποστηρικτικός`;

    console.log('🤖 Sending request to Gemini API...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nΕρώτηση: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    console.log('✅ Gemini response generated successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('💥 Gemini AI Chat Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'Λυπάμαι, αντιμετωπίζω τεχνικά προβλήματα. Παρακαλώ δοκιμάστε ξανά αργότερα.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
