
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

    // Fetch all exercises with categories
    const { data: allExercises } = await supabase
      .from('exercises')
      .select(`
        id,
        name,
        description,
        video_url,
        exercise_to_category (
          exercise_categories (
            id,
            name,
            type
          )
        )
      `)
      .order('name', { ascending: true });

    console.log('💪 Exercises fetched:', allExercises?.length || 0);

    // Fetch all exercise categories
    const { data: exerciseCategories } = await supabase
      .from('exercise_categories')
      .select('id, name, type')
      .order('type, name', { ascending: true });

    console.log('📋 Exercise categories fetched:', exerciseCategories?.length || 0);

    // Create enhanced context with platform data
    let enhancedContext = '';

    // Add exercise database context
    if (allExercises && allExercises.length > 0) {
      enhancedContext += '\n\n📚 ΒΑΣΗ ΑΣΚΗΣΕΩΝ ΤΟΥ ΓΥΜΝΑΣΤΗΡΙΟΥ:';
      
      // Group exercises by category
      const exercisesByCategory: Record<string, any[]> = {};
      
      allExercises.forEach(exercise => {
        const categories = exercise.exercise_to_category || [];
        if (categories.length === 0) {
          if (!exercisesByCategory['Χωρίς Κατηγορία']) {
            exercisesByCategory['Χωρίς Κατηγορία'] = [];
          }
          exercisesByCategory['Χωρίς Κατηγορία'].push(exercise);
        } else {
          categories.forEach((catLink: any) => {
            const cat = catLink.exercise_categories;
            if (cat) {
              const categoryKey = `${cat.type} - ${cat.name}`;
              if (!exercisesByCategory[categoryKey]) {
                exercisesByCategory[categoryKey] = [];
              }
              exercisesByCategory[categoryKey].push(exercise);
            }
          });
        }
      });

      // Display exercises grouped by category
      Object.entries(exercisesByCategory).forEach(([categoryName, exercises]) => {
        enhancedContext += `\n\n${categoryName}:`;
        exercises.slice(0, 50).forEach(ex => {
          enhancedContext += `\n  • ${ex.name}`;
          if (ex.description) {
            enhancedContext += ` - ${ex.description}`;
          }
        });
        if (exercises.length > 50) {
          enhancedContext += `\n  ... και ${exercises.length - 50} ακόμα ασκήσεις`;
        }
      });
    }

    // Add exercise categories context
    if (exerciseCategories && exerciseCategories.length > 0) {
      enhancedContext += '\n\n🏷️ ΚΑΤΗΓΟΡΙΕΣ ΑΣΚΗΣΕΩΝ:';
      
      const categoriesByType: Record<string, any[]> = {};
      exerciseCategories.forEach(cat => {
        if (!categoriesByType[cat.type]) {
          categoriesByType[cat.type] = [];
        }
        categoriesByType[cat.type].push(cat);
      });

      Object.entries(categoriesByType).forEach(([type, categories]) => {
        enhancedContext += `\n\n${type}:`;
        categories.forEach(cat => {
          enhancedContext += `\n  • ${cat.name}`;
        });
      });
    }
    
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

        // Jump progress
        if (stats.progress.jumps && Object.keys(stats.progress.jumps).length > 0) {
          const jumps = stats.progress.jumps;
          enhancedContext += '\n\n🦘 ΑΛΜΑΤΑ:';
          if (jumps.nonCounterMovementJump) enhancedContext += `\n- Non-CMJ: ${jumps.nonCounterMovementJump}cm`;
          if (jumps.counterMovementJump) enhancedContext += `\n- CMJ: ${jumps.counterMovementJump}cm`;
          if (jumps.depthJump) enhancedContext += `\n- Depth Jump: ${jumps.depthJump}cm`;
          if (jumps.broadJump) enhancedContext += `\n- Broad Jump: ${jumps.broadJump}m`;
          if (jumps.tripleJumpLeft) enhancedContext += `\n- Triple Jump Αριστερό: ${jumps.tripleJumpLeft}m`;
          if (jumps.tripleJumpRight) enhancedContext += `\n- Triple Jump Δεξί: ${jumps.tripleJumpRight}m`;
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
      // Process programs data with workout stats
      if (platformData.programs && platformData.programs.length > 0) {
        enhancedContext += '\n\n🏋️ ΕΝΕΡΓΑ ΠΡΟΓΡΑΜΜΑΤΑ ΚΑΙ ΣΤΑΤΙΣΤΙΚΑ:';
        
        platformData.programs.forEach(assignment => {
          const program = assignment.programs;
          const stats = assignment.workoutStats;
          const user = assignment.app_users;
          
          enhancedContext += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
          enhancedContext += `\n📋 Πρόγραμμα: ${program.name}`;
          if (program.description) {
            enhancedContext += `\n📝 Περιγραφή: ${program.description}`;
          }
          
          // User info
          if (user) {
            enhancedContext += `\n👤 Αθλητής: ${user.name} (${user.email})`;
          }
          
          // Assignment details
          enhancedContext += `\n📅 Ημερομηνίες: ${assignment.start_date} έως ${assignment.end_date}`;
          enhancedContext += `\n🎯 Κατάσταση: ${assignment.status}`;
          if (assignment.notes) {
            enhancedContext += `\n💬 Σημειώσεις: ${assignment.notes}`;
          }
          
          // Workout Stats
          if (stats) {
            enhancedContext += `\n\n📊 ΣΤΑΤΙΣΤΙΚΑ ΠΡΟΠΟΝΗΣΗΣ:`;
            enhancedContext += `\n✅ Ολοκληρωμένες: ${stats.completed}/${stats.total} (${stats.progress}%)`;
            enhancedContext += `\n❌ Χαμένες: ${stats.missed}`;
            enhancedContext += `\n⏳ Υπόλοιπες: ${stats.total - stats.completed}`;
          }
          
          // Training dates
          if (assignment.training_dates && assignment.training_dates.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const upcoming = assignment.training_dates.filter(d => d >= today).slice(0, 5);
            if (upcoming.length > 0) {
              enhancedContext += `\n\n📆 ΕΠΟΜΕΝΕΣ ΠΡΟΠΟΝΗΣΕΙΣ:`;
              upcoming.forEach(date => {
                const dateObj = new Date(date);
                enhancedContext += `\n- ${dateObj.toLocaleDateString('el-GR')}`;
              });
            }
          }
          
          // Program structure with exercises
          if (program?.program_weeks && program.program_weeks.length > 0) {
            enhancedContext += `\n\n🗓️ ΔΟΜΗ ΠΡΟΓΡΑΜΜΑΤΟΣ:`;
            
            program.program_weeks.forEach(week => {
              enhancedContext += `\n\n${week.name || `Εβδομάδα ${week.week_number}`}:`;
              
              week.program_days?.forEach(day => {
                enhancedContext += `\n  ${day.name || `Ημέρα ${day.day_number}`}`;
                if (day.estimated_duration_minutes) {
                  enhancedContext += ` (${day.estimated_duration_minutes} λεπτά)`;
                }
                
                day.program_blocks?.forEach(block => {
                  enhancedContext += `\n    ${block.name}:`;
                  
                  block.program_exercises?.forEach(pe => {
                    const exercise = pe.exercises;
                    if (exercise) {
                      enhancedContext += `\n      • ${exercise.name}: ${pe.sets} sets x ${pe.reps} reps`;
                      if (pe.kg) enhancedContext += ` @ ${pe.kg}kg`;
                      if (pe.tempo) enhancedContext += ` (Tempo: ${pe.tempo})`;
                      if (pe.rest) enhancedContext += ` (Ανάπαυση: ${pe.rest})`;
                      if (pe.velocity_ms) enhancedContext += ` (Ταχύτητα: ${pe.velocity_ms}m/s)`;
                      if (pe.percentage_1rm) enhancedContext += ` (${pe.percentage_1rm}% 1RM)`;
                      if (pe.notes) enhancedContext += `\n        Σημειώσεις: ${pe.notes}`;
                    }
                  });
                });
              });
            });
          }
        });
      }

      // Process strength history (Force-Velocity data)
      if (platformData.strengthHistory && platformData.strengthHistory.length > 0) {
        enhancedContext += '\n\n💪 ΙΣΤΟΡΙΚΟ ΔΥΝΑΜΗΣ (FORCE-VELOCITY):';
        
        // Group by exercise
        const exerciseGroups = {};
        platformData.strengthHistory.forEach(attempt => {
          const exerciseName = attempt.exercises?.name || 'Άγνωστη Άσκηση';
          if (!exerciseGroups[exerciseName]) {
            exerciseGroups[exerciseName] = [];
          }
          exerciseGroups[exerciseName].push({
            weight: attempt.weight_kg,
            velocity: attempt.velocity_ms,
            date: attempt.strength_test_sessions?.test_date
          });
        });
        
        // Display grouped data
        Object.entries(exerciseGroups).forEach(([exercise, attempts]) => {
          enhancedContext += `\n\n${exercise}:`;
          attempts.slice(0, 5).forEach((attempt, index) => {
            enhancedContext += `\n  ${index + 1}. ${attempt.weight}kg @ ${attempt.velocity.toFixed(2)}m/s (${new Date(attempt.date).toLocaleDateString('el-GR')})`;
          });
        });
      }

      // Process endurance history
      if (platformData.enduranceHistory && platformData.enduranceHistory.length > 0) {
        enhancedContext += '\n\n🏃 ΙΣΤΟΡΙΚΟ ΑΝΤΟΧΗΣ:';
        
        platformData.enduranceHistory.slice(0, 5).forEach((test, index) => {
          const date = new Date(test.endurance_test_sessions?.test_date).toLocaleDateString('el-GR');
          enhancedContext += `\n\n${index + 1}. ${date}:`;
          
          if (test.vo2_max) enhancedContext += `\n  - VO2 Max: ${test.vo2_max}`;
          if (test.mas_kmh) enhancedContext += `\n  - MAS: ${test.mas_kmh} km/h`;
          if (test.max_hr) enhancedContext += `\n  - Max HR: ${test.max_hr} bpm`;
          if (test.resting_hr_1min) enhancedContext += `\n  - Resting HR: ${test.resting_hr_1min} bpm`;
          if (test.push_ups) enhancedContext += `\n  - Push-ups: ${test.push_ups}`;
          if (test.pull_ups) enhancedContext += `\n  - Pull-ups: ${test.pull_ups}`;
          if (test.crunches) enhancedContext += `\n  - Crunches: ${test.crunches}`;
          if (test.t2b) enhancedContext += `\n  - Toes-to-Bar: ${test.t2b}`;
          
          if (test.sprint_meters && test.sprint_seconds) {
            enhancedContext += `\n  - Sprint: ${test.sprint_meters}m σε ${test.sprint_seconds}s`;
            if (test.sprint_watt) enhancedContext += ` (${test.sprint_watt}W)`;
          }
          
          if (test.farmer_kg && test.farmer_meters) {
            enhancedContext += `\n  - Farmer's Walk: ${test.farmer_kg}kg για ${test.farmer_meters}m`;
            if (test.farmer_seconds) enhancedContext += ` σε ${test.farmer_seconds}s`;
          }
        });
      }

      // Process jump history
      if (platformData.jumpHistory && platformData.jumpHistory.length > 0) {
        enhancedContext += '\n\n🦘 ΙΣΤΟΡΙΚΟ ΑΛΜΑΤΩΝ:';
        
        platformData.jumpHistory.slice(0, 5).forEach((test, index) => {
          const date = new Date(test.jump_test_sessions?.test_date).toLocaleDateString('el-GR');
          enhancedContext += `\n\n${index + 1}. ${date}:`;
          
          if (test.non_counter_movement_jump) enhancedContext += `\n  - Non-CMJ: ${test.non_counter_movement_jump}cm`;
          if (test.counter_movement_jump) enhancedContext += `\n  - CMJ: ${test.counter_movement_jump}cm`;
          if (test.depth_jump) enhancedContext += `\n  - Depth Jump: ${test.depth_jump}cm`;
          if (test.broad_jump) enhancedContext += `\n  - Broad Jump: ${test.broad_jump}cm`;
          if (test.triple_jump_left) enhancedContext += `\n  - Triple Jump (Αριστερό): ${test.triple_jump_left}cm`;
          if (test.triple_jump_right) enhancedContext += `\n  - Triple Jump (Δεξί): ${test.triple_jump_right}cm`;
        });
      }

      // Process anthropometric history
      if (platformData.anthropometricHistory && platformData.anthropometricHistory.length > 0) {
        enhancedContext += '\n\n📏 ΙΣΤΟΡΙΚΟ ΣΩΜΑΤΟΜΕΤΡΙΚΩΝ:';
        
        platformData.anthropometricHistory.slice(0, 5).forEach((test, index) => {
          const date = new Date(test.anthropometric_test_sessions?.test_date).toLocaleDateString('el-GR');
          enhancedContext += `\n\n${index + 1}. ${date}:`;
          
          if (test.weight) enhancedContext += `\n  - Βάρος: ${test.weight}kg`;
          if (test.height) enhancedContext += `\n  - Ύψος: ${test.height}cm`;
          if (test.body_fat_percentage) enhancedContext += `\n  - Λίπος: ${test.body_fat_percentage}%`;
          if (test.muscle_mass_percentage) enhancedContext += `\n  - Μυϊκή Μάζα: ${test.muscle_mass_percentage}%`;
          if (test.visceral_fat_percentage) enhancedContext += `\n  - Σπλαχνικό Λίπος: ${test.visceral_fat_percentage}%`;
          if (test.bone_density) enhancedContext += `\n  - Οστική Πυκνότητα: ${test.bone_density}`;
          
          if (test.waist_circumference) enhancedContext += `\n  - Περίμετρος Μέσης: ${test.waist_circumference}cm`;
          if (test.hip_circumference) enhancedContext += `\n  - Περίμετρος Γοφού: ${test.hip_circumference}cm`;
          if (test.chest_circumference) enhancedContext += `\n  - Περίμετρος Στήθους: ${test.chest_circumference}cm`;
          if (test.arm_circumference) enhancedContext += `\n  - Περίμετρος Χεριού: ${test.arm_circumference}cm`;
          if (test.thigh_circumference) enhancedContext += `\n  - Περίμετρος Μηρού: ${test.thigh_circumference}cm`;
        });
      }
    }

    // Enhanced system prompt with real user data
    const systemPrompt = `Είσαι ο "RID AI Προπονητής", ένας εξειδικευμένος AI βοηθός για fitness και διατροφή. Έχεις ΠΛΗΡΗ και ΠΡΑΓΜΑΤΙΚΗ πρόσβαση στα δεδομένα του χρήστη από την πλατφόρμα.

${userName ? `Μιλάς με τον χρήστη: ${userName}` : ''}

🎯 ΚΥΡΙΟΣ ΣΤΟΧΟΣ ΣΟΥ:
Να παρέχεις ΕΞΑΤΟΜΙΚΕΥΜΕΝΕΣ διατροφικές και προπονητικές συμβουλές που βασίζονται στην ΤΡΕΧΟΥΣΑ κατάσταση του χρήστη.

📊 ΔΕΔΟΜΕΝΑ ΣΤΗ ΔΙΑΘΕΣΗ ΣΟΥ:
1. 📚 ΒΑΣΗ ΑΣΚΗΣΕΩΝ:
   - Πλήρης λίστα όλων των διαθέσιμων ασκήσεων του γυμναστηρίου
   - Κατηγορίες ασκήσεων (τύποι και ομάδες μυών)
   - Περιγραφές και λεπτομέρειες κάθε άσκησης

2. 🏋️ ΕΝΕΡΓΑ ΠΡΟΓΡΑΜΜΑΤΑ με:
   - Πλήρη δομή προπονήσεων (εβδομάδες, ημέρες, blocks, ασκήσεις)
   - Στατιστικά προόδου (ολοκληρωμένες/συνολικές/χαμένες προπονήσεις)
   - Επόμενες προπονήσεις και ημερομηνίες
   - Λεπτομέρειες ασκήσεων (sets, reps, kg, tempo, rest, velocity)
   
3. 💪 ΙΣΤΟΡΙΚΟ ΔΥΝΑΜΗΣ:
   - Force-Velocity δεδομένα
   - 1RM ιστορικό ανά άσκηση
   - Προοδος στη δύναμη
   
4. 🏃 ΙΣΤΟΡΙΚΟ ΑΝΤΟΧΗΣ:
   - VO2 Max, MAS
   - Καρδιακός ρυθμός
   - Push-ups, Pull-ups, Crunches
   
5. 🦘 ΙΣΤΟΡΙΚΟ ΑΛΜΑΤΩΝ:
   - CMJ, Non-CMJ, Depth Jump
   - Broad Jump, Triple Jump
   
6. 📏 ΣΩΜΑΤΟΜΕΤΡΙΚΑ:
   - Βάρος, Ύψος, Λίπος, Μυϊκή Μάζα
   - Περιμέτρους (μέση, γοφός, στήθος, χέρι, μηρός)

💬 ΤΡΟΠΟΣ ΕΠΙΚΟΙΝΩΝΙΑΣ:
- ΠΑΝΤΑ αναφέρεσαι στα ΣΥΓΚΕΚΡΙΜΕΝΑ δεδομένα που βλέπεις
- Όταν ο χρήστης αναφέρει μια άσκηση, αναγνώρισέ την από τη βάση ασκήσεων
- Μπορείς να προτείνεις ασκήσεις από τη βάση που ταιριάζουν στις ανάγκες του
- Προτείνε διατροφή που ταιριάζει με την ένταση και τον τύπο προπόνησης
- Αν έχει upper body σήμερα, διαφορετική διατροφή από legs day
- Χρησιμοποίησε τα στατιστικά για να δώσεις συγκεκριμένες συμβουλές
- Αναγνώρισε την πρόοδο και τις βελτιώσεις του
- Προτείνε προσαρμογές στο πρόγραμμα βάσει των αποτελεσμάτων
- Όταν προτείνεις ασκήσεις, χρησιμοποίησε τα ΑΚΡΙΒΗ ονόματα από τη βάση δεδομένων

${enhancedContext}

ΣΗΜΑΝΤΙΚΟ ΣΧΕΤΙΚΑ ΜΕ ΑΣΚΗΣΕΙΣ:
- Όταν αναφέρεις ασκήσεις, γράφε τις ΑΚΡΙΒΩΣ όπως εμφανίζονται στη βάση ασκήσεων
- Όταν ο χρήστης ρωτάει για μια άσκηση, ψάξε στη βάση ασκήσεων
- Μπορείς να προτείνεις εναλλακτικές ασκήσεις από την ίδια κατηγορία
- Αν προτείνεις ασκήσεις για block (π.χ. warm-up, main, cool-down), χρησιμοποίησε τις σωστές από τη βάση
- Κατανόησε τις κατηγορίες ασκήσεων για να δώσεις σωστές συμβουλές (π.χ. push, pull, legs, core)

Όταν συζητάς:
- Αναφέρου συγκεκριμένα στοιχεία από τα δεδομένα του χρήστη
- Δώσε εξατομικευμένες συμβουλές βάσει των τεστ και προπονήσεών του
- Πρότεινε βελτιώσεις στα προγράμματά του
- Ανάλυσε την πρόοδό του με βάση τα ιστορικά δεδομένα
- Σχολίασε τα workout stats του (ποσοστό ολοκλήρωσης, missed workouts κλπ)
- Όταν χρειάζεται, πρότεινε συγκεκριμένες ασκήσεις από τη βάση

Πάντα:
- Απαντάς στα ελληνικά
- Δίνεις συγκεκριμένες, εξατομικευμένες συμβουλές
- Αναφέρεις τα πραγματικά δεδομένα του χρήστη
- Χρησιμοποιείς τα ακριβή ονόματα ασκήσεων από τη βάση
- Είσαι φιλικός, υποστηρικτικός και motivational`;

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
