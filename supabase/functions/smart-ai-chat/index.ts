
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
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

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('🚀 Smart AI Chat request for user:', userId, 'message:', message);

    // Fetch user's exercises from their active programs
    const { data: userExercisesData, error: userExercisesError } = await supabase
      .from('program_assignments')
      .select(`
        programs!inner(
          program_weeks(
            program_days(
              program_blocks(
                program_exercises(
                  exercises(
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
                  )
                )
              )
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (userExercisesError) {
      console.error('Error fetching user exercises:', userExercisesError);
    }

    // Extract unique exercises from user's programs
    const userExercises = new Map();
    if (userExercisesData) {
      userExercisesData.forEach(assignment => {
        assignment.programs?.program_weeks?.forEach(week => {
          week.program_days?.forEach(day => {
            day.program_blocks?.forEach(block => {
              block.program_exercises?.forEach(pe => {
                if (pe.exercises) {
                  userExercises.set(pe.exercises.id, pe.exercises);
                }
              });
            });
          });
        });
      });
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

    // Create context about user's exercises with video URLs
    let exerciseContext = '';
    if (userExercises.size > 0) {
      const exercisesList = Array.from(userExercises.values()).map(exercise => {
        const categories = exercise.exercise_to_category?.map((etc: any) => 
          etc.exercise_categories?.name || ''
        ).filter(Boolean).join(', ') || '';
        
        const videoInfo = exercise.video_url ? ` (Video: ${exercise.video_url})` : '';
        
        return `- Άσκηση: ${exercise.name}${categories ? ` (${categories})` : ''}${exercise.description ? `: ${exercise.description}` : ''}${videoInfo}`;
      }).join('\n');
      
      exerciseContext = `\n\nΟι ασκήσεις που έχεις στα προγράμματά σου:\n${exercisesList}`;
    }

    // Create context about user's programs
    let programContext = '';
    if (programsData && programsData.length > 0) {
      const programsList = programsData.map(assignment => {
        const program = assignment.programs;
        return `- ${program.name}${program.description ? `: ${program.description}` : ''}`;
      }).join('\n');
      
      programContext = `\n\nΤα ενεργά προγράμματά σου:\n${programsList}`;
    }

    // Enhanced system prompt with user's specific exercises
    const systemPrompt = `Είσαι ο "RID AI Προπονητής", ένας εξειδικευμένος AI βοηθός για fitness και διατροφή. Έχεις πρόσβαση στις ασκήσεις και τα προγράμματα του χρήστη.

Βοηθάς με:
1. Διατροφικές συμβουλές και σχεδιασμό γευμάτων
2. Ασκησιολογικές συμβουλές και τεχνικές
3. Αξιολόγηση αποτελεσμάτων τεστ
4. Προγραμματισμό προπονήσεων
5. Αποκατάσταση και πρόληψη τραυματισμών
6. Συμβουλές για τις συγκεκριμένες ασκήσεις που έχει ο χρήστης

${exerciseContext}${programContext}

ΣΗΜΑΝΤΙΚΟ: Όταν αναφέρεις ασκήσεις από τις ασκήσεις του χρήστη, γράφε τες ΑΚΡΙΒΩΣ με το format:
"Άσκηση: [Όνομα Άσκησης]"

Παράδειγμα: "Άσκηση: Squat" ή "Άσκηση: Push Up"

Όταν συζητάς για ασκήσεις:
- Αναφέρου τις ασκήσεις που έχει ο χρήστης στα προγράμματά του
- Δώσε συγκεκριμένες συμβουλές για τεχνική εκτέλεση
- Πρότεινε εναλλακτικές από τις ασκήσεις που έχει
- Εξήγησε τα οφέλη κάθε άσκησης που χρησιμοποιεί

${userName ? `Μιλάς με τον χρήστη: ${userName}` : ''}

Πάντα:
- Απαντάς στα ελληνικά
- Δίνεις λεπτομερείς, πρακτικές συμβουλές
- Αναφέρεις συγκεκριμένες ασκήσεις από τα προγράμματα του χρήστη όταν χρειάζεται
- Τονίζεις τη σημασία της επαγγελματικής παρακολούθησης
- Είσαι φιλικός και υποστηρικτικός`;

    // Try Gemini first
    let aiResponse;
    
    if (geminiApiKey) {
      console.log('🤖 Trying Gemini AI...');
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
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

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          aiResponse = geminiData.candidates[0].content.parts[0].text;
          console.log('✅ Gemini response generated successfully');
        } else {
          throw new Error('Gemini API error');
        }
      } catch (geminiError) {
        console.log('⚠️ Gemini failed, trying OpenAI...', geminiError);
      }
    }

    // Fallback to OpenAI if Gemini fails or is not available
    if (!aiResponse && openAIApiKey) {
      console.log('🤖 Using OpenAI as fallback...');
      
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (openAIResponse.ok) {
        const openAIData = await openAIResponse.json();
        aiResponse = openAIData.choices[0].message.content;
        console.log('✅ OpenAI response generated successfully');
      } else {
        throw new Error('OpenAI API error');
      }
    }

    if (!aiResponse) {
      throw new Error('No AI service available');
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('💥 Smart AI Chat Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'Λυπάμαι, αντιμετωπίζω τεχνικά προβλήματα. Παρακαλώ δοκιμάστε ξανά αργότερα.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
