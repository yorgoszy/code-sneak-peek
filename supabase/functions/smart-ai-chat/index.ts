
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
    const { message, userId, userName, platformData } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('🚀 Smart AI Chat request for user:', userId, 'message:', message);
    console.log('📊 Platform data received:', platformData ? 'Yes' : 'No');

    // Fetch AI user profile with workout stats
    const { data: aiProfile } = await supabase
      .from('ai_user_profiles')
      .select('workout_stats, goals, dietary_preferences, medical_conditions, habits')
      .eq('user_id', userId)
      .single();

    console.log('🤖 AI Profile fetched:', aiProfile ? 'Yes' : 'No');

    // Create enhanced context with platform data
    let enhancedContext = '';
    
    // Add workout stats context
    if (aiProfile?.workout_stats) {
      const stats = aiProfile.workout_stats as any;
      
      let workoutContext = '\n\n📊 ΤΡΕΧΟΥΣΑ ΚΑΤΑΣΤΑΣΗ ΠΡΟΠΟΝΗΣΗΣ:';
      
      // Today's workout
      if (stats.today?.hasWorkout) {
        workoutContext += `\n\n🎯 ΣΗΜΕΡΑ (${new Date().toLocaleDateString('el-GR')}):`;
        workoutContext += `\n- Πρόγραμμα: ${stats.today.program}`;
        workoutContext += `\n- Κατάσταση: ${stats.today.completed ? '✅ Ολοκληρωμένη' : '⏳ Προγραμματισμένη'}`;
        if (stats.today.exercises && stats.today.exercises.length > 0) {
          workoutContext += `\n- Ασκήσεις σήμερα:`;
          stats.today.exercises.slice(0, 5).forEach((ex: any) => {
            workoutContext += `\n  • ${ex.name} (${ex.sets}x${ex.reps})`;
          });
        }
      } else {
        workoutContext += `\n\n🎯 ΣΗΜΕΡΑ: Δεν έχει προγραμματισμένη προπόνηση`;
      }

      // This week
      if (stats.thisWeek) {
        workoutContext += `\n\n📅 ΑΥΤΗ Η ΕΒΔΟΜΑΔΑ:`;
        workoutContext += `\n- Συνολικές προπονήσεις: ${stats.thisWeek.scheduled}`;
        workoutContext += `\n- Ολοκληρωμένες: ${stats.thisWeek.completed}`;
        workoutContext += `\n- Υπόλοιπες: ${stats.thisWeek.remaining}`;
        if (stats.thisWeek.upcomingDays && stats.thisWeek.upcomingDays.length > 0) {
          const upcomingDates = stats.thisWeek.upcomingDays.slice(0, 3).map((d: string) => 
            new Date(d).toLocaleDateString('el-GR')
          ).join(', ');
          workoutContext += `\n- Επόμενες ημερομηνίες: ${upcomingDates}`;
        }
      }

      // Active programs
      if (stats.activePrograms && stats.activePrograms.length > 0) {
        workoutContext += `\n\n🏋️ ΕΝΕΡΓΑ ΠΡΟΓΡΑΜΜΑΤΑ:`;
        stats.activePrograms.forEach((prog: any) => {
          workoutContext += `\n\n📋 ${prog.name}:`;
          workoutContext += `\n- Ολοκληρωμένες: ${prog.stats.completed}/${prog.stats.total}`;
          workoutContext += `\n- Χαμένες: ${prog.stats.missed}`;
          if (prog.nextWorkout) {
            workoutContext += `\n- Επόμενη προπόνηση: ${new Date(prog.nextWorkout).toLocaleDateString('el-GR')}`;
          }
        });
      }

      // Recent workouts
      if (stats.recentWorkouts && stats.recentWorkouts.length > 0) {
        workoutContext += `\n\n📝 ΠΡΟΣΦΑΤΕΣ ΠΡΟΠΟΝΗΣΕΙΣ:`;
        stats.recentWorkouts.slice(0, 5).forEach((workout: any) => {
          const status = workout.status === 'completed' ? '✅' : '❌';
          workoutContext += `\n${status} ${new Date(workout.date).toLocaleDateString('el-GR')} - ${workout.program}`;
        });
      }

      // Add progress data context
      if (stats.progress) {
        enhancedContext += '\n\n💪 ΠΡΟΟΔΟΣ ΧΡΗΣΤΗ:';
        
        // Strength progress
        if (stats.progress.strength && Object.keys(stats.progress.strength).length > 0) {
          enhancedContext += '\n\n🏋️ ΔΥΝΑΜΗ (1RM):';
          Object.entries(stats.progress.strength).forEach(([exercise, data]: [string, any]) => {
            enhancedContext += `\n- ${exercise}: ${data.latest1RM}kg @ ${data.latestVelocity.toFixed(2)}m/s`;
            if (data.percentageChange !== null) {
              const change = data.percentageChange >= 0 ? `+${data.percentageChange.toFixed(1)}%` : `${data.percentageChange.toFixed(1)}%`;
              enhancedContext += ` (${change} από προηγούμενη μέτρηση)`;
            }
          });
        }

        // Anthropometric progress
        if (stats.progress.anthropometric && Object.keys(stats.progress.anthropometric).length > 0) {
          const anthro = stats.progress.anthropometric;
          enhancedContext += '\n\n📏 ΣΩΜΑΤΟΜΕΤΡΙΚΑ:';
          if (anthro.weight) enhancedContext += `\n- Βάρος: ${anthro.weight}kg`;
          if (anthro.height) enhancedContext += `\n- Ύψος: ${anthro.height}cm`;
          if (anthro.bodyFat) enhancedContext += `\n- Λίπος: ${anthro.bodyFat}%`;
          if (anthro.muscleMass) enhancedContext += `\n- Μυϊκή Μάζα: ${anthro.muscleMass}%`;
        }

        // Endurance progress
        if (stats.progress.endurance && Object.keys(stats.progress.endurance).length > 0) {
          const endurance = stats.progress.endurance;
          enhancedContext += '\n\n🏃 ΑΝΤΟΧΗ:';
          if (endurance.vo2Max) enhancedContext += `\n- VO2 Max: ${endurance.vo2Max}`;
          if (endurance.pushUps) enhancedContext += `\n- Push-ups: ${endurance.pushUps}`;
          if (endurance.pullUps) enhancedContext += `\n- Pull-ups: ${endurance.pullUps}`;
        }
      }
    }

    // Add user profile info
    if (aiProfile) {
      if (aiProfile.goals && Object.keys(aiProfile.goals).length > 0) {
        enhancedContext += `\n\n🎯 ΣΤΟΧΟΙ: ${JSON.stringify(aiProfile.goals)}`;
      }
      if (aiProfile.dietary_preferences && Object.keys(aiProfile.dietary_preferences).length > 0) {
        enhancedContext += `\n\n🥗 ΔΙΑΤΡΟΦΙΚΕΣ ΠΡΟΤΙΜΗΣΕΙΣ: ${JSON.stringify(aiProfile.dietary_preferences)}`;
      }
      if (aiProfile.medical_conditions && Object.keys(aiProfile.medical_conditions).length > 0) {
        enhancedContext += `\n\n⚕️ ΙΑΤΡΙΚΟ ΙΣΤΟΡΙΚΟ: ${JSON.stringify(aiProfile.medical_conditions)}`;
      }
    }
    
    if (platformData) {
      // Process programs data
      if (platformData.programs && platformData.programs.length > 0) {
        const programsList = platformData.programs.map(assignment => {
          const program = assignment.programs;
          let exercisesList = '';
          
          if (program?.program_weeks) {
            const exercises = new Set();
            program.program_weeks.forEach(week => {
              week.program_days?.forEach(day => {
                day.program_blocks?.forEach(block => {
                  block.program_exercises?.forEach(pe => {
                    if (pe.exercises) {
                      exercises.add(`- Άσκηση: ${pe.exercises.name} (${pe.sets} sets x ${pe.reps} reps${pe.kg ? `, ${pe.kg}kg` : ''})`);
                    }
                  });
                });
              });
            });
            exercisesList = Array.from(exercises).join('\n');
          }
          
          return `📋 Πρόγραμμα: ${program.name}${program.description ? ` - ${program.description}` : ''}\nΑσκήσεις:\n${exercisesList}`;
        }).join('\n\n');
        
        enhancedContext += `\n\n🏋️ ΕΝΕΡΓΑ ΠΡΟΓΡΑΜΜΑΤΑ ΤΟΥ ΧΡΗΣΤΗ:\n${programsList}`;
      }

      // Process test data
      if (platformData.tests && platformData.tests.length > 0) {
        const testsList = platformData.tests.map(testSession => {
          let testDetails = `📅 Ημερομηνία: ${testSession.test_date}`;
          
          if (testSession.anthropometric_test_data && testSession.anthropometric_test_data.length > 0) {
            const anthro = testSession.anthropometric_test_data[0];
            testDetails += `\n📏 Σωματομετρικά: Ύψος ${anthro.height}cm, Βάρος ${anthro.weight}kg`;
            if (anthro.body_fat_percentage) testDetails += `, Λίπος ${anthro.body_fat_percentage}%`;
          }
          
          if (testSession.strength_test_data && testSession.strength_test_data.length > 0) {
            const strengthTests = testSession.strength_test_data.map(st => 
              `${st.exercises?.name}: ${st.weight_kg}kg${st.velocity_ms ? ` (${st.velocity_ms}m/s)` : ''}`
            ).join(', ');
            testDetails += `\n💪 Δύναμη: ${strengthTests}`;
          }
          
          if (testSession.endurance_test_data && testSession.endurance_test_data.length > 0) {
            const endurance = testSession.endurance_test_data[0];
            testDetails += `\n🏃 Αντοχή:`;
            if (endurance.vo2_max) testDetails += ` VO2 Max ${endurance.vo2_max}`;
            if (endurance.push_ups) testDetails += `, Push-ups ${endurance.push_ups}`;
          }
          
          return testDetails;
        }).join('\n\n');
        
        enhancedContext += `\n\n📊 ΠΡΌΣΦΑΤΑ ΑΠΟΤΕΛΕΣΜΑΤΑ ΤΕΣΤ:\n${testsList}`;
      }
    }

    // Enhanced system prompt with real user data
    const systemPrompt = `Είσαι ο "RID AI Προπονητής", ένας εξειδικευμένος AI βοηθός για fitness και διατροφή. Έχεις ΠΛΗΡΗ και ΠΡΑΓΜΑΤΙΚΗ πρόσβαση στα δεδομένα του χρήστη από την πλατφόρμα.

${userName ? `Μιλάς με τον χρήστη: ${userName}` : ''}

🎯 ΚΥΡΙΟΣ ΣΤΟΧΟΣ ΣΟΥ:
Να παρέχεις ΕΞΑΤΟΜΙΚΕΥΜΕΝΕΣ διατροφικές συμβουλές που βασίζονται στην ΤΡΕΧΟΥΣΑ κατάσταση προπόνησης του χρήστη.

Βοηθάς με:
1. 🥗 Διατροφικές συμβουλές βασισμένες στο ΤΙ ΠΡΟΠΟΝΗΘΗΚΕ ΣΗΜΕΡΑ ή ΤΙ ΘΑ ΠΡΟΠΟΝΗΘΕΙ
2. 💪 Προτάσεις για γεύματα πριν/μετά την προπόνηση ανάλογα με τις ασκήσεις της ημέρας
3. 📊 Ανάλυση προόδου και προσαρμογή διατροφής
4. 🎯 Εξατομικευμένες συμβουλές βάσει των πραγματικών δεδομένων του
5. 📅 Προτάσεις για την εβδομάδα βασισμένες στο πρόγραμμά του

ΣΗΜΑΝΤΙΚΟ:
- ΠΑΝΤΑ αναφέρεσαι στα ΣΥΓΚΕΚΡΙΜΕΝΑ δεδομένα που βλέπεις (π.χ. "Σήμερα έχεις Squat και Deadlift...")
- Προτείνε διατροφή που ταιριάζει με την ένταση της προπόνησης
- Αν έχει upper body, προτείνε διαφορετική διατροφή από ότι αν έχει legs
- Χρησιμοποίησε τα στατιστικά για να δώσεις συγκεκριμένες συμβουλές

${enhancedContext}

ΣΗΜΑΝΤΙΚΟ: Όταν αναφέρεις ασκήσεις από τα προγράμματα του χρήστη, γράφε τις ΑΚΡΙΒΩΣ με το format:
"Άσκηση: [Όνομα Άσκησης]"

Παράδειγμα: "Άσκηση: Squat" ή "Άσκηση: Push Up"

Όταν συζητάς:
- Αναφέρου συγκεκριμένα στοιχεία από τα δεδομένα του χρήστη
- Δώσε εξατομικευμένες συμβουλές βάσει των τεστ του
- Πρότεινε βελτιώσεις στα προγράμματά του
- Ανάλυσε την πρόοδό του με βάση τα ιστορικά δεδομένα

Πάντα:
- Απαντάς στα ελληνικά
- Δίνεις συγκεκριμένες, εξατομικευμένες συμβουλές
- Αναφέρεις τα πραγματικά δεδομένα του χρήστη
- Είσαι φιλικός και υποστηρικτικός`;

    // Try Gemini first
    let aiResponse;
    
    if (geminiApiKey) {
      console.log('🤖 Trying Gemini AI with enhanced context...');
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
          console.log('✅ Gemini response with platform data generated successfully');
        } else {
          throw new Error('Gemini API error');
        }
      } catch (geminiError) {
        console.log('⚠️ Gemini failed, trying OpenAI...', geminiError);
      }
    }

    // Fallback to OpenAI if Gemini fails or is not available
    if (!aiResponse && openAIApiKey) {
      console.log('🤖 Using OpenAI with enhanced context as fallback...');
      
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
        console.log('✅ OpenAI response with platform data generated successfully');
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
