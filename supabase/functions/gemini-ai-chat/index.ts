
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

    // Fetch user's basic info (birth_date, gender)
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('birth_date, gender, name')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
    }

    // Calculate age from birth_date
    let userAge = null;
    if (userData?.birth_date) {
      const birthDate = new Date(userData.birth_date);
      const today = new Date();
      userAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        userAge--;
      }
    }

    // Fetch user's exercises from their active programs
    const { data: userExercisesData, error: userExercisesError } = await supabase
      .from('program_assignments')
      .select(`
        programs!fk_program_assignments_program_id(
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
        programs!fk_program_assignments_program_id(
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

    // Fetch user's strength test history
    const { data: strengthHistory } = await supabase
      .from('strength_test_attempts')
      .select(`
        id,
        attempt_date,
        exercise_id,
        weight_kg,
        velocity_ms,
        estimated_1rm,
        exercises(name)
      `)
      .eq('user_id', userId)
      .order('attempt_date', { ascending: false })
      .limit(20);

    // Fetch user's endurance test history
    const { data: enduranceHistory } = await supabase
      .from('endurance_test_data')
      .select(`
        id,
        created_at,
        vo2_max,
        mas_kmh,
        sprint_watt,
        push_ups,
        pull_ups,
        crunches,
        test_session_id,
        endurance_test_sessions!inner(
          user_id,
          test_date
        )
      `)
      .eq('endurance_test_sessions.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch user's jump test history
    const { data: jumpHistory } = await supabase
      .from('jump_test_data')
      .select(`
        id,
        created_at,
        counter_movement_jump,
        non_counter_movement_jump,
        broad_jump,
        triple_jump_left,
        triple_jump_right,
        test_session_id,
        jump_test_sessions!inner(
          user_id,
          test_date
        )
      `)
      .eq('jump_test_sessions.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch user's anthropometric history
    const { data: anthropometricHistory } = await supabase
      .from('anthropometric_test_data')
      .select(`
        id,
        created_at,
        height,
        weight,
        body_fat_percentage,
        muscle_mass_percentage,
        waist_circumference,
        chest_circumference,
        test_session_id,
        anthropometric_test_sessions!inner(
          user_id,
          test_date
        )
      `)
      .eq('anthropometric_test_sessions.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

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

    // Create context about user's strength test history
    let strengthContext = '';
    if (strengthHistory && strengthHistory.length > 0) {
      const strengthList = strengthHistory.map(test => {
        return `- ${test.exercises?.name || 'Άσκηση'}: ${test.weight_kg}kg, Ταχύτητα: ${test.velocity_ms}m/s, Εκτίμηση 1RM: ${test.estimated_1rm}kg (${new Date(test.attempt_date).toLocaleDateString('el-GR')})`;
      }).join('\n');
      
      strengthContext = `\n\nΙστορικό Δύναμης (τελευταίες δοκιμές):\n${strengthList}`;
    }

    // Create context about user's endurance test history
    let enduranceContext = '';
    if (enduranceHistory && enduranceHistory.length > 0) {
      const enduranceList = enduranceHistory.map(test => {
        const parts = [];
        if (test.vo2_max) parts.push(`VO2max: ${test.vo2_max}`);
        if (test.mas_kmh) parts.push(`MAS: ${test.mas_kmh} km/h`);
        if (test.sprint_watt) parts.push(`Sprint: ${test.sprint_watt}W`);
        if (test.push_ups) parts.push(`Push-ups: ${test.push_ups}`);
        if (test.pull_ups) parts.push(`Pull-ups: ${test.pull_ups}`);
        const date = test.endurance_test_sessions?.[0]?.test_date || test.created_at;
        return `- ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})`;
      }).join('\n');
      
      enduranceContext = `\n\nΙστορικό Αντοχής:\n${enduranceList}`;
    }

    // Create context about user's jump test history
    let jumpContext = '';
    if (jumpHistory && jumpHistory.length > 0) {
      const jumpList = jumpHistory.map(test => {
        const parts = [];
        if (test.counter_movement_jump) parts.push(`CMJ: ${test.counter_movement_jump}cm`);
        if (test.broad_jump) parts.push(`Broad: ${test.broad_jump}cm`);
        if (test.triple_jump_left) parts.push(`Triple L: ${test.triple_jump_left}cm`);
        if (test.triple_jump_right) parts.push(`Triple R: ${test.triple_jump_right}cm`);
        const date = test.jump_test_sessions?.[0]?.test_date || test.created_at;
        return `- ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})`;
      }).join('\n');
      
      jumpContext = `\n\nΙστορικό Άλματος:\n${jumpList}`;
    }

    // Create context about user's anthropometric history
    let anthropometricContext = '';
    if (anthropometricHistory && anthropometricHistory.length > 0) {
      const anthropometricList = anthropometricHistory.map(test => {
        const parts = [];
        if (test.weight) parts.push(`Βάρος: ${test.weight}kg`);
        if (test.body_fat_percentage) parts.push(`Λίπος: ${test.body_fat_percentage}%`);
        if (test.muscle_mass_percentage) parts.push(`Μυϊκή Μάζα: ${test.muscle_mass_percentage}%`);
        const date = test.anthropometric_test_sessions?.[0]?.test_date || test.created_at;
        return `- ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})`;
      }).join('\n');
      
      anthropometricContext = `\n\nΑνθρωπομετρικό Ιστορικό:\n${anthropometricList}`;
    }

    // Create user profile context
    let userProfileContext = '';
    if (userData) {
      const parts = [];
      if (userAge) parts.push(`Ηλικία: ${userAge} ετών`);
      if (userData.gender) {
        const genderText = userData.gender === 'male' ? 'Άνδρας' : userData.gender === 'female' ? 'Γυναίκα' : userData.gender;
        parts.push(`Φύλο: ${genderText}`);
      }
      if (parts.length > 0) {
        userProfileContext = `\n\nΠροφίλ Χρήστη:\n${parts.join('\n')}`;
      }
    }

    // Enhanced system prompt with user's specific exercises
    const systemPrompt = `Είσαι ο "RID AI Προπονητής", ένας εξειδικευμένος AI βοηθός για fitness και διατροφή. Έχεις πρόσβαση στα προγράμματα, τις ασκήσεις, και το πλήρες ιστορικό προόδου του χρήστη.${userProfileContext}

Βοηθάς με:
1. Διατροφικές συμβουλές και σχεδιασμό γευμάτων
2. Ασκησιολογικές συμβουλές και τεχνικές
3. Αξιολόγηση αποτελεσμάτων τεστ και ανάλυση προόδου
4. Προγραμματισμό προπονήσεων
5. Αποκατάσταση και πρόληψη τραυματισμών
6. Συμβουλές για τις συγκεκριμένες ασκήσεις που έχει ο χρήστης
7. Ανάλυση της εξέλιξης και σύγκριση αποτελεσμάτων

${exerciseContext}${programContext}${strengthContext}${enduranceContext}${jumpContext}${anthropometricContext}

ΣΗΜΑΝΤΙΚΟ: Έχεις πρόσβαση στο ΠΛΗΡΕΣ ιστορικό του χρήστη. Μπορείς να:
- Αναλύσεις την πρόοδό του στη δύναμη (1RM, ταχύτητα)
- Δεις την εξέλιξη της αντοχής του (VO2max, MAS, sprint)
- Παρακολουθήσεις τα άλματά του (CMJ, broad jump, triple jumps)
- Εντοπίσεις αλλαγές στο σωματικό του σύνθεμα (βάρος, λίπος, μυϊκή μάζα)
- Συγκρίνεις αποτελέσματα μεταξύ διαφορετικών περιόδων
- Εντοπίσεις τάσεις και patterns στην πρόοδό του

Όταν αναφέρεις ασκήσεις, γράφε τες ΑΚΡΙΒΩΣ με το format:
"Άσκηση: [Όνομα Άσκησης]"

Παράδειγμα: "Άσκηση: Squat" ή "Άσκηση: Push Up"

Όταν συζητάς για πρόοδο:
- Αναφέρου συγκεκριμένα νούμερα από το ιστορικό
- Σύγκρινε παλιότερα με πρόσφατα αποτελέσματα
- Εντόπισε βελτιώσεις ή περιοχές που χρειάζονται προσοχή
- Δώσε συγκεκριμένες συμβουλές βασισμένες στα δεδομένα

${userName ? `Μιλάς με τον χρήστη: ${userName}` : ''}

Πάντα:
- Απαντάς στα ελληνικά
- Δίνεις λεπτομερείς, πρακτικές συμβουλές
- Χρησιμοποιείς τα πραγματικά δεδομένα του χρήστη
- Αναφέρεις συγκεκριμένες ασκήσεις και αποτελέσματα
- Τονίζεις τη σημασία της επαγγελματικής παρακολούθησης
- Είσαι φιλικός και υποστηρικτικός`;

    console.log('🤖 Sending request to Gemini API...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
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
