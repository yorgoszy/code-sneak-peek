import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Φόρτωση στοιχείων χρήστη
    const userDataResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/app_users?id=eq.${userId}&select=*`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const userData = await userDataResponse.json();
    const userProfile = userData[0] || {};

    // Φόρτωση ΟΛΩΝ των assignments για το ημερολόγιο (active και completed)
    const assignmentsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/program_assignments?user_id=eq.${userId}&status=in.(active,completed)&select=*`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const assignments = await assignmentsResponse.json();
    console.log('📊 Assignments loaded:', Array.isArray(assignments) ? assignments.length : 0);

    // Φόρτωση προγραμμάτων με πλήρη δομή
    const programIds = Array.isArray(assignments) ? assignments.map((a: any) => a.program_id).filter(Boolean) : [];
    let programsData: any[] = [];
    if (programIds.length > 0) {
      const programsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/programs?id=in.(${programIds.join(',')})&select=id,name,description,training_days,program_weeks!fk_program_weeks_program_id(id,name,week_number,program_days!fk_program_days_week_id(id,name,day_number,estimated_duration_minutes,is_test_day,test_types,is_competition_day,program_blocks!fk_program_blocks_day_id(id,name,block_order,program_exercises!fk_program_exercises_block_id(id,sets,reps,kg,tempo,rest,notes,exercise_order,exercises!fk_program_exercises_exercise_id(id,name,description,video_url)))))`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      programsData = await programsResponse.json();
      console.log('📊 Programs with full structure loaded:', Array.isArray(programsData) ? programsData.length : 0);
    }

    // Φόρτωση app_users
    const userIds = Array.isArray(assignments) ? assignments.map((a: any) => a.user_id).filter(Boolean) : [];
    let usersData: any[] = [];
    if (userIds.length > 0) {
      const usersResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/app_users?id=in.(${userIds.join(',')})&select=id,name,email,photo_url`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      usersData = await usersResponse.json();
      console.log('📊 Users loaded:', Array.isArray(usersData) ? usersData.length : 0);
    }

    // Συνδυασμός assignments με programs και users
    const enrichedAssignments = Array.isArray(assignments) ? assignments.map((assignment: any) => {
      const program = Array.isArray(programsData) ? programsData.find((p: any) => p.id === assignment.program_id) : null;
      const user = Array.isArray(usersData) ? usersData.find((u: any) => u.id === assignment.user_id) : null;
      return {
        ...assignment,
        programs: program,
        app_users: user
      };
    }) : [];

    // Φόρτωση workout completions και attendance stats
    const workoutStatsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/program_assignments?user_id=eq.${userId}&select=id,training_dates,status,start_date,end_date,programs!fk_program_assignments_program_id(name),assignment_attendance(completed_workouts,missed_workouts,makeup_workouts,total_scheduled_workouts,attendance_percentage)`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const workoutStatsData = await workoutStatsResponse.json();
    console.log('📊 Workout Stats loaded:', Array.isArray(workoutStatsData) ? workoutStatsData.length : 0);
    
    // Φόρτωση workout completions για λεπτομερή στατιστικά
    const workoutCompletionsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/workout_completions?user_id=eq.${userId}&order=created_at.desc&limit=100&select=*`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    
    if (!workoutCompletionsResponse.ok) {
      console.error('❌ Workout completions fetch failed:', workoutCompletionsResponse.status, await workoutCompletionsResponse.text());
    }
    
    const workoutCompletionsData = await workoutCompletionsResponse.json();
    const workoutCompletions = Array.isArray(workoutCompletionsData) ? workoutCompletionsData : [];
    console.log('📊 Workout Stats:', JSON.stringify(workoutStatsData, null, 2));
    console.log('📊 Workout Completions Count:', workoutCompletions.length);
    console.log('📊 Workout Completions Sample:', JSON.stringify(workoutCompletions.slice(0, 3), null, 2));

    // Φόρτωση ιστορικού δύναμης μέσω sessions
    const strengthResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/strength_test_sessions?select=test_date,strength_test_attempts(weight_kg,velocity_ms,is_1rm,exercises(name))&user_id=eq.${userId}&order=test_date.desc&limit=20`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const strengthHistory = await strengthResponse.json();
    console.log('✅ Strength History:', JSON.stringify(strengthHistory, null, 2));

    // Φόρτωση ιστορικού αντοχής
    const enduranceResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/endurance_test_data?select=id,created_at,vo2_max,mas_kmh,sprint_watt,push_ups,pull_ups,crunches,endurance_test_sessions!inner(user_id,test_date)&endurance_test_sessions.user_id=eq.${userId}&order=created_at.desc&limit=10`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const enduranceHistory = await enduranceResponse.json();

    // Φόρτωση ιστορικού άλματος
    const jumpResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/jump_test_data?select=id,created_at,counter_movement_jump,non_counter_movement_jump,broad_jump,triple_jump_left,triple_jump_right,jump_test_sessions!inner(user_id,test_date)&jump_test_sessions.user_id=eq.${userId}&order=created_at.desc&limit=10`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const jumpHistory = await jumpResponse.json();

    // Φόρτωση ανθρωπομετρικού ιστορικού
    const anthropometricResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/anthropometric_test_data?select=id,created_at,height,weight,body_fat_percentage,muscle_mass_percentage,waist_circumference,chest_circumference,anthropometric_test_sessions!inner(user_id,test_date)&anthropometric_test_sessions.user_id=eq.${userId}&order=created_at.desc&limit=10`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const anthropometricHistory = await anthropometricResponse.json();

    // Δημιουργία context για ασκήσεις
    let exerciseContext = '';
    if (Array.isArray(programsData) && programsData.length > 0) {
      const exercises = new Set<string>();
      programsData.forEach((assignment: any) => {
        assignment.programs?.program_weeks?.forEach((week: any) => {
          week.program_days?.forEach((day: any) => {
            day.program_blocks?.forEach((block: any) => {
              block.program_exercises?.forEach((pe: any) => {
                if (pe.exercises?.name) {
                  exercises.add(`- ${pe.exercises.name}${pe.exercises.description ? `: ${pe.exercises.description}` : ''}`);
                }
              });
            });
          });
        });
      });
      if (exercises.size > 0) {
        exerciseContext = `\n\nΟι ασκήσεις που έχεις στα προγράμματά σου:\n${Array.from(exercises).join('\n')}`;
      }
    }

    // Context για προγράμματα και ημερολόγιο
    let programContext = '';
    let calendarContext = '';
    
    if (Array.isArray(enrichedAssignments) && enrichedAssignments.length > 0) {
      // Συλλογή όλων των προγραμματισμένων ημερομηνιών με status
      const allProgramDates: any[] = [];
      
      enrichedAssignments.forEach((assignment: any) => {
        if (assignment.training_dates && assignment.programs && assignment.app_users) {
          assignment.training_dates.forEach((dateStr: string) => {
            const completion = workoutCompletions.find((c: any) => 
              c.assignment_id === assignment.id && c.scheduled_date === dateStr
            );
            allProgramDates.push({
              date: dateStr,
              status: completion?.status || 'scheduled',
              programName: assignment.programs.name,
              userName: assignment.app_users.name,
              assignmentId: assignment.id
            });
          });
        }
      });
      
      // Ταξινόμηση κατά ημερομηνία
      allProgramDates.sort((a, b) => a.date.localeCompare(b.date));
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Χωρισμός σε παρελθόν, σήμερα, μέλλον
      const pastWorkouts = allProgramDates.filter(d => d.date < todayStr);
      const todaysWorkouts = allProgramDates.filter(d => d.date === todayStr);
      const futureWorkouts = allProgramDates.filter(d => d.date > todayStr);
      
      // Τελευταίες 5 προπονήσεις
      const recentWorkouts = pastWorkouts.slice(-5);
      
      // Επόμενες 5 προπονήσεις
      const upcomingWorkouts = futureWorkouts.slice(0, 5);
      
      // Calendar context
      const calendarStats = {
        totalScheduled: allProgramDates.length,
        completed: allProgramDates.filter(d => d.status === 'completed').length,
        missed: allProgramDates.filter(d => d.status === 'missed').length,
        scheduled: allProgramDates.filter(d => d.status === 'scheduled').length
      };
      
      calendarContext = `\n\nΗμερολόγιο Προπονήσεων:\n- Σύνολο προγραμματισμένων: ${calendarStats.totalScheduled}\n- Ολοκληρωμένες: ${calendarStats.completed}\n- Χαμένες: ${calendarStats.missed}\n- Προγραμματισμένες (εκκρεμείς): ${calendarStats.scheduled}`;
      
      if (todaysWorkouts.length > 0) {
        const todaysList = todaysWorkouts.map((w: any) => 
          `- ${w.programName} (${w.status === 'completed' ? '✓ Ολοκληρωμένη' : w.status === 'missed' ? '✗ Χαμένη' : 'Προγραμματισμένη σήμερα'})`
        ).join('\n');
        calendarContext += `\n\nΣήμερα (${todayStr}):\n${todaysList}`;
      }
      
      if (recentWorkouts.length > 0) {
        const recentList = recentWorkouts.map((w: any) => 
          `- ${w.date}: ${w.programName} (${w.status === 'completed' ? '✓' : w.status === 'missed' ? '✗' : '?'})`
        ).join('\n');
        calendarContext += `\n\nΤελευταίες προπονήσεις:\n${recentList}`;
      }
      
      if (upcomingWorkouts.length > 0) {
        const upcomingList = upcomingWorkouts.map((w: any) => 
          `- ${w.date}: ${w.programName}`
        ).join('\n');
        calendarContext += `\n\nΕπόμενες προπονήσεις:\n${upcomingList}`;
      }
      
      // Program context
      const programsList = enrichedAssignments.map((assignment: any) => {
        const program = assignment.programs;
        const totalWeeks = program?.program_weeks?.length || 0;
        const totalDays = program?.program_weeks?.reduce((sum: number, w: any) => sum + (w.program_days?.length || 0), 0) || 0;
        const status = assignment.status || 'active';
        const trainingDates = assignment.training_dates?.length || 0;
        const completedDates = assignment.training_dates?.filter((d: string) => 
          workoutCompletions.some((c: any) => c.assignment_id === assignment.id && c.scheduled_date === d && c.status === 'completed')
        ).length || 0;
        return `- ${program?.name || 'Πρόγραμμα'} (${status}): ${totalWeeks} εβδομάδες, ${totalDays} ημέρες προπόνησης, ${completedDates}/${trainingDates} ολοκληρωμένες${program?.description ? ` - ${program.description}` : ''}`;
      }).join('\n');
      programContext = `\n\nΤα προγράμματά σου:\n${programsList}`;
    }
    
    // Context για workout stats
    let workoutStatsContext = '';
    if (Array.isArray(workoutStatsData) && workoutStatsData.length > 0) {
      const today = new Date();
      const last7Days = new Date(today);
      last7Days.setDate(today.getDate() - 7);
      const last30Days = new Date(today);
      last30Days.setDate(today.getDate() - 30);
      
      // Υπολογισμός stats ανά περίοδο
      const completionsLast7 = workoutCompletions.filter((c: any) => 
        c.status === 'completed' && c.completed_date && new Date(c.completed_date) >= last7Days
      ).length;
      const completionsLast30 = workoutCompletions.filter((c: any) => 
        c.status === 'completed' && c.completed_date && new Date(c.completed_date) >= last30Days
      ).length;
      const missedLast7 = workoutCompletions.filter((c: any) => 
        c.status === 'missed' && c.scheduled_date && new Date(c.scheduled_date) >= last7Days
      ).length;
      const missedLast30 = workoutCompletions.filter((c: any) => 
        c.status === 'missed' && c.scheduled_date && new Date(c.scheduled_date) >= last30Days
      ).length;
      
      const statsList = workoutStatsData.map((assignment: any) => {
        const programName = assignment.programs?.name || 'Πρόγραμμα';
        const trainingDates = assignment.training_dates?.length || 0;
        const attendance = assignment.assignment_attendance?.[0];
        if (attendance) {
          const percentage = Math.round(attendance.attendance_percentage || 0);
          return `\n${programName}:\n- Σύνολο προγραμματισμένων: ${trainingDates} ημέρες\n- Ολοκληρωμένες: ${attendance.completed_workouts}\n- Χαμένες: ${attendance.missed_workouts}\n- Αναπλήρωση: ${attendance.makeup_workouts}\n- Ποσοστό παρουσίας: ${percentage}%`;
        }
        return `\n${programName}: ${trainingDates} προγραμματισμένες ημέρες`;
      }).filter(Boolean).join('\n');
      
      workoutStatsContext = `\n\nΣτατιστικά Προπονήσεων:${statsList}\n\nΤελευταία 7 ημέρες:\n- Ολοκληρωμένες: ${completionsLast7}\n- Χαμένες: ${missedLast7}\n\nΤελευταίος μήνας (30 ημέρες):\n- Ολοκληρωμένες: ${completionsLast30}\n- Χαμένες: ${missedLast30}\n\nΣύνολο workout completions: ${workoutCompletions.length}`;
    }

    // Context για δύναμη
    let strengthContext = '';
    if (Array.isArray(strengthHistory) && strengthHistory.length > 0) {
      const attempts: any[] = [];
      strengthHistory.forEach((session: any) => {
        if (session.strength_test_attempts && Array.isArray(session.strength_test_attempts)) {
          session.strength_test_attempts.forEach((attempt: any) => {
            attempts.push({
              ...attempt,
              test_date: session.test_date
            });
          });
        }
      });
      
      if (attempts.length > 0) {
        const strengthList = attempts.map((attempt: any) => {
          const is1rm = attempt.is_1rm ? ' (1RM)' : '';
          return `- ${attempt.exercises?.name || 'Άσκηση'}: ${attempt.weight_kg}kg, Ταχύτητα: ${attempt.velocity_ms}m/s${is1rm} (${new Date(attempt.test_date).toLocaleDateString('el-GR')})`;
        }).join('\n');
        strengthContext = `\n\nΙστορικό Δύναμης:\n${strengthList}`;
      }
    }

    // Context για αντοχή
    let enduranceContext = '';
    if (Array.isArray(enduranceHistory) && enduranceHistory.length > 0) {
      const enduranceList = enduranceHistory.map((test: any) => {
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

    // Context για άλματα
    let jumpContext = '';
    if (Array.isArray(jumpHistory) && jumpHistory.length > 0) {
      const jumpList = jumpHistory.map((test: any) => {
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

    // Context για ανθρωπομετρικά
    let anthropometricContext = '';
    if (Array.isArray(anthropometricHistory) && anthropometricHistory.length > 0) {
      const anthropometricList = anthropometricHistory.map((test: any) => {
        const parts = [];
        if (test.weight) parts.push(`Βάρος: ${test.weight}kg`);
        if (test.body_fat_percentage) parts.push(`Λίπος: ${test.body_fat_percentage}%`);
        if (test.muscle_mass_percentage) parts.push(`Μυϊκή Μάζα: ${test.muscle_mass_percentage}%`);
        const date = test.anthropometric_test_sessions?.[0]?.test_date || test.created_at;
        return `- ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})`;
      }).join('\n');
      anthropometricContext = `\n\nΑνθρωπομετρικό Ιστορικό:\n${anthropometricList}`;
    }

    // Αποθήκευση μηνύματος χρήστη
    const userMessage = messages[messages.length - 1];
    if (userMessage.role === "user") {
      await fetch(`${SUPABASE_URL}/rest/v1/ai_conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          user_id: userId,
          content: userMessage.content,
          message_type: "user",
          metadata: {}
        })
      });
    }

    // Φόρτωση ιστορικού συνομιλιών
    const historyResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_conversations?user_id=eq.${userId}&order=created_at.asc&limit=50`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    const conversationHistory = await historyResponse.json();

    // Μετατροπή ιστορικού σε μορφή για το AI
    const historyMessages = conversationHistory.map((msg: any) => ({
      role: msg.message_type === "user" ? "user" : "assistant",
      content: msg.content
    }));

    // System prompt με πληροφορίες για τον χρήστη
    const systemPrompt = {
      role: "system",
      content: `Είσαι ο RID AI Προπονητής, ένας εξειδικευμένος AI βοηθός για fitness και διατροφή. Έχεις πρόσβαση στα προγράμματα, τις ασκήσεις, και το πλήρες ιστορικό προόδου του χρήστη.
      
Χρησιμοποιείς την προσωπική φιλοσοφία "RID System" που βασίζεται σε:
- Recovery (Αποκατάσταση): Ύπνος, διατροφή, ξεκούραση
- Intensity (Ένταση): Σωστή ένταση στην προπόνηση
- Duration (Διάρκεια): Σωστή διάρκεια προπόνησης

Βοηθάς με:
1. Διατροφικές συμβουλές και σχεδιασμό γευμάτων
2. Ασκησιολογικές συμβουλές και τεχνικές
3. Αξιολόγηση αποτελεσμάτων τεστ και ανάλυση προόδου
4. Προγραμματισμό προπονήσεων
5. Αποκατάσταση και πρόληψη τραυματισμών
6. Συμβουλές για τις συγκεκριμένες ασκήσεις που έχει ο χρήστης
7. Ανάλυση της εξέλιξης και σύγκριση αποτελεσμάτων
      
${userProfile.name ? `\n\nΜιλάς με: ${userProfile.name}` : ''}${userProfile.birth_date ? `\nΗλικία: ${new Date().getFullYear() - new Date(userProfile.birth_date).getFullYear()} ετών` : ''}${exerciseContext}${programContext}${calendarContext}${workoutStatsContext}${strengthContext}${enduranceContext}${jumpContext}${anthropometricContext}

ΣΗΜΑΝΤΙΚΟ: Έχεις πρόσβαση στο ΠΛΗΡΕΣ ιστορικό και ημερολόγιο του χρήστη. Μπορείς να:
- Αναλύσεις την πρόοδό του στη δύναμη (1RM, ταχύτητα)
- Δεις την εξέλιξη της αντοχής του (VO2max, MAS, sprint)
- Παρακολουθήσεις τα άλματά του (CMJ, broad jump, triple jumps)
- Εντοπίσεις αλλαγές στο σωματικό του σύνθεμα (βάρος, λίπος, μυϊκή μάζα)
- Συγκρίνεις αποτελέσματα μεταξύ διαφορετικών περιόδων
- Εντοπίσεις τάσεις και patterns στην πρόοδό του
- Δεις τα στατιστικά προπονήσεων του (ημερήσια, εβδομαδιαία, μηνιαία)
- Αναλύσεις την παρουσία και συνέπειά του στις προπονήσεις
- Εντοπίσεις patterns σε χαμένες προπονήσεις ή αναπληρώσεις
- Δεις το ημερολόγιο προπονήσεων (προγραμματισμένες, ολοκληρωμένες, χαμένες)
- Αναλύσεις την πρόοδό του ανά εβδομάδα/μήνα βάσει του ημερολογίου
- Προτείνεις ημερομηνίες για προπονήσεις βάσει του προγράμματός του

Οι απαντήσεις σου πρέπει να είναι:
- Προσωπικές και βασισμένες στα ΠΡΑΓΜΑΤΙΚΑ δεδομένα του χρήστη
- Φιλικές και εμπνευσμένες από την εμπειρία και τις ανάγκες του
- Συγκεκριμένες και εφαρμόσιμες
- Σύντομες (2-3 παράγραφοι max)
- Βασισμένες στο ιστορικό συνομιλιών

Όταν αναφέρεις ασκήσεις, γράφε τες ΑΚΡΙΒΩΣ με το format:
"Άσκηση: [Όνομα Άσκησης]"

Όταν συζητάς για πρόοδο:
- Αναφέρου συγκεκριμένα νούμερα από το ιστορικό
- Σύγκρινε παλιότερα με πρόσφατα αποτελέσματα
- Εντόπισε βελτιώσεις ή περιοχές που χρειάζονται προσοχή
- Δώσε συγκεκριμένες συμβουλές βασισμένες στα δεδομένα

Θυμάσαι όλες τις προηγούμενες συνομιλίες και χρησιμοποιείς αυτές τις πληροφορίες για να δίνεις καλύτερες συμβουλές.`
    };

    // Κλήση Lovable AI με όλο το ιστορικό
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [systemPrompt, ...historyMessages, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Streaming response
    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  }
                } catch (e) {
                  // Ignore parse errors for incomplete chunks
                }
              }
            }
          }

          // Αποθήκευση απάντησης AI
          await fetch(`${SUPABASE_URL}/rest/v1/ai_conversations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Prefer": "return=minimal"
            },
            body: JSON.stringify({
              user_id: userId,
              content: fullResponse,
              message_type: "assistant",
              metadata: {}
            })
          });

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("RID AI coach error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
