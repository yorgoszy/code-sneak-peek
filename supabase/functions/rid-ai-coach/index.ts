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
    const { messages, userId, targetUserId: rawTargetUserId, userContext } = await req.json();
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Normalize targetUserId: empty string -> undefined
    const targetUserId = rawTargetUserId && rawTargetUserId.trim() !== '' ? rawTargetUserId : undefined;

    console.log('📝 Request received:', { 
      userId, 
      targetUserId,
      isTargetUserIdEmpty: !targetUserId,
      messageCount: messages?.length,
      hasUserContext: !!userContext,
      userContext: userContext
    });

    // Δήλωση environment variables ΠΡΩΤΑ
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Έλεγχος αν ο χρήστης είναι admin
    const callerUserResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/app_users?id=eq.${userId}&select=role`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const callerUserData = await callerUserResponse.json();
    const isAdmin = callerUserData[0]?.role === 'admin';

    // Αν είναι admin και έχει δώσει targetUserId, χρησιμοποιούμε αυτό
    // Αλλιώς χρησιμοποιούμε το δικό του userId
    const effectiveUserId = (isAdmin && targetUserId) ? targetUserId : userId;

    // 🔥 ADMIN CONTEXT: Φόρτωση ΟΛΩΝ των active programs αν είναι admin
    let adminActiveProgramsContext = '';
    if (isAdmin && !targetUserId) {
      // Φόρτωση ΟΛΩΝ των active assignments (για όλους τους χρήστες)
      const allAssignmentsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/program_assignments?status=in.(active,completed)&end_date=gte.${new Date().toISOString().split('T')[0]}&select=*`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const allAssignments = await allAssignmentsResponse.json();
      
      if (Array.isArray(allAssignments) && allAssignments.length > 0) {
        console.log(`✅ Admin Mode: Found ${allAssignments.length} active assignments`);
        
        // Φόρτωση programs
        const allProgramIds = allAssignments.map((a: any) => a.program_id).filter(Boolean);
        console.log(`📊 Loading ${allProgramIds.length} programs`);
        const allProgramsResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/programs?id=in.(${allProgramIds.join(',')})&select=id,name,description`,
          {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }
        );
        const allProgramsData = await allProgramsResponse.json();
        
        // Φόρτωση users με ημερομηνία εγγραφής
        const allUserIds = allAssignments.map((a: any) => a.user_id).filter(Boolean);
        const allUsersResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/app_users?id=in.(${allUserIds.join(',')})&select=id,name,email,created_at`,
          {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }
        );
        const allUsersData = await allUsersResponse.json();
        
        // Φόρτωση workout completions για ΟΛΕΣ τις αναθέσεις
        const allAssignmentIds = allAssignments.map((a: any) => a.id);
        const allCompletionsResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/workout_completions?assignment_id=in.(${allAssignmentIds.join(',')})&select=*`,
          {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }
        );
        const allCompletions = await allCompletionsResponse.json();
        
        // 🏋️ Φόρτωση ΠΛΗΡΟΥΣ ΔΟΜΗΣ προγραμμάτων (weeks, days, blocks, exercises)
        const weeksResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/program_weeks?program_id=in.(${allProgramIds.join(',')})&select=*&order=week_number.asc`,
          {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }
        );
        const weeksJsonData = await weeksResponse.json();
        const allWeeksData = Array.isArray(weeksJsonData) ? weeksJsonData : [];
        console.log(`✅ Loaded ${allWeeksData.length} weeks`);
        
        if (allWeeksData.length === 0) {
          console.log('⚠️ No weeks found for programs');
          adminActiveProgramsContext = '\n\n🎯 ΕΝΕΡΓΑ ΠΡΟΓΡΑΜΜΑΤΑ: Δεν βρέθηκαν εβδομάδες στα προγράμματα';
        } else {
        
        const allWeekIds = allWeeksData.map((w: any) => w.id);
        
        const daysResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/program_days?week_id=in.(${allWeekIds.join(',')})&select=*&order=day_number.asc`,
          {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }
        );
        const daysJsonData = await daysResponse.json();
        const allDaysData = Array.isArray(daysJsonData) ? daysJsonData : [];
        console.log(`✅ Loaded ${allDaysData.length} days`);
        
        const allDayIds = allDaysData.length > 0 ? allDaysData.map((d: any) => d.id) : [];
        
        const blocksResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/program_blocks?day_id=in.(${allDayIds.join(',')})&select=*&order=block_order.asc`,
          {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }
        );
        const blocksJsonData = await blocksResponse.json();
        const allBlocksData = Array.isArray(blocksJsonData) ? blocksJsonData : [];
        console.log(`✅ Loaded ${allBlocksData.length} blocks`);
        
        const allBlockIds = allBlocksData.length > 0 ? allBlocksData.map((b: any) => b.id) : [];
        
        // Χωρισμός σε batches για να αποφύγουμε πολύ μεγάλο URL
        const allProgramExercisesData: any[] = [];
        const batchSize = 25; // Μικρότερο batch για μεγάλους πίνακες
        
        for (let i = 0; i < allBlockIds.length; i += batchSize) {
          const batchIds = allBlockIds.slice(i, i + batchSize);
          const programExercisesResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/program_exercises?block_id=in.(${batchIds.join(',')})&select=*&order=exercise_order.asc`,
            {
              headers: {
                "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              }
            }
          );
          const programExercisesJsonData = await programExercisesResponse.json();
          if (Array.isArray(programExercisesJsonData)) {
            allProgramExercisesData.push(...programExercisesJsonData);
          }
        }
        
        console.log(`✅ Loaded ${allProgramExercisesData.length} program exercises`);
        
        const allExerciseIds = allProgramExercisesData.length > 0 
          ? [...new Set(allProgramExercisesData.map((pe: any) => pe.exercise_id).filter(Boolean))]
          : [];
        
        const exercisesResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/exercises?id=in.(${allExerciseIds.join(',')})&select=id,name,description`,
          {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }
        );
        const exercisesJsonData = await exercisesResponse.json();
        const allExercisesData = Array.isArray(exercisesJsonData) ? exercisesJsonData : [];
        console.log(`✅ Loaded ${allExercisesData.length} exercises`);
        
        // Δημιουργία summary
        const activeProgramsSummary = allAssignments.map((assignment: any) => {
          const program = Array.isArray(allProgramsData) ? allProgramsData.find((p: any) => p.id === assignment.program_id) : null;
          const user = Array.isArray(allUsersData) ? allUsersData.find((u: any) => u.id === assignment.user_id) : null;
          
          const assignmentCompletions = Array.isArray(allCompletions) 
            ? allCompletions.filter((c: any) => c.assignment_id === assignment.id)
            : [];
          
          const totalScheduled = assignment.training_dates?.length || 0;
          const completed = assignmentCompletions.filter((c: any) => c.status === 'completed').length;
          const missed = assignmentCompletions.filter((c: any) => c.status === 'missed').length;
          
          // Υπολογισμός σημερινών προπονήσεων
          const today = new Date().toISOString().split('T')[0];
          const hasTodayWorkout = assignment.training_dates?.includes(today);
          const todayCompletion = assignmentCompletions.find((c: any) => c.scheduled_date === today);
          const todayStatus = todayCompletion ? todayCompletion.status : (hasTodayWorkout ? 'scheduled' : null);
          
          return {
            userName: user?.name || 'Unknown',
            userEmail: user?.email || '',
            programName: program?.name || 'Unknown Program',
            status: assignment.status,
            progress: `${completed}/${totalScheduled} προπονήσεις (${missed} χαμένες)`,
            startDate: assignment.start_date,
            endDate: assignment.end_date,
            todayStatus: todayStatus
          };
        });
        
        // Group by status
        const activePrograms = activeProgramsSummary.filter(p => p.status === 'active');
        const completedPrograms = activeProgramsSummary.filter(p => p.status === 'completed');
        
        // Today's workouts
        const todaysWorkouts = activeProgramsSummary.filter(p => p.todayStatus);
        const todaysCompleted = todaysWorkouts.filter(p => p.todayStatus === 'completed');
        const todaysPending = todaysWorkouts.filter(p => p.todayStatus === 'scheduled');
        
        adminActiveProgramsContext = `\n\n🎯 ΕΝΕΡΓΑ ΠΡΟΓΡΑΜΜΑΤΑ (Admin Dashboard):
        
📊 Συνολική Επισκόπηση:
- Ενεργά Προγράμματα: ${activePrograms.length}
- Ολοκληρωμένα Προγράμματα: ${completedPrograms.length}
- Σύνολο: ${activeProgramsSummary.length}

📅 Σημερινές Προπονήσεις (${new Date().toLocaleDateString('el-GR')}):
- Σύνολο: ${todaysWorkouts.length}
- Ολοκληρωμένες: ${todaysCompleted.length}
- Εκκρεμείς: ${todaysPending.length}

👥 Ενεργά Προγράμματα Ανά Αθλητή:
${activePrograms.map((p, i) => `${i + 1}. ${p.userName} (${p.userEmail})
   - Πρόγραμμα: ${p.programName}
   - Πρόοδος: ${p.progress}
   - Περίοδος: ${p.startDate} έως ${p.endDate}
   - Σήμερα: ${p.todayStatus === 'completed' ? '✅ Ολοκληρώθηκε' : p.todayStatus === 'scheduled' ? '⏳ Προγραμματισμένη' : '➖ Χωρίς προπόνηση'}`).join('\n\n')}

${completedPrograms.length > 0 ? `\n✅ Πρόσφατα Ολοκληρωμένα:
${completedPrograms.slice(0, 5).map((p, i) => `${i + 1}. ${p.userName} - ${p.programName} (${p.progress})`).join('\n')}` : ''}

📊 RPE ANALYSIS (Όλες οι προπονήσεις):
${(() => {
  const completionsWithRpe = Array.isArray(allCompletions) 
    ? allCompletions.filter((c: any) => c.rpe_score !== null && c.rpe_score !== undefined)
    : [];
  if (completionsWithRpe.length === 0) return '- Δεν υπάρχουν καταγραφές RPE';
  
  const avgRpe = (completionsWithRpe.reduce((sum: number, c: any) => sum + (c.rpe_score || 0), 0) / completionsWithRpe.length).toFixed(1);
  
  // Group by user
  const rpeByUser: { [userId: string]: { scores: number[], userName: string } } = {};
  completionsWithRpe.forEach((c: any) => {
    const user = Array.isArray(allUsersData) ? allUsersData.find((u: any) => u.id === c.user_id) : null;
    if (!rpeByUser[c.user_id]) {
      rpeByUser[c.user_id] = { scores: [], userName: user?.name || 'Unknown' };
    }
    rpeByUser[c.user_id].scores.push(c.rpe_score);
  });
  
  const userRpeSummary = Object.values(rpeByUser)
    .map((u: any) => `  - ${u.userName}: Μέσος RPE ${(u.scores.reduce((a: number, b: number) => a + b, 0) / u.scores.length).toFixed(1)} (${u.scores.length} καταγραφές)`)
    .join('\n');
  
  // Latest 10 RPE entries
  const latestRpe = completionsWithRpe
    .sort((a: any, b: any) => new Date(b.scheduled_date || b.completed_date).getTime() - new Date(a.scheduled_date || a.completed_date).getTime())
    .slice(0, 10)
    .map((c: any) => {
      const user = Array.isArray(allUsersData) ? allUsersData.find((u: any) => u.id === c.user_id) : null;
      const date = c.scheduled_date || c.completed_date;
      return `  - ${new Date(date).toLocaleDateString('el-GR')}: ${user?.name || 'Unknown'} - RPE ${c.rpe_score}`;
    }).join('\n');
  
  return `- Μέσος όρος RPE (όλοι): ${avgRpe}
- Σύνολο καταγραφών: ${completionsWithRpe.length}

RPE ανά Αθλητή:
${userRpeSummary}

Τελευταίες 10 καταγραφές RPE:
${latestRpe}`;
})()}`;

        // 📅 CALENDAR VIEW: Δημιουργία λεπτομερούς ημερολογίου
        // Group workouts by date
        const workoutsByDate: { [date: string]: Array<{userName: string, programName: string, status: string}> } = {};
        
        allAssignments.forEach((assignment: any) => {
          const program = Array.isArray(allProgramsData) ? allProgramsData.find((p: any) => p.id === assignment.program_id) : null;
          const user = Array.isArray(allUsersData) ? allUsersData.find((u: any) => u.id === assignment.user_id) : null;
          
          if (assignment.training_dates && program && user) {
            assignment.training_dates.forEach((dateStr: string) => {
              if (!workoutsByDate[dateStr]) {
                workoutsByDate[dateStr] = [];
              }
              
              const completion = Array.isArray(allCompletions) 
                ? allCompletions.find((c: any) => c.assignment_id === assignment.id && c.scheduled_date === dateStr)
                : null;
              
              const status = completion?.status || 'scheduled';
              const rpe = completion?.rpe_score || null;
              
              workoutsByDate[dateStr].push({
                userName: user.name || 'Unknown',
                programName: program.name || 'Unknown Program',
                status: status,
                rpe: rpe
              });
            });
          }
        });
        
        // Ταξινόμηση ημερομηνιών
        const sortedDates = Object.keys(workoutsByDate).sort();
        const today = new Date().toISOString().split('T')[0];
        
        // Παρελθόν, Σήμερα, Μέλλον
        const pastDates = sortedDates.filter(d => d < today);
        const futureDates = sortedDates.filter(d => d > today);
        const todayDate = sortedDates.find(d => d === today);
        
        // Πάρε τελευταίες 7 μέρες και επόμενες 14 μέρες
        const recentPast = pastDates.slice(-7);
        const upcomingFuture = futureDates.slice(0, 14);
        
        const calendarDisplay = [...recentPast, ...(todayDate ? [todayDate] : []), ...upcomingFuture]
          .map(dateStr => {
            const workouts = workoutsByDate[dateStr];
            const dateObj = new Date(dateStr);
            const formattedDate = dateObj.toLocaleDateString('el-GR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
            const isTodayDate = dateStr === today;
            
            const workoutsList = workouts.map(w => {
              const statusIcon = w.status === 'completed' ? '✅' : w.status === 'missed' ? '❌' : '📅';
              const rpeText = w.rpe ? ` (RPE: ${w.rpe})` : '';
              return `      ${statusIcon} ${w.userName} - ${w.programName}${rpeText}`;
            }).join('\n');
            
            const totalCount = workouts.length;
            const completedCount = workouts.filter(w => w.status === 'completed').length;
            const missedCount = workouts.filter(w => w.status === 'missed').length;
            const scheduledCount = workouts.filter(w => w.status === 'scheduled').length;
            
            return `${isTodayDate ? '🔥 ' : ''}${formattedDate} (${totalCount} προπονήσεις - ✅${completedCount} ❌${missedCount} 📅${scheduledCount}):
${workoutsList}`;
          })
          .join('\n\n');
        
        adminActiveProgramsContext += `\n\n📅 ΗΜΕΡΟΛΟΓΙΟ ΠΡΟΠΟΝΗΣΕΩΝ (Calendar View):
${calendarDisplay}`;
        
        // 📋 ΛΕΠΤΟΜΕΡΕΙΣ ΠΡΟΠΟΝΗΣΕΙΣ (DayProgramCard Details)
        // Δημιουργία λεπτομερούς context για όλες τις ημέρες όλων των προγραμμάτων
        let detailedWorkoutsContext = '\n\n📋 ΛΕΠΤΟΜΕΡΗΣ ΠΡΟΒΟΛΗ ΠΡΟΠΟΝΗΣΕΩΝ (Όλες οι DayProgramCard):\n\n';
        
        if (Array.isArray(allAssignments) && Array.isArray(allWeeksData) && Array.isArray(allDaysData) && 
            Array.isArray(allBlocksData) && Array.isArray(allProgramExercisesData) && Array.isArray(allExercisesData)) {
          
          allAssignments.forEach((assignment: any) => {
            const program = Array.isArray(allProgramsData) ? allProgramsData.find((p: any) => p.id === assignment.program_id) : null;
            const user = Array.isArray(allUsersData) ? allUsersData.find((u: any) => u.id === assignment.user_id) : null;
            
            if (!program || !user || !assignment.training_dates) return;
            
            detailedWorkoutsContext += `\n🏃 ${user.name} - ${program.name}:\n`;
            
            // Map training dates to days
            const programWeeks = allWeeksData.filter((w: any) => w.program_id === program.id);
            
            programWeeks.forEach((week: any) => {
              const weekDays = allDaysData.filter((d: any) => d.week_id === week.id);
              
              weekDays.forEach((day: any, dayIndex: number) => {
                // Calculate actual training date index based on all previous weeks' days
                const daysBeforeThisWeek = programWeeks
                  .filter((w: any) => w.week_order < week.week_order)
                  .reduce((total, w) => total + allDaysData.filter((d: any) => d.week_id === w.id).length, 0);
                
                const dateIndex = daysBeforeThisWeek + dayIndex;
                
                if (dateIndex >= assignment.training_dates.length) return;
                
                const scheduledDate = assignment.training_dates[dateIndex];
                const completion = Array.isArray(allCompletions) 
                  ? allCompletions.find((c: any) => c.assignment_id === assignment.id && c.scheduled_date === scheduledDate)
                  : null;
                
                const statusIcon = completion?.status === 'completed' ? '✅' : completion?.status === 'missed' ? '❌' : '📅';
                const rpeScore = completion?.rpe_score;
                const rpeText = rpeScore ? ` (RPE: ${rpeScore})` : '';
                
                detailedWorkoutsContext += `\n  ${statusIcon} ${scheduledDate} - ${day.name}${rpeText}:\n`;
                
                // Blocks και ασκήσεις
                const dayBlocks = allBlocksData.filter((b: any) => b.day_id === day.id);
                
                dayBlocks.forEach((block: any) => {
                  detailedWorkoutsContext += `\n    🔹 ${block.name}${block.training_type ? ` (${block.training_type})` : ''}:\n`;
                  
                  const blockExercises = allProgramExercisesData.filter((pe: any) => pe.block_id === block.id);
                  
                  blockExercises.forEach((pe: any) => {
                    const exercise = allExercisesData.find((e: any) => e.id === pe.exercise_id);
                    
                    const exerciseName = exercise?.name || 'Unknown Exercise';
                    detailedWorkoutsContext += `      • ${exerciseName}: ${pe.sets || '?'}x${pe.reps || '?'}`;
                    
                    if (pe.kg) detailedWorkoutsContext += ` @ ${pe.kg}kg`;
                    if (pe.tempo) detailedWorkoutsContext += ` tempo ${pe.tempo}`;
                    if (pe.rest) detailedWorkoutsContext += ` rest ${pe.rest}s`;
                    if (pe.notes) detailedWorkoutsContext += ` (${pe.notes})`;
                    
                    detailedWorkoutsContext += '\n';
                  });
                });
              });
            });
            
            detailedWorkoutsContext += '\n';
          });
        } else {
          console.error('⚠️ Some data is not an array:', {
            allWeeksData: Array.isArray(allWeeksData),
            allDaysData: Array.isArray(allDaysData),
            allBlocksData: Array.isArray(allBlocksData),
            allProgramExercisesData: Array.isArray(allProgramExercisesData),
            allExercisesData: Array.isArray(allExercisesData)
          });
          detailedWorkoutsContext += '\n⚠️ Δεν ήταν δυνατή η φόρτωση λεπτομερών στοιχείων προπονήσεων.\n';
        }
        
        adminActiveProgramsContext += detailedWorkoutsContext;
        }
        
        console.log(`✅ Admin context length: ${adminActiveProgramsContext.length} characters`);
        console.log(`📋 Admin context preview (first 500 chars): ${adminActiveProgramsContext.substring(0, 500)}`);
      }
    }

    // 📋 PROGRAMS MENU: Φόρτωση ΟΛΩΝ των programs (drafts/templates) ΜΟΝΟ για admin overview mode
    let adminProgramsMenuContext = '';
    if (isAdmin && !targetUserId) {
      console.log('📋 Admin mode: Loading ALL programs from Programs menu (drafts + templates)...');
      
      // Φόρτωση ΟΛΩΝ των programs (drafts, templates)
      const allProgramsMenuResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/programs?select=id,name,description,status,is_template,created_at,updated_at&order=updated_at.desc`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const allProgramsMenu = await allProgramsMenuResponse.json();
      
      if (Array.isArray(allProgramsMenu) && allProgramsMenu.length > 0) {
        console.log(`✅ Loaded ${allProgramsMenu.length} programs from Programs menu`);
        
        // Φόρτωση πλήρης δομής για όλα τα programs
        const menuProgramIds = allProgramsMenu.map((p: any) => p.id);
        
        // Weeks
        const menuWeeksResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/program_weeks?program_id=in.(${menuProgramIds.join(',')})&select=*&order=week_number.asc`,
          {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }
        );
        const menuWeeksData = await menuWeeksResponse.json();
        const menuWeeks = Array.isArray(menuWeeksData) ? menuWeeksData : [];
        
        // Days
        const menuWeekIds = menuWeeks.map((w: any) => w.id);
        let menuDays: any[] = [];
        if (menuWeekIds.length > 0) {
          const menuDaysResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/program_days?week_id=in.(${menuWeekIds.join(',')})&select=*&order=day_number.asc`,
            {
              headers: {
                "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              }
            }
          );
          const menuDaysData = await menuDaysResponse.json();
          menuDays = Array.isArray(menuDaysData) ? menuDaysData : [];
        }
        
        // Blocks
        const menuDayIds = menuDays.map((d: any) => d.id);
        let menuBlocks: any[] = [];
        if (menuDayIds.length > 0) {
          const menuBlocksResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/program_blocks?day_id=in.(${menuDayIds.join(',')})&select=*&order=block_order.asc`,
            {
              headers: {
                "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              }
            }
          );
          const menuBlocksData = await menuBlocksResponse.json();
          menuBlocks = Array.isArray(menuBlocksData) ? menuBlocksData : [];
        }
        
        // Exercises
        const menuBlockIds = menuBlocks.map((b: any) => b.id);
        let menuProgramExercises: any[] = [];
        if (menuBlockIds.length > 0) {
          // Batch loading για να μην υπερβούμε τα URL limits
          const batchSize = 25;
          for (let i = 0; i < menuBlockIds.length; i += batchSize) {
            const batchIds = menuBlockIds.slice(i, i + batchSize);
            const menuExercisesResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/program_exercises?block_id=in.(${batchIds.join(',')})&select=*&order=exercise_order.asc`,
              {
                headers: {
                  "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
              }
            );
            const menuExercisesData = await menuExercisesResponse.json();
            if (Array.isArray(menuExercisesData)) {
              menuProgramExercises.push(...menuExercisesData);
            }
          }
        }
        
        // Exercises names
        const menuExerciseIds = [...new Set(menuProgramExercises.map((pe: any) => pe.exercise_id).filter(Boolean))];
        let menuExercisesNames: any[] = [];
        if (menuExerciseIds.length > 0) {
          const menuExercisesNamesResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/exercises?id=in.(${menuExerciseIds.join(',')})&select=id,name,description`,
            {
              headers: {
                "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              }
            }
          );
          const menuExercisesNamesData = await menuExercisesNamesResponse.json();
          menuExercisesNames = Array.isArray(menuExercisesNamesData) ? menuExercisesNamesData : [];
        }
        
        // Build context
        const templates = allProgramsMenu.filter((p: any) => p.is_template === true);
        const drafts = allProgramsMenu.filter((p: any) => p.status === 'draft' && !p.is_template);
        const otherPrograms = allProgramsMenu.filter((p: any) => p.status !== 'draft' && !p.is_template);
        
        adminProgramsMenuContext = `\n\n📋 ΜΕΝΟΥ ΠΡΟΓΡΑΜΜΑΤΑ (Programs Menu - Drafts/Templates):

📊 Σύνοψη:
- Templates: ${templates.length}
- Drafts: ${drafts.length}
- Άλλα: ${otherPrograms.length}
- Σύνολο: ${allProgramsMenu.length}

📁 TEMPLATES (${templates.length}):
${templates.map((p: any, i: number) => {
  const weeks = menuWeeks.filter((w: any) => w.program_id === p.id);
  const days = weeks.flatMap((w: any) => menuDays.filter((d: any) => d.week_id === w.id));
  const blocks = days.flatMap((d: any) => menuBlocks.filter((b: any) => b.day_id === d.id));
  const exercises = blocks.flatMap((b: any) => menuProgramExercises.filter((pe: any) => pe.block_id === b.id));
  
  return `${i + 1}. ${p.name}
   - Περιγραφή: ${p.description || 'Χωρίς περιγραφή'}
   - Δομή: ${weeks.length} εβδομάδες, ${days.length} ημέρες, ${blocks.length} blocks, ${exercises.length} ασκήσεις
   - Δημιουργήθηκε: ${new Date(p.created_at).toLocaleDateString('el-GR')}`;
}).join('\n\n')}

📝 DRAFTS (${drafts.length}):
${drafts.map((p: any, i: number) => {
  const weeks = menuWeeks.filter((w: any) => w.program_id === p.id);
  const days = weeks.flatMap((w: any) => menuDays.filter((d: any) => d.week_id === w.id));
  const blocks = days.flatMap((d: any) => menuBlocks.filter((b: any) => b.day_id === d.id));
  const exercises = blocks.flatMap((b: any) => menuProgramExercises.filter((pe: any) => pe.block_id === b.id));
  
  return `${i + 1}. ${p.name}
   - Περιγραφή: ${p.description || 'Χωρίς περιγραφή'}
   - Δομή: ${weeks.length} εβδομάδες, ${days.length} ημέρες, ${blocks.length} blocks, ${exercises.length} ασκήσεις
   - Τελευταία ενημέρωση: ${new Date(p.updated_at).toLocaleDateString('el-GR')}`;
}).join('\n\n')}

📋 ΑΝΑΛΥΤΙΚΗ ΔΟΜΗ ΠΡΟΓΡΑΜΜΑΤΩΝ:
`;
        
        // Αναλυτική δομή για κάθε πρόγραμμα
        allProgramsMenu.forEach((program: any) => {
          const progWeeks = menuWeeks.filter((w: any) => w.program_id === program.id);
          if (progWeeks.length === 0) return;
          
          adminProgramsMenuContext += `\n🏋️ ${program.name} ${program.is_template ? '(TEMPLATE)' : program.status === 'draft' ? '(DRAFT)' : ''}:\n`;
          
          progWeeks.forEach((week: any) => {
            const weekDays = menuDays.filter((d: any) => d.week_id === week.id);
            adminProgramsMenuContext += `  📅 ${week.name || `Εβδομάδα ${week.week_number}`}:\n`;
            
            weekDays.forEach((day: any) => {
              const dayBlocks = menuBlocks.filter((b: any) => b.day_id === day.id);
              adminProgramsMenuContext += `    📌 ${day.name || `Ημέρα ${day.day_number}`}:\n`;
              
              dayBlocks.forEach((block: any) => {
                const blockExercises = menuProgramExercises.filter((pe: any) => pe.block_id === block.id);
                adminProgramsMenuContext += `      🔹 ${block.name}${block.training_type ? ` (${block.training_type})` : ''}:\n`;
                
                blockExercises.forEach((pe: any) => {
                  const exercise = menuExercisesNames.find((e: any) => e.id === pe.exercise_id);
                  const exerciseName = exercise?.name || 'Unknown Exercise';
                  let details = `${pe.sets || '?'}x${pe.reps || '?'}`;
                  if (pe.kg) details += ` @ ${pe.kg}kg`;
                  if (pe.tempo) details += ` tempo ${pe.tempo}`;
                  if (pe.rest) details += ` rest ${pe.rest}s`;
                  if (pe.notes) details += ` (${pe.notes})`;
                  
                  adminProgramsMenuContext += `        • ${exerciseName}: ${details}\n`;
                });
              });
            });
          });
        });
        
        console.log(`✅ Admin Programs Menu context length: ${adminProgramsMenuContext.length} chars`);
      }
    }

    // 👥 ADMIN MODE: Φόρτωση ΟΛΩΝ των χρηστών με εγγραφή και συνδρομές
    let adminAllUsersContext = '';
    if (isAdmin && !targetUserId) {
      console.log('📊 Admin mode: Loading ALL users with registration dates and subscriptions...');
      
      // Φόρτωση ΟΛΩΝ των χρηστών
      const allUsersFullResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/app_users?select=id,name,email,created_at&order=name.asc`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const allUsersFull = await allUsersFullResponse.json();
      
      // Φόρτωση ΟΛΩΝ των συνδρομών (από user_subscriptions - το σωστό table!)
      const allSubscriptionsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/user_subscriptions?select=*&order=start_date.desc`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const allSubscriptions = await allSubscriptionsResponse.json();
      
      // Φόρτωση τύπων συνδρομών
      const allSubTypesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/subscription_types?select=id,name,duration_months`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const allSubTypes = await allSubTypesResponse.json();
      
      if (Array.isArray(allUsersFull) && allUsersFull.length > 0) {
        console.log(`✅ Loaded ${allUsersFull.length} users, ${Array.isArray(allSubscriptions) ? allSubscriptions.length : 0} subscriptions`);
        
        adminAllUsersContext = '\n\n👥 ΛΙΣΤΑ ΧΡΗΣΤΩΝ (Dashboard/Users) - Ημερομηνίες Εγγραφής:\n';
        
        allUsersFull.forEach((user: any) => {
          const regDate = user.created_at ? new Date(user.created_at).toLocaleDateString('el-GR') : 'Άγνωστη';
          adminAllUsersContext += `- ${user.name} (${user.email}): Εγγράφηκε ${regDate}\n`;
        });
        
        // ΥΠΟΛΟΓΙΣΜΟΣ ΣΤΑΤΙΣΤΙΚΩΝ ΣΥΝΔΡΟΜΩΝ
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let activeCount = 0;
        let pausedCount = 0;
        let expiringSoonCount = 0; // λήγουν σε 7 ημέρες
        let expiredCount = 0;
        let futureCount = 0;
        
        if (Array.isArray(allSubscriptions)) {
          allSubscriptions.forEach((sub: any) => {
            const endDateObj = sub.end_date ? new Date(sub.end_date) : null;
            const startDateObj = sub.start_date ? new Date(sub.start_date) : null;
            
            if (endDateObj && startDateObj) {
              endDateObj.setHours(0, 0, 0, 0);
              startDateObj.setHours(0, 0, 0, 0);
              
              // Σε παύση
              if (sub.is_paused) {
                pausedCount++;
              }
              // Ενεργή (status=active, start<=today<=end)
              else if (sub.status === 'active' && startDateObj <= today && endDateObj >= today) {
                activeCount++;
                // Λήγει σύντομα (σε 7 ημέρες ή λιγότερο)
                const daysUntilExpiry = Math.ceil((endDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (daysUntilExpiry <= 7) {
                  expiringSoonCount++;
                }
              }
              // Μελλοντική
              else if (startDateObj > today) {
                futureCount++;
              }
              // Έληξε
              else if (endDateObj < today) {
                expiredCount++;
              }
            }
          });
        }
        
        // Συνδρομές ανά χρήστη (από user_subscriptions)
        adminAllUsersContext += '\n\n💳 ΣΥΝΔΡΟΜΕΣ ΧΡΗΣΤΩΝ (Dashboard/Subscriptions/Tab Συνδρομές):\n';
        adminAllUsersContext += '═══════════════════════════════════════════════════\n';
        adminAllUsersContext += `📊 ΣΤΑΤΙΣΤΙΚΑ ΣΥΝΔΡΟΜΩΝ:\n`;
        adminAllUsersContext += `   ✅ Ενεργές συνδρομές: ${activeCount}\n`;
        adminAllUsersContext += `   ⚠️ Λήγουν σε 7 ημέρες: ${expiringSoonCount}\n`;
        adminAllUsersContext += `   ⏸️ Σε παύση: ${pausedCount}\n`;
        adminAllUsersContext += `   ⏰ Ληγμένες: ${expiredCount}\n`;
        adminAllUsersContext += `   📅 Μελλοντικές: ${futureCount}\n`;
        adminAllUsersContext += '═══════════════════════════════════════════════════\n\n';
        adminAllUsersContext += '⚠️ ΣΗΜΑΝΤΙΚΟ: start_date = ΕΝΑΡΞΗ συνδρομής, end_date = ΛΗΞΗ συνδρομής\n\n';
        
        const usersWithSubs = allUsersFull.filter((user: any) => {
          if (!Array.isArray(allSubscriptions)) return false;
          return allSubscriptions.some((s: any) => s.user_id === user.id);
        });
        
        usersWithSubs.forEach((user: any) => {
          const userSubs = Array.isArray(allSubscriptions) 
            ? allSubscriptions.filter((s: any) => s.user_id === user.id)
            : [];
          
          if (userSubs.length > 0) {
            adminAllUsersContext += `\n👤 ${user.name} (${user.email}):\n`;
            
            // Ταξινόμηση κατά start_date desc
            userSubs.sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
            
            userSubs.forEach((sub: any, index: number) => {
              const subType = Array.isArray(allSubTypes) 
                ? allSubTypes.find((st: any) => st.id === sub.subscription_type_id)
                : null;
              const subName = subType?.name || 'Άγνωστος τύπος';
              
              const startDate = sub.start_date 
                ? new Date(sub.start_date).toLocaleDateString('el-GR')
                : 'Άγνωστη';
              
              const endDate = sub.end_date 
                ? new Date(sub.end_date).toLocaleDateString('el-GR')
                : 'Άγνωστη';
              
              const endDateObj = sub.end_date ? new Date(sub.end_date) : null;
              const startDateObj = sub.start_date ? new Date(sub.start_date) : null;
              
              let daysRemaining = 0;
              let statusText = 'Άγνωστη κατάσταση';
              let statusEmoji = '❓';
              
              if (endDateObj && startDateObj) {
                endDateObj.setHours(0, 0, 0, 0);
                startDateObj.setHours(0, 0, 0, 0);
                
                if (sub.is_paused) {
                  statusEmoji = '⏸️';
                  statusText = 'ΣΕ ΠΑΥΣΗ';
                } else if (sub.status === 'active' && endDateObj >= today && startDateObj <= today) {
                  daysRemaining = Math.ceil((endDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  statusEmoji = '✅';
                  statusText = `ΕΝΕΡΓΗ - Λήγει σε ${daysRemaining} ημέρες`;
                } else if (startDateObj > today) {
                  statusEmoji = '📅';
                  statusText = 'ΜΕΛΛΟΝΤΙΚΗ - Δεν έχει ξεκινήσει ακόμα';
                } else if (endDateObj < today) {
                  statusEmoji = '⏰';
                  statusText = 'ΕΛΗΞΕ';
                } else {
                  statusEmoji = '❌';
                  statusText = sub.status === 'cancelled' ? 'ΑΚΥΡΩΜΕΝΗ' : 'ΑΝΕΝΕΡΓΗ';
                }
              }
              
              adminAllUsersContext += `  ${index + 1}. ${statusEmoji} ${subName}\n`;
              adminAllUsersContext += `     📆 Έναρξη: ${startDate} | Λήξη: ${endDate}\n`;
              adminAllUsersContext += `     📊 Κατάσταση: ${statusText}\n`;
              if (sub.status) {
                adminAllUsersContext += `     🏷️ DB Status: ${sub.status}\n`;
              }
            });
          }
        });
        
        // Χρήστες χωρίς συνδρομές
        const usersWithoutSubs = allUsersFull.filter((user: any) => {
          if (!Array.isArray(allSubscriptions)) return true;
          return !allSubscriptions.some((s: any) => s.user_id === user.id);
        });
        
        if (usersWithoutSubs.length > 0) {
          adminAllUsersContext += `\n⚠️ Χρήστες ΧΩΡΙΣ συνδρομή: ${usersWithoutSubs.length}\n`;
        }
        
        console.log(`✅ Admin all users context length: ${adminAllUsersContext.length} chars`);
      }
    }

    // 📊 Φόρτωση δεδομένων χρήστη (ΜΟΝΟ αν ΔΕΝ είμαστε σε admin overview mode)
    // Αν είμαστε admin χωρίς targetUserId, δεν φορτώνουμε προσωπικά δεδομένα
    let userProfile: any = {};
    let exerciseContext = '';
    let programContext = '';
    let calendarContext = '';
    let workoutStatsContext = '';
    let strengthContext = '';
    let enduranceContext = '';
    let jumpContext = '';
    let anthropometricContext = '';
    let functionalContext = '';
    let availableAthletesContext = '';
    let athletesProgressContext = '';
    let todayProgramContext = '';
    let allDaysContext = '';
    let overviewStatsContext = '';
    let adminProgressContext = '';
    
    if (!(isAdmin && !targetUserId)) {
      console.log(`📊 Loading personal data for userId: ${effectiveUserId}`);
      
      // Φόρτωση στοιχείων χρήστη (χρησιμοποιούμε effectiveUserId)
      const userDataResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/app_users?id=eq.${effectiveUserId}&select=*`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const userData = await userDataResponse.json();
      userProfile = userData[0] || {};

      // 💳 Φόρτωση συνδρομών χρήστη
      const userPaymentsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/payments?user_id=eq.${effectiveUserId}&order=payment_date.desc&select=*`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const userPayments = await userPaymentsResponse.json();
      console.log('💳 User payments loaded:', Array.isArray(userPayments) ? userPayments.length : 0);

      // Φόρτωση subscription types
      const subscriptionTypesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/subscription_types?select=id,name,duration_months,price`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const subscriptionTypes = await subscriptionTypesResponse.json();

      // Δημιουργία subscription context
      let subscriptionContext = '';
      if (Array.isArray(userPayments) && userPayments.length > 0) {
        const subscriptionsInfo = userPayments.map((payment: any) => {
          const subscriptionType = Array.isArray(subscriptionTypes) 
            ? subscriptionTypes.find((st: any) => st.id === payment.subscription_type_id) 
            : null;
          
          const paymentDate = payment.payment_date ? new Date(payment.payment_date) : null;
          const durationMonths = payment.subscription_duration_months || subscriptionType?.duration_months || 1;
          const expiryDate = paymentDate ? new Date(paymentDate) : null;
          if (expiryDate) {
            expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
          }
          
          const today = new Date();
          const isActive = expiryDate && expiryDate > today;
          const daysRemaining = expiryDate ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
          
          return {
            subscriptionName: subscriptionType?.name || 'Συνδρομή',
            amount: payment.amount,
            paymentDate: paymentDate ? paymentDate.toLocaleDateString('el-GR') : 'N/A',
            expiryDate: expiryDate ? expiryDate.toLocaleDateString('el-GR') : 'N/A',
            isActive,
            daysRemaining: isActive ? daysRemaining : 0,
            status: payment.status
          };
        });

        const activeSubscription = subscriptionsInfo.find(s => s.isActive);
        const pastSubscriptions = subscriptionsInfo.filter(s => !s.isActive);

        subscriptionContext = `\n\n💳 ΣΥΝΔΡΟΜΕΣ ΧΡΗΣΤΗ:`;
        
        if (activeSubscription) {
          subscriptionContext += `\n✅ ΕΝΕΡΓΗ ΣΥΝΔΡΟΜΗ:
- Τύπος: ${activeSubscription.subscriptionName}
- Ποσό: ${activeSubscription.amount}€
- Ημ/νία αγοράς: ${activeSubscription.paymentDate}
- Λήγει: ${activeSubscription.expiryDate} (σε ${activeSubscription.daysRemaining} ημέρες)`;
        } else {
          subscriptionContext += `\n⚠️ ΔΕΝ ΥΠΑΡΧΕΙ ΕΝΕΡΓΗ ΣΥΝΔΡΟΜΗ`;
        }

        if (pastSubscriptions.length > 0) {
          subscriptionContext += `\n\n📜 ΙΣΤΟΡΙΚΟ ΣΥΝΔΡΟΜΩΝ (${pastSubscriptions.length} συνολικά):`;
          pastSubscriptions.forEach((sub: any) => {
            subscriptionContext += `\n- ${sub.subscriptionName}: ${sub.amount}€ (${sub.paymentDate} - ${sub.expiryDate})`;
          });
        }
      }

      // Προσθήκη subscription context στο userProfile για χρήση αργότερα
      (userProfile as any).subscriptionContext = subscriptionContext;

    // Φόρτωση ΟΛΩΝ των assignments για το ημερολόγιο (active και completed)
    const assignmentsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/program_assignments?user_id=eq.${effectiveUserId}&status=in.(active,completed)&select=*`,
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
        `${SUPABASE_URL}/rest/v1/programs?id=in.(${programIds.join(',')})&select=id,name,description,training_days,program_weeks!fk_program_weeks_program_id(id,name,week_number,program_days!fk_program_days_week_id(id,name,day_number,estimated_duration_minutes,is_test_day,test_types,is_competition_day,program_blocks!fk_program_blocks_day_id(id,name,block_order,training_type,workout_format,workout_duration,program_exercises!fk_program_exercises_block_id(id,sets,reps,kg,tempo,rest,notes,exercise_order,reps_mode,exercises!fk_program_exercises_exercise_id(id,name,description,video_url)))))`,
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
      `${SUPABASE_URL}/rest/v1/program_assignments?user_id=eq.${effectiveUserId}&select=id,training_dates,status,start_date,end_date,programs!fk_program_assignments_program_id(name),assignment_attendance(completed_workouts,missed_workouts,makeup_workouts,total_scheduled_workouts,attendance_percentage)`,
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
      `${SUPABASE_URL}/rest/v1/workout_completions?user_id=eq.${effectiveUserId}&order=created_at.desc&limit=100&select=*`,
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

    // Φόρτωση λεπτομερούς ιστορικού δύναμης (για Athletes Progress)
    const strengthAttemptsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/strength_test_attempts?select=id,weight_kg,velocity_ms,exercise_id,test_session_id,strength_test_sessions!inner(user_id,test_date)&strength_test_sessions.user_id=eq.${effectiveUserId}&not.velocity_ms.is.null&order=strength_test_sessions.test_date.desc&limit=200`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const strengthAttemptsData = await strengthAttemptsResponse.json();
    
    // Φόρτωση exercises για να πάρουμε τα ονόματα
    const exercisesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/exercises?select=id,name`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const exercisesData = await exercisesResponse.json();
    console.log('✅ Strength Attempts:', Array.isArray(strengthAttemptsData) ? strengthAttemptsData.length : 0);

    // Φόρτωση ιστορικού αντοχής
    const enduranceResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/endurance_test_data?select=id,created_at,vo2_max,mas_kmh,sprint_watt,push_ups,pull_ups,crunches,endurance_test_sessions!inner(user_id,test_date)&endurance_test_sessions.user_id=eq.${effectiveUserId}&order=created_at.desc&limit=10`,
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
      `${SUPABASE_URL}/rest/v1/jump_test_data?select=id,created_at,counter_movement_jump,non_counter_movement_jump,broad_jump,triple_jump_left,triple_jump_right,jump_test_sessions!inner(user_id,test_date)&jump_test_sessions.user_id=eq.${effectiveUserId}&order=created_at.desc&limit=10`,
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
      `${SUPABASE_URL}/rest/v1/anthropometric_test_data?select=id,created_at,height,weight,body_fat_percentage,muscle_mass_percentage,waist_circumference,chest_circumference,anthropometric_test_sessions!inner(user_id,test_date)&anthropometric_test_sessions.user_id=eq.${effectiveUserId}&order=created_at.desc&limit=10`,
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
      // Συλλογή όλων των προγραμματισμένων ημερομηνιών με status και λεπτά
      const allProgramDates: any[] = [];
      
      enrichedAssignments.forEach((assignment: any) => {
        if (assignment.training_dates && assignment.programs && assignment.app_users) {
          const program = assignment.programs;
          const daysPerWeek = program.program_weeks?.[0]?.program_days?.length || 0;
          
          assignment.training_dates.forEach((dateStr: string, index: number) => {
            const completion = workoutCompletions.find((c: any) => 
              c.assignment_id === assignment.id && c.scheduled_date === dateStr
            );
            
            // Υπολογισμός ποια ημέρα του προγράμματος είναι
            const dayIndex = index % daysPerWeek;
            const programDay = program.program_weeks?.[0]?.program_days?.[dayIndex];
            const estimatedMinutes = programDay?.estimated_duration_minutes || 60; // default 60 λεπτά
            
            // Υπολογισμός status: αν η ημερομηνία έχει περάσει και δεν έχει completion, είναι missed
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const workoutDate = new Date(dateStr);
            workoutDate.setHours(0, 0, 0, 0);
            
            let status = 'scheduled';
            if (completion) {
              status = completion.status;
            } else if (workoutDate < today) {
              status = 'missed'; // Η ημερομηνία πέρασε χωρίς completion
            }
            
            allProgramDates.push({
              date: dateStr,
              status: status,
              programName: assignment.programs.name,
              userName: assignment.app_users.name,
              assignmentId: assignment.id,
              estimatedMinutes: estimatedMinutes,
              actualMinutes: completion?.actual_duration_minutes || 0,
              rpe: completion?.rpe_score || null
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
      
      // Τελευταίες 5 και επόμενες 5 προπονήσεις
      const recentWorkouts = pastWorkouts.slice(-5);
      const upcomingWorkouts = futureWorkouts.slice(0, 5);
      
      // Calendar context
      const calendarStats = {
        totalScheduled: allProgramDates.length,
        completed: allProgramDates.filter(d => d.status === 'completed').length,
        missed: allProgramDates.filter(d => d.status === 'missed').length,
        scheduled: allProgramDates.filter(d => d.status === 'scheduled' && d.date >= todayStr).length,
        totalEstimatedMinutes: allProgramDates.reduce((sum, d) => sum + d.estimatedMinutes, 0),
        totalActualMinutes: allProgramDates.filter(d => d.status === 'completed').reduce((sum, d) => sum + d.actualMinutes, 0)
      };
      
      
      // Group workouts by month for detailed breakdown
      const workoutsByMonth: Record<string, any[]> = {};
      allProgramDates.forEach((workout: any) => {
        const date = new Date(workout.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!workoutsByMonth[monthKey]) {
          workoutsByMonth[monthKey] = [];
        }
        workoutsByMonth[monthKey].push(workout);
      });
      
      // Group workouts by week
      const workoutsByWeek: Record<string, any[]> = {};
      allProgramDates.forEach((workout: any) => {
        const date = new Date(workout.date);
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((dayOfYear + 1) / 7);
        const weekKey = `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
        if (!workoutsByWeek[weekKey]) {
          workoutsByWeek[weekKey] = [];
        }
        workoutsByWeek[weekKey].push(workout);
      });
      
      // Create monthly summary (ALL months with workouts)
      const monthlyBreakdown = Object.entries(workoutsByMonth)
        .sort(([a], [b]) => b.localeCompare(a)) // Most recent first
        .map(([monthKey, workouts]) => {
          const [year, month] = monthKey.split('-');
          const monthNames = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 
                             'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
          const monthName = monthNames[parseInt(month) - 1];
          
          const completed = workouts.filter(w => w.status === 'completed').length;
          const missed = workouts.filter(w => w.status === 'missed').length;
          const scheduled = workouts.filter(w => w.status === 'scheduled').length;
          const totalWorkouts = workouts.length;
          
          // Υπολογισμός ωρών
          const completedMinutes = workouts.filter(w => w.status === 'completed').reduce((sum, w) => sum + (w.actualMinutes || w.estimatedMinutes), 0);
          const scheduledMinutes = workouts.reduce((sum, w) => sum + w.estimatedMinutes, 0);
          const completedHours = Math.round(completedMinutes / 60 * 10) / 10;
          const scheduledHours = Math.round(scheduledMinutes / 60 * 10) / 10;
          
          const workoutList = workouts
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(w => {
              const dateObj = new Date(w.date);
              const day = dateObj.getDate();
              const statusSymbol = w.status === 'completed' ? '✓' : w.status === 'missed' ? '✗' : '○';
              return `  ${day}/${month}: ${statusSymbol} ${w.programName}`;
            })
            .join('\n');
          
          return `\n${monthName} ${year}:\n- Προπονήσεις: ${completed}/${totalWorkouts} (Ολοκληρωμένες/Συνολικές)\n- Ώρες: ${completedHours}h/${scheduledHours}h (Πραγματικές/Προγραμματισμένες)\n- Χαμένες: ${missed}\n${workoutList}`;
        })
        .join('\n');
      
      // Create weekly summary (last 8 weeks)
      const weeklyBreakdown = Object.entries(workoutsByWeek)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 8)
        .map(([weekKey, workouts]) => {
          const [year, weekStr] = weekKey.split('-W');
          const weekNum = parseInt(weekStr);
          
          const completed = workouts.filter(w => w.status === 'completed').length;
          const missed = workouts.filter(w => w.status === 'missed').length;
          const scheduled = workouts.filter(w => w.status === 'scheduled').length;
          const totalWorkouts = workouts.length;
          
          const completedMinutes = workouts.filter(w => w.status === 'completed').reduce((sum, w) => sum + (w.actualMinutes || w.estimatedMinutes), 0);
          const completedHours = Math.round(completedMinutes / 60 * 10) / 10;
          
          return `Εβδομάδα ${weekNum}/${year}: ${completed}/${totalWorkouts} προπονήσεις, ${completedHours}h ώρες, ${missed} χαμένες`;
        })
        .join('\n');
      
      // Υπολογισμός Ανάλυσης Τύπων Προπόνησης
      const trainingTypesByMonth: Record<string, Record<string, number>> = {};
      const TRAINING_TYPE_LABELS: Record<string, string> = {
        str: 'Δύναμη',
        'str/spd': 'Δύναμη/Ταχύτητα',
        pwr: 'Ισχύς',
        'spd/str': 'Ταχύτητα/Δύναμη',
        spd: 'Ταχύτητα',
        'str/end': 'Δύναμη/Αντοχή',
        'pwr/end': 'Ισχύς/Αντοχή',
        'spd/end': 'Ταχύτητα/Αντοχή',
        end: 'Αντοχή',
        hpr: 'Υπερτροφία'
      };
      
      console.log('🎯 Starting training types calculation...');
      
      enrichedAssignments.forEach((assignment: any) => {
        const program = assignment.programs;
        if (!program?.program_weeks) {
          console.log('⚠️ No program_weeks found');
          return;
        }
        
        assignment.training_dates?.forEach((dateStr: string, dateIndex: number) => {
          const date = new Date(dateStr);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!trainingTypesByMonth[monthKey]) {
            trainingTypesByMonth[monthKey] = {};
          }
          
          // Βρίσκουμε σε ποια εβδομάδα και ημέρα ανήκει
          const daysPerWeek = program.program_weeks[0]?.program_days?.length || 1;
          const weekIndex = Math.floor(dateIndex / daysPerWeek);
          const dayIndex = dateIndex % daysPerWeek;
          
          const week = program.program_weeks[weekIndex];
          if (!week) return;
          
          const day = week.program_days?.[dayIndex];
          if (!day) return;
          
          // Για κάθε block, υπολογίζουμε τον χρόνο
          day.program_blocks?.forEach((block: any) => {
            if (!block.training_type) {
              console.log(`⚠️ Block "${block.name}" has no training_type`);
              return;
            }
            
            console.log(`🔍 Processing block: ${block.name}, type: ${block.training_type}`);
            
            // Εξαίρεση τύπων που δεν εμφανίζονται στο pie chart
            const excludedTypes = ['mobility', 'stability', 'activation', 'neural act', 'recovery'];
            if (excludedTypes.includes(block.training_type)) {
              console.log(`⏭️ Skipping excluded type: ${block.training_type}`);
              return;
            }
            
            let blockTime = 0;
            block.program_exercises?.forEach((exercise: any) => {
              const sets = exercise.sets || 0;
              const reps = exercise.reps || '0';
              const tempo = exercise.tempo || '';
              const rest = exercise.rest || '';
              const repsMode = exercise.reps_mode || '';
              
              // Parse reps
              let repsSeconds = 0;
              let repsCount = 0;
              const isTimeMode = repsMode === 'time' || reps.includes(':') || reps.includes('s') || reps.includes("'");
              
              if (isTimeMode) {
                // Time-based
                if (reps.includes(':')) {
                  const [min, sec] = reps.split(':');
                  repsSeconds = (parseInt(min) || 0) * 60 + (parseInt(sec) || 0);
                } else if (reps.includes("'")) {
                  repsSeconds = (parseFloat(reps.replace("'", "")) || 0) * 60;
                } else if (reps.includes('s')) {
                  repsSeconds = parseFloat(reps.replace('s', '')) || 0;
                } else {
                  repsSeconds = parseFloat(reps) || 0;
                }
              } else {
                // Rep-based
                if (reps.includes('.')) {
                  reps.split('.').forEach((part: string) => {
                    repsCount += parseInt(part) || 0;
                  });
                } else {
                  repsCount = parseInt(reps) || 0;
                }
              }
              
              // Parse tempo
              let tempoSeconds = 3;
              if (tempo) {
                const parts = tempo.split('.');
                tempoSeconds = 0;
                parts.forEach((part: string) => {
                  if (part === 'x' || part === 'X') {
                    tempoSeconds += 0.5;
                  } else {
                    tempoSeconds += parseFloat(part) || 0;
                  }
                });
              }
              
              // Parse rest
              let restSeconds = 0;
              if (rest.includes(':')) {
                const [min, sec] = rest.split(':');
                restSeconds = (parseInt(min) || 0) * 60 + (parseInt(sec) || 0);
              } else if (rest.includes("'")) {
                restSeconds = (parseFloat(rest.replace("'", "")) || 0) * 60;
              } else if (rest.includes('s')) {
                restSeconds = parseFloat(rest.replace('s', '')) || 0;
              } else {
                restSeconds = (parseFloat(rest) || 0) * 60;
              }
              
              // Calculate total time
              if (isTimeMode) {
                blockTime += sets * repsSeconds + sets * restSeconds;
              } else {
                blockTime += sets * repsCount * tempoSeconds + sets * restSeconds;
              }
            });
            
            const timeMinutes = Math.round(blockTime / 60);
            const typeLabel = block.training_type;
            
            console.log(`✅ Block "${block.name}": ${typeLabel} -> ${timeMinutes}min`);
            
            if (!trainingTypesByMonth[monthKey][typeLabel]) {
              trainingTypesByMonth[monthKey][typeLabel] = 0;
            }
            trainingTypesByMonth[monthKey][typeLabel] += timeMinutes;
          });
        });
      });
      
      console.log('📊 Training types by month:', JSON.stringify(trainingTypesByMonth, null, 2));
      
      // Create training types summary
      let trainingTypesContext = '';
      const sortedMonths = Object.entries(trainingTypesByMonth).sort(([a], [b]) => b.localeCompare(a));
      
      if (sortedMonths.length > 0) {
        const monthNames = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 
                           'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
        
        const monthlyBreakdowns = sortedMonths.map(([monthKey, types]) => {
          const [year, month] = monthKey.split('-');
          const monthName = monthNames[parseInt(month) - 1];
          
          const typesList = Object.entries(types)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([type, minutes]) => {
              const label = TRAINING_TYPE_LABELS[type] || type;
              const hours = Math.round((minutes as number) / 60 * 10) / 10;
              return `  - ${label}: ${hours}h (${minutes}λ)`;
            })
            .join('\n');
          
          const totalMinutes = Object.values(types).reduce((sum, m) => sum + (m as number), 0);
          const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
          
          return `\n${monthName} ${year} (Σύνολο: ${totalHours}h):\n${typesList}`;
        }).join('\n');
        
        trainingTypesContext = `\n\nΑνάλυση Τύπων Προπόνησης ανά Μήνα:${monthlyBreakdowns}`;
        
        // 🆕 Εβδομαδιαία ανάλυση (τρέχουσα εβδομάδα)
        const weekStartDate = new Date();
        weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay() + 1); // Monday
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6); // Sunday
        
        const weekTypesByMonth: Record<string, Record<string, number>> = {};
        
        enrichedAssignments.forEach((assignment) => {
          const program = assignment.programs;
          if (!program?.program_weeks) return;
          
          assignment.training_dates?.forEach((dateStr: string, dateIndex: number) => {
            const date = new Date(dateStr);
            
            // Φιλτράρουμε μόνο για την τρέχουσα εβδομάδα
            if (date < weekStartDate || date > weekEndDate) return;
            
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!weekTypesByMonth[monthKey]) weekTypesByMonth[monthKey] = {};
            
            const daysPerWeek = program.program_weeks[0]?.program_days?.length || 1;
            const weekIndex = Math.floor(dateIndex / daysPerWeek);
            const dayIndex = dateIndex % daysPerWeek;
            
            const week = program.program_weeks[weekIndex];
            if (!week) return;
            
            const day = week.program_days?.[dayIndex];
            if (!day) return;
            
            day.program_blocks?.forEach((block: any) => {
              if (!block.training_type) return;
              
              const excludedTypes = ['mobility', 'stability', 'activation', 'neural act', 'recovery'];
              if (excludedTypes.includes(block.training_type)) return;
              
              let blockTime = 0;
              block.program_exercises?.forEach((exercise: any) => {
                const sets = exercise.sets || 0;
                const reps = exercise.reps || '0';
                const tempo = exercise.tempo || '';
                const rest = exercise.rest || '';
                
                const isTimeMode = exercise.reps_mode === 'time';
                let repsCount = 0;
                let repsSeconds = 0;
                
                if (isTimeMode) {
                  if (reps.includes(':')) {
                    const [min, sec] = reps.split(':');
                    repsSeconds = (parseInt(min) || 0) * 60 + (parseInt(sec) || 0);
                  } else if (reps.includes("'")) {
                    repsSeconds = (parseFloat(reps.replace("'", "")) || 0) * 60;
                  } else if (reps.includes('s')) {
                    repsSeconds = parseFloat(reps.replace('s', '')) || 0;
                  } else {
                    repsSeconds = parseFloat(reps) || 0;
                  }
                } else {
                  if (reps.includes('.')) {
                    reps.split('.').forEach((part: string) => {
                      repsCount += parseInt(part) || 0;
                    });
                  } else {
                    repsCount = parseInt(reps) || 0;
                  }
                }
                
                let tempoSeconds = 3;
                if (tempo) {
                  const parts = tempo.split('.');
                  tempoSeconds = 0;
                  parts.forEach((part: string) => {
                    if (part === 'x' || part === 'X') {
                      tempoSeconds += 0.5;
                    } else {
                      tempoSeconds += parseFloat(part) || 0;
                    }
                  });
                }
                
                let restSeconds = 0;
                if (rest.includes(':')) {
                  const [min, sec] = rest.split(':');
                  restSeconds = (parseInt(min) || 0) * 60 + (parseInt(sec) || 0);
                } else if (rest.includes("'")) {
                  restSeconds = (parseFloat(rest.replace("'", "")) || 0) * 60;
                } else if (rest.includes('s')) {
                  restSeconds = parseFloat(rest.replace('s', '')) || 0;
                } else {
                  restSeconds = (parseFloat(rest) || 0) * 60;
                }
                
                if (isTimeMode) {
                  blockTime += sets * repsSeconds + sets * restSeconds;
                } else {
                  blockTime += sets * repsCount * tempoSeconds + sets * restSeconds;
                }
              });
              
              const timeMinutes = Math.round(blockTime / 60);
              const typeLabel = block.training_type;
              
              if (!weekTypesByMonth[monthKey][typeLabel]) {
                weekTypesByMonth[monthKey][typeLabel] = 0;
              }
              weekTypesByMonth[monthKey][typeLabel] += timeMinutes;
            });
          });
        });
        
        let weeklyTypeBreakdown = '';
        if (Object.keys(weekTypesByMonth).length > 0) {
          const weekBreakdowns = Object.entries(weekTypesByMonth)
            .map(([monthKey, types]) => {
              const [year, month] = monthKey.split('-');
              const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('el-GR', { month: 'long' });
              
              const typesList = Object.entries(types)
                .map(([type, minutes]) => {
                  const hours = Math.round((minutes as number) / 60 * 10) / 10;
                  const label = TRAINING_TYPE_LABELS[type] || type;
                  return `  - ${label}: ${hours}h (${minutes}λ)`;
                })
                .join('\n');
              
              const totalMinutes = Object.values(types).reduce((sum, m) => sum + (m as number), 0);
              const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
              
              return `\n${monthName} ${year} (Σύνολο: ${totalHours}h):\n${typesList}`;
            }).join('\n');
          
          weeklyTypeBreakdown = `\n\nΑνάλυση Τύπων Προπόνησης για την Τρέχουσα Εβδομάδα (${weekStartDate.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })} - ${weekEndDate.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })}):${weekBreakdowns}`;
        }
        
        // 🆕 Ημερήσια ανάλυση (σήμερα)
        const todayDate = new Date();
        const todayStr = todayDate.toISOString().split('T')[0];
        
        const todayTypesByMonth: Record<string, Record<string, number>> = {};
        let todayExercises: Array<{name: string; sets: number; reps: string}> = [];
        
        enrichedAssignments.forEach((assignment) => {
          const program = assignment.programs;
          if (!program?.program_weeks) return;
          
          assignment.training_dates?.forEach((dateStr: string, dateIndex: number) => {
            if (dateStr !== todayStr) return;
            
            const date = new Date(dateStr);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!todayTypesByMonth[monthKey]) todayTypesByMonth[monthKey] = {};
            
            const daysPerWeek = program.program_weeks[0]?.program_days?.length || 1;
            const weekIndex = Math.floor(dateIndex / daysPerWeek);
            const dayIndex = dateIndex % daysPerWeek;
            
            const week = program.program_weeks[weekIndex];
            if (!week) return;
            
            const day = week.program_days?.[dayIndex];
            if (!day) return;
            
            day.program_blocks?.forEach((block: any) => {
              if (!block.training_type) return;
              
              const excludedTypes = ['mobility', 'stability', 'activation', 'neural act', 'recovery'];
              if (excludedTypes.includes(block.training_type)) return;
              
              let blockTime = 0;
              block.program_exercises?.forEach((exercise: any) => {
                const sets = exercise.sets || 0;
                const reps = exercise.reps || '0';
                const tempo = exercise.tempo || '';
                const rest = exercise.rest || '';
                
                // Αποθηκεύουμε την άσκηση
                todayExercises.push({
                  name: exercise.exercises?.name || 'Άσκηση',
                  sets: sets,
                  reps: reps
                });
                
                const isTimeMode = exercise.reps_mode === 'time';
                let repsCount = 0;
                let repsSeconds = 0;
                
                if (isTimeMode) {
                  if (reps.includes(':')) {
                    const [min, sec] = reps.split(':');
                    repsSeconds = (parseInt(min) || 0) * 60 + (parseInt(sec) || 0);
                  } else if (reps.includes("'")) {
                    repsSeconds = (parseFloat(reps.replace("'", "")) || 0) * 60;
                  } else if (reps.includes('s')) {
                    repsSeconds = parseFloat(reps.replace('s', '')) || 0;
                  } else {
                    repsSeconds = parseFloat(reps) || 0;
                  }
                } else {
                  if (reps.includes('.')) {
                    reps.split('.').forEach((part: string) => {
                      repsCount += parseInt(part) || 0;
                    });
                  } else {
                    repsCount = parseInt(reps) || 0;
                  }
                }
                
                let tempoSeconds = 3;
                if (tempo) {
                  const parts = tempo.split('.');
                  tempoSeconds = 0;
                  parts.forEach((part: string) => {
                    if (part === 'x' || part === 'X') {
                      tempoSeconds += 0.5;
                    } else {
                      tempoSeconds += parseFloat(part) || 0;
                    }
                  });
                }
                
                let restSeconds = 0;
                if (rest.includes(':')) {
                  const [min, sec] = rest.split(':');
                  restSeconds = (parseInt(min) || 0) * 60 + (parseInt(sec) || 0);
                } else if (rest.includes("'")) {
                  restSeconds = (parseFloat(rest.replace("'", "")) || 0) * 60;
                } else if (rest.includes('s')) {
                  restSeconds = parseFloat(rest.replace('s', '')) || 0;
                } else {
                  restSeconds = (parseFloat(rest) || 0) * 60;
                }
                
                if (isTimeMode) {
                  blockTime += sets * repsSeconds + sets * restSeconds;
                } else {
                  blockTime += sets * repsCount * tempoSeconds + sets * restSeconds;
                }
              });
              
              const timeMinutes = Math.round(blockTime / 60);
              const typeLabel = block.training_type;
              
              if (!todayTypesByMonth[monthKey][typeLabel]) {
                todayTypesByMonth[monthKey][typeLabel] = 0;
              }
              todayTypesByMonth[monthKey][typeLabel] += timeMinutes;
            });
          });
        });
        
        let todayTypeBreakdown = '';
        if (Object.keys(todayTypesByMonth).length > 0) {
          const todayBreakdowns = Object.entries(todayTypesByMonth)
            .map(([monthKey, types]) => {
              const typesList = Object.entries(types)
                .map(([type, minutes]) => {
                  const hours = Math.round((minutes as number) / 60 * 10) / 10;
                  const label = TRAINING_TYPE_LABELS[type] || type;
                  return `  - ${label}: ${hours}h (${minutes}λ)`;
                })
                .join('\n');
              
              const totalMinutes = Object.values(types).reduce((sum, m) => sum + (m as number), 0);
              const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
              
              return `\nΣύνολο: ${totalHours}h\n${typesList}`;
            }).join('\n');
          
          todayTypeBreakdown = `\n\nΑνάλυση Τύπων Προπόνησης για Σήμερα (${todayDate.toLocaleDateString('el-GR', { weekday: 'long', day: '2-digit', month: 'long' })}):${todayBreakdowns}`;
        }
        
        let todayExercisesContext = '';
        if (todayExercises.length > 0) {
          const exercisesList = todayExercises
            .map(ex => `  - ${ex.name}: ${ex.sets}x${ex.reps}`)
            .join('\n');
          todayExercisesContext = `\n\nΑσκήσεις Σήμερα:\n${exercisesList}`;
        }
        
        trainingTypesContext += weeklyTypeBreakdown + todayTypeBreakdown + todayExercisesContext;
        
        console.log('✅ Training types context created:', trainingTypesContext.substring(0, 200) + '...');
      } else {
        console.log('⚠️ No training types data found');
      }
      
      calendarContext = `\n\nΗμερολόγιο Προπονήσεων (Συνολικά):\n- Σύνολο προγραμματισμένων: ${calendarStats.totalScheduled}\n- Ολοκληρωμένες: ${calendarStats.completed}\n- Χαμένες: ${calendarStats.missed}\n- Προγραμματισμένες (εκκρεμείς): ${calendarStats.scheduled}\n- Συνολικές ώρες προπόνησης: ${Math.round(calendarStats.totalActualMinutes / 60 * 10) / 10}h\n\nΑνάλυση ανά μήνα (όλοι οι μήνες με προπονήσεις):${monthlyBreakdown}\n\nΑνάλυση ανά εβδομάδα (τελευταίες 8 εβδομάδες):\n${weeklyBreakdown}${trainingTypesContext}`;
      
      
      
      if (todaysWorkouts.length > 0) {
        const todaysList = todaysWorkouts.map((w: any) => {
          const rpeText = w.rpe ? ` - RPE: ${w.rpe}` : '';
          return `- ${w.programName} (${w.status === 'completed' ? '✓ Ολοκληρωμένη' : w.status === 'missed' ? '✗ Χαμένη' : 'Προγραμματισμένη σήμερα'})${rpeText}`;
        }).join('\n');
        calendarContext += `\n\nΣήμερα (${todayStr}):\n${todaysList}`;
      }
      
      if (recentWorkouts.length > 0) {
        const recentList = recentWorkouts.map((w: any) => {
          const rpeText = w.rpe ? ` - RPE: ${w.rpe}` : '';
          return `- ${w.date}: ${w.programName} (${w.status === 'completed' ? '✓' : w.status === 'missed' ? '✗' : '?'})${rpeText}`;
        }).join('\n');
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
      
      // RPE Analysis για User Mode
      const completionsWithRpe = workoutCompletions.filter((c: any) => c.rpe_score !== null && c.rpe_score !== undefined);
      let rpeContext = '';
      if (completionsWithRpe.length > 0) {
        const avgRpe = (completionsWithRpe.reduce((sum: number, c: any) => sum + (c.rpe_score || 0), 0) / completionsWithRpe.length).toFixed(1);
        const rpeByDate = completionsWithRpe
          .sort((a: any, b: any) => new Date(b.scheduled_date || b.completed_date).getTime() - new Date(a.scheduled_date || a.completed_date).getTime())
          .slice(0, 10)
          .map((c: any) => {
            const date = c.scheduled_date || c.completed_date;
            return `- ${new Date(date).toLocaleDateString('el-GR')}: RPE ${c.rpe_score}`;
          }).join('\n');
        rpeContext = `\n\n📊 RPE Analysis (Rate of Perceived Exertion):\n- Μέσος όρος RPE: ${avgRpe}\n- Προπονήσεις με RPE: ${completionsWithRpe.length}\n\nΤελευταίες 10 καταγραφές RPE:\n${rpeByDate}`;
      }
      
      workoutStatsContext = `\n\nΣτατιστικά Προπονήσεων:${statsList}\n\nΤελευταία 7 ημέρες:\n- Ολοκληρωμένες: ${completionsLast7}\n- Χαμένες: ${missedLast7}\n\nΤελευταίος μήνας (30 ημέρες):\n- Ολοκληρωμένες: ${completionsLast30}\n- Χαμένες: ${missedLast30}\n\nΣύνολο workout completions: ${workoutCompletions.length}${rpeContext}`;
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
    
    // Context για λειτουργικά τεστ (User Mode)
    let functionalContext = '';
    if (!(isAdmin && !targetUserId)) {
      const functionalHistoryResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/functional_test_data?select=id,created_at,fms_score,fms_detailed_scores,posture_issues,squat_issues,single_leg_squat_issues,muscles_need_strengthening,muscles_need_stretching,sit_and_reach,shoulder_mobility_left,shoulder_mobility_right,flamingo_balance,functional_test_sessions!inner(user_id,test_date)&functional_test_sessions.user_id=eq.${effectiveUserId}&order=created_at.desc`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const functionalHistory = await functionalHistoryResponse.json();
      
      if (Array.isArray(functionalHistory) && functionalHistory.length > 0) {
        let functionalList = functionalHistory.map((test: any) => {
          const parts = [];
          if (test.fms_score) parts.push(`FMS Total: ${test.fms_score}/21`);
          if (test.sit_and_reach) parts.push(`Sit & Reach: ${test.sit_and_reach}cm`);
          if (test.shoulder_mobility_left) parts.push(`Ώμος Α: ${test.shoulder_mobility_left}cm`);
          if (test.shoulder_mobility_right) parts.push(`Ώμος Δ: ${test.shoulder_mobility_right}cm`);
          if (test.flamingo_balance) parts.push(`Ισορροπία: ${test.flamingo_balance}s`);
          const date = test.functional_test_sessions?.[0]?.test_date || test.created_at;
          
          // Αναλυτικά FMS scores
          let fmsDetails = '';
          if (test.fms_detailed_scores && typeof test.fms_detailed_scores === 'object') {
            const scores = test.fms_detailed_scores;
            const fmsParts = [];
            if (scores.deep_squat !== undefined) fmsParts.push(`Deep Squat: ${scores.deep_squat}`);
            if (scores.hurdle_step_left !== undefined) fmsParts.push(`Hurdle L: ${scores.hurdle_step_left}`);
            if (scores.hurdle_step_right !== undefined) fmsParts.push(`Hurdle R: ${scores.hurdle_step_right}`);
            if (scores.inline_lunge_left !== undefined) fmsParts.push(`Lunge L: ${scores.inline_lunge_left}`);
            if (scores.inline_lunge_right !== undefined) fmsParts.push(`Lunge R: ${scores.inline_lunge_right}`);
            if (scores.shoulder_mobility_left !== undefined) fmsParts.push(`Shoulder Mob L: ${scores.shoulder_mobility_left}`);
            if (scores.shoulder_mobility_right !== undefined) fmsParts.push(`Shoulder Mob R: ${scores.shoulder_mobility_right}`);
            if (scores.active_straight_leg_raise_left !== undefined) fmsParts.push(`ASLR L: ${scores.active_straight_leg_raise_left}`);
            if (scores.active_straight_leg_raise_right !== undefined) fmsParts.push(`ASLR R: ${scores.active_straight_leg_raise_right}`);
            if (scores.trunk_stability_pushup !== undefined) fmsParts.push(`Trunk Stability: ${scores.trunk_stability_pushup}`);
            if (scores.rotary_stability_left !== undefined) fmsParts.push(`Rotary L: ${scores.rotary_stability_left}`);
            if (scores.rotary_stability_right !== undefined) fmsParts.push(`Rotary R: ${scores.rotary_stability_right}`);
            if (fmsParts.length > 0) {
              fmsDetails = `\n    📋 FMS Ασκήσεις: ${fmsParts.join(', ')}`;
            }
          }
          
          return `- ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})${fmsDetails}`;
        }).join('\n');
        
        // Πρόσθεση μυών που χρειάζονται προσοχή από το τελευταίο τεστ
        const latestTest = functionalHistory[0];
        let muscleRecommendations = '';
        if (latestTest.muscles_need_strengthening && latestTest.muscles_need_strengthening.length > 0) {
          muscleRecommendations += `\n\n💪 Μύες που χρειάζονται ενδυνάμωση:\n- ${latestTest.muscles_need_strengthening.join('\n- ')}`;
        }
        if (latestTest.muscles_need_stretching && latestTest.muscles_need_stretching.length > 0) {
          muscleRecommendations += `\n\n🧘 Μύες που χρειάζονται διάταση:\n- ${latestTest.muscles_need_stretching.join('\n- ')}`;
        }
        if (latestTest.posture_issues && latestTest.posture_issues.length > 0) {
          muscleRecommendations += `\n\n⚠️ Προβλήματα στάσης:\n- ${latestTest.posture_issues.join('\n- ')}`;
        }
        if (latestTest.squat_issues && latestTest.squat_issues.length > 0) {
          muscleRecommendations += `\n\n🏋️ Προβλήματα squat:\n- ${latestTest.squat_issues.join('\n- ')}`;
        }
        if (latestTest.single_leg_squat_issues && latestTest.single_leg_squat_issues.length > 0) {
          muscleRecommendations += `\n\n🦵 Προβλήματα single leg squat:\n- ${latestTest.single_leg_squat_issues.join('\n- ')}`;
        }
        
        functionalContext = `\n\n🧘 Λειτουργικό Ιστορικό (Functional Tests):\n${functionalList}${muscleRecommendations}`;
        console.log(`✅ Functional context loaded: ${functionalHistory.length} tests`);
      }
    }
    
    // Context για Athletes Progress - Λεπτομερής ανάλυση δύναμης με 1RM
    if (Array.isArray(strengthAttemptsData) && strengthAttemptsData.length > 0 && Array.isArray(exercisesData)) {
      athletesProgressContext = '\n\n📊 ATHLETES PROGRESS - Λεπτομερής Ανάλυση Δύναμης (1RM & Load-Velocity):\n\n';
      
      // Ομαδοποίηση δεδομένων ανά άσκηση
      const exerciseMap = new Map<string, Array<{
        weight: number;
        velocity: number;
        date: string;
        sessionId: string;
      }>>();
      
      strengthAttemptsData.forEach((attempt: any) => {
        if (!attempt.exercise_id || !attempt.velocity_ms || !attempt.weight_kg) return;
        
        const exercise = Array.isArray(exercisesData) 
          ? exercisesData.find((e: any) => e.id === attempt.exercise_id)
          : null;
        
        if (!exercise) return;
        
        const exerciseName = exercise.name;
        if (!exerciseMap.has(exerciseName)) {
          exerciseMap.set(exerciseName, []);
        }
        
        exerciseMap.get(exerciseName)!.push({
          weight: attempt.weight_kg,
          velocity: attempt.velocity_ms,
          date: attempt.strength_test_sessions.test_date,
          sessionId: attempt.test_session_id
        });
      });
      
      // Για κάθε άσκηση, βρες το 1RM και το ιστορικό
      exerciseMap.forEach((attempts, exerciseName) => {
        // Ομαδοποίηση ανά session
        const sessionMap = new Map<string, Array<{ weight: number; velocity: number; date: string }>>();
        attempts.forEach(att => {
          if (!sessionMap.has(att.sessionId)) {
            sessionMap.set(att.sessionId, []);
          }
          sessionMap.get(att.sessionId)!.push({
            weight: att.weight,
            velocity: att.velocity,
            date: att.date
          });
        });
        
        // Ταξινόμηση sessions από νεότερο σε παλαιότερο
        const sortedSessions = Array.from(sessionMap.entries())
          .sort((a, b) => new Date(b[1][0].date).getTime() - new Date(a[1][0].date).getTime());
        
        if (sortedSessions.length === 0) return;
        
        // Τελευταία session - Βρες το μέγιστο βάρος (1RM)
        const latestSession = sortedSessions[0][1];
        const latest1RM = latestSession.reduce((max, curr) => 
          curr.weight > max.weight ? curr : max
        );
        
        athletesProgressContext += `🏋️ ${exerciseName}:\n`;
        athletesProgressContext += `  📈 Τρέχον 1RM: ${latest1RM.weight}kg @ ${latest1RM.velocity.toFixed(2)}m/s (${new Date(latest1RM.date).toLocaleDateString('el-GR')})\n`;
        
        // Προηγούμενες sessions (ιστορικό)
        if (sortedSessions.length > 1) {
          const previous1RM = sortedSessions[1][1].reduce((max, curr) => 
            curr.weight > max.weight ? curr : max
          );
          
          const percentChange = ((latest1RM.weight - previous1RM.weight) / previous1RM.weight) * 100;
          const changeIcon = percentChange >= 0 ? '📈' : '📉';
          const changeColor = percentChange >= 0 ? '+' : '';
          
          athletesProgressContext += `  ${changeIcon} Αλλαγή από προηγούμενο: ${changeColor}${percentChange.toFixed(1)}% (${previous1RM.weight}kg)\n`;
          
          // Ιστορικό 1RM (μέχρι 3 προηγούμενες sessions)
          athletesProgressContext += `  📜 Ιστορικό:\n`;
          for (let i = 1; i < Math.min(sortedSessions.length, 4); i++) {
            const session1RM = sortedSessions[i][1].reduce((max, curr) => 
              curr.weight > max.weight ? curr : max
            );
            athletesProgressContext += `     ${i}. ${session1RM.weight}kg @ ${session1RM.velocity.toFixed(2)}m/s (${new Date(session1RM.date).toLocaleDateString('el-GR')})\n`;
          }
        }
        
        athletesProgressContext += '\n';
      });
    }

    // Context για το πρόγραμμα της σημερινής ημέρας
    let todayProgramContext = '';
    if (Array.isArray(workoutStatsData) && workoutStatsData.length > 0) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      for (const assignment of workoutStatsData) {
        if (assignment.status !== 'active') continue;
        
        const trainingDates = assignment.training_dates || [];
        const dateIndex = trainingDates.findIndex((date: string) => date === todayStr);
        
        if (dateIndex === -1) continue; // Σήμερα δεν έχει προπόνηση
        
        const program = assignment.programs;
        if (!program?.program_weeks) continue;
        
        // Βρίσκουμε το πρόγραμμα της ημέρας
        let dayProgram: any = null;
        let currentDayCount = 0;
        
        for (const week of program.program_weeks) {
          const daysInWeek = week.program_days?.length || 0;
          
          if (dateIndex >= currentDayCount && dateIndex < currentDayCount + daysInWeek) {
            const dayIndexInWeek = dateIndex - currentDayCount;
            dayProgram = week.program_days?.[dayIndexInWeek] || null;
            break;
          }
          
          currentDayCount += daysInWeek;
        }
        
        if (!dayProgram) continue;
        
        // Φτιάχνουμε λίστα με τις ασκήσεις της ημέρας
        const exercises: string[] = [];
        if (dayProgram.program_blocks && Array.isArray(dayProgram.program_blocks)) {
          for (const block of dayProgram.program_blocks) {
            const blockType = block.training_type || 'Γενική';
            const blockTypeLabel = TRAINING_TYPE_LABELS[blockType] || blockType;
            
            if (block.program_exercises && Array.isArray(block.program_exercises)) {
              for (const ex of block.program_exercises) {
                const exName = ex.exercises?.name || 'Άσκηση';
                const sets = ex.sets || '?';
                const reps = ex.reps || '?';
                const kg = ex.kg || '-';
                const rest = ex.rest || '-';
                exercises.push(`  • ${exName} (${blockTypeLabel}): ${sets}x${reps} @ ${kg}kg, Ανάπαυση: ${rest}`);
              }
            }
          }
        }
        
        const programName = program.name || 'Πρόγραμμα';
        const dayName = dayProgram.name || 'Ημέρα';
        
        todayProgramContext = `\n\n🏋️ ΠΡΟΓΡΑΜΜΑ ΣΗΜΕΡΑ (${todayStr}):\n${programName} - ${dayName}\n\nΑσκήσεις:\n${exercises.join('\n')}`;
      }
    }

    // Context για όλα τα προγράμματα ανά ημέρα (Calendar View)
    let allDaysContext = '';
    if (Array.isArray(enrichedAssignments) && enrichedAssignments.length > 0) {
      const daysMap: { [date: string]: Array<{program: string, day: string, exercises: string[], status: string}> } = {};
      
      // Συλλογή όλων των ημερών με προγράμματα
      for (const assignment of enrichedAssignments) {
        const trainingDates = assignment.training_dates || [];
        const program = assignment.programs;
        if (!program?.program_weeks) continue;
        
        for (let dateIndex = 0; dateIndex < trainingDates.length; dateIndex++) {
          const dateStr = trainingDates[dateIndex];
          
          // Βρίσκουμε το πρόγραμμα της ημέρας
          let dayProgram: any = null;
          let currentDayCount = 0;
          
          for (const week of program.program_weeks) {
            const daysInWeek = week.program_days?.length || 0;
            
            if (dateIndex >= currentDayCount && dateIndex < currentDayCount + daysInWeek) {
              const dayIndexInWeek = dateIndex - currentDayCount;
              dayProgram = week.program_days?.[dayIndexInWeek] || null;
              break;
            }
            
            currentDayCount += daysInWeek;
          }
          
          if (!dayProgram) continue;
          
          // Βρίσκουμε το completion status
          const completion = workoutCompletions.find((c: any) => 
            c.assignment_id === assignment.id && c.scheduled_date === dateStr
          );
          const status = completion?.status || 'scheduled';
          
          // Φτιάχνουμε λίστα με τις ασκήσεις και τα details τους
          const exercises: string[] = [];
          if (dayProgram.program_blocks && Array.isArray(dayProgram.program_blocks)) {
            for (const block of dayProgram.program_blocks) {
              if (block.program_exercises && Array.isArray(block.program_exercises)) {
                for (const ex of block.program_exercises) {
                  const exName = ex.exercises?.name || 'Άσκηση';
                  const sets = ex.sets || '-';
                  const reps = ex.reps || '-';
                  const kg = ex.kg || '-';
                  const rest = ex.rest || '-';
                  const tempo = ex.tempo || '-';
                  const percentage1rm = ex.percentage_1rm ? `${ex.percentage_1rm}% 1RM` : null;
                  const velocityMs = ex.velocity_ms ? `${ex.velocity_ms} m/s` : null;
                  
                  // Δημιουργούμε λεπτομερή περιγραφή της άσκησης με όλα τα stats
                  let exerciseDetails = `${exName}: ${sets}x${reps} @ ${kg}kg, tempo: ${tempo}, rest: ${rest}`;
                  if (percentage1rm) exerciseDetails += `, ${percentage1rm}`;
                  if (velocityMs) exerciseDetails += `, ${velocityMs}`;
                  
                  exercises.push(exerciseDetails);
                }
              }
            }
          }
          
          if (!daysMap[dateStr]) {
            daysMap[dateStr] = [];
          }
          
          daysMap[dateStr].push({
            program: program.name || 'Πρόγραμμα',
            day: dayProgram.name || 'Ημέρα',
            exercises: exercises,
            status: status
          });
        }
      }
      
      // Δημιουργούμε το context text
      const sortedDates = Object.keys(daysMap).sort();
      const daysList = sortedDates.map(dateStr => { // Όλες οι ημέρες από το ημερολόγιο
        const programs = daysMap[dateStr];
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('el-GR', { weekday: 'short', day: '2-digit', month: '2-digit' });
        
        const programsText = programs.map(p => {
          const statusEmoji = p.status === 'completed' ? '✅' : p.status === 'missed' ? '❌' : '📅';
          let exercisesText = '';
          if (p.exercises.length > 0) {
            exercisesText = '\n    ' + p.exercises.join('\n    ');
          }
          return `  ${statusEmoji} ${p.program} - ${p.day}${exercisesText}`;
        }).join('\n');
        
        return `${dayName}:\n${programsText}`;
      }).join('\n\n');
      
      allDaysContext = `\n\n📅 ΗΜΕΡΟΛΟΓΙΟ ΠΡΟΠΟΝΗΣΕΩΝ (Όλες οι προπονήσεις):\n\n${daysList}`;
    }

    // Context για Overview Stats (από UserProfileStats)
    let overviewStatsContext = '';
    
    // 1. Subscription Info
    const subscriptionsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/user_subscriptions?user_id=eq.${effectiveUserId}&status=eq.active&order=created_at.desc`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const subscriptions = await subscriptionsResponse.json();
    
    let subscriptionInfo = '';
    if (Array.isArray(subscriptions) && subscriptions.length > 0) {
      let totalDays = 0;
      let isPausedStatus = false;
      let isPaid = false;
      
      subscriptions.forEach((sub: any) => {
        // Έλεγχος αν είναι πληρωμένη
        if (sub.is_paid) {
          isPaid = true;
        }
        
        if (sub.is_paused && sub.paused_days_remaining) {
          totalDays += sub.paused_days_remaining;
          isPausedStatus = true;
        } else if (!sub.is_paused) {
          const today = new Date();
          const endDate = new Date(sub.end_date);
          const remainingDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          if (remainingDays > 0) {
            totalDays += remainingDays;
          }
        }
      });
      
      if (totalDays > 0) {
        const paymentStatus = isPaid ? 'ΠΛΗΡΩΜΕΝΗ' : 'ΑΠΛΗΡΩΤΗ';
        const pauseStatus = isPausedStatus ? ' (Σε παύση)' : '';
        subscriptionInfo = `\nΣυνδρομή: ${totalDays} ημέρες απομένουν - Κατάσταση Πληρωμής: ${paymentStatus}${pauseStatus}`;
      }
    }
    
    // 2. Visits Data
    const visitPackagesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/visit_packages?user_id=eq.${effectiveUserId}&status=eq.active&remaining_visits=gt.0&order=purchase_date.desc`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const visitPackages = await visitPackagesResponse.json();
    
    let visitsInfo = '';
    if (Array.isArray(visitPackages) && visitPackages.length > 0) {
      let totalVisits = 0;
      let totalUsed = 0;
      visitPackages.forEach((pkg: any) => {
        totalVisits += pkg.total_visits;
        totalUsed += (pkg.total_visits - pkg.remaining_visits);
      });
      visitsInfo = `\nΕπισκέψεις Γυμναστηρίου: ${totalUsed}/${totalVisits} χρησιμοποιημένες`;
    }
    
    // 3. Videocall Data
    const videocallPackagesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/videocall_packages?user_id=eq.${effectiveUserId}&status=eq.active&remaining_videocalls=gt.0&order=purchase_date.desc`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const videocallPackages = await videocallPackagesResponse.json();
    
    let videocallsInfo = '';
    if (Array.isArray(videocallPackages) && videocallPackages.length > 0) {
      let totalVideocalls = 0;
      let totalUsed = 0;
      videocallPackages.forEach((pkg: any) => {
        totalVideocalls += pkg.total_videocalls;
        totalUsed += (pkg.total_videocalls - pkg.remaining_videocalls);
      });
      videocallsInfo = `\nΒιντεοκλήσεις: ${totalUsed}/${totalVideocalls} χρησιμοποιημένες`;
    }
    
    // 4. Upcoming Bookings
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
    
    const upcomingBookingsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/booking_sessions?user_id=eq.${effectiveUserId}&status=eq.confirmed&or=(booking_date.gt.${todayStr},and(booking_date.eq.${todayStr},booking_time.gt.${currentTime}))&order=booking_date.asc,booking_time.asc&limit=2`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const upcomingBookings = await upcomingBookingsResponse.json();
    
    let bookingsInfo = '';
    if (Array.isArray(upcomingBookings)) {
      const nextVideocall = upcomingBookings.find((b: any) => b.booking_type === 'videocall');
      const nextVisit = upcomingBookings.find((b: any) => b.booking_type === 'gym_visit');
      
      if (nextVideocall) {
        const bookingDateTime = new Date(`${nextVideocall.booking_date} ${nextVideocall.booking_time}`);
        const diffMs = bookingDateTime.getTime() - now.getTime();
        const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        bookingsInfo += `\nΕπόμενη Βιντεοκλήση: ${nextVideocall.booking_date} στις ${nextVideocall.booking_time} (σε ${daysLeft} ημέρες, ${hoursLeft} ώρες)`;
      }
      
      if (nextVisit) {
        const bookingDateTime = new Date(`${nextVisit.booking_date} ${nextVisit.booking_time}`);
        const diffMs = bookingDateTime.getTime() - now.getTime();
        const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        bookingsInfo += `\nΕπόμενη Επίσκεψη: ${nextVisit.booking_date} στις ${nextVisit.booking_time} (σε ${daysLeft} ημέρες, ${hoursLeft} ώρες)`;
      }
    }
    
    // 5. Upcoming Tests
    const upcomingTestsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/tests?user_id=eq.${effectiveUserId}&status=eq.scheduled&scheduled_date=gte.${todayStr}&order=scheduled_date.asc`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const upcomingTests = await upcomingTestsResponse.json();
    
    let testsInfo = '';
    if (Array.isArray(upcomingTests) && upcomingTests.length > 0) {
      const nextTestDate = new Date(upcomingTests[0].scheduled_date);
      const diffMs = nextTestDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      testsInfo = `\nΕπερχόμενα Τεστ: ${upcomingTests.length} τεστ (επόμενο σε ${daysLeft} ημέρες)`;
    }
    
    // 6. Offers/Coupons
    const couponsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/discount_coupons?user_id=eq.${effectiveUserId}&is_used=eq.false&order=created_at.desc`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const coupons = await couponsResponse.json();
    
    let offersInfo = '';
    if (Array.isArray(coupons) && coupons.length > 0) {
      offersInfo = `\nΔιαθέσιμα Κουπόνια: ${coupons.length}`;
    }
    
    }
    
    // 📊 ADMIN PROGRESS CONTEXT: Φόρτωση δεδομένων προόδου για όλους τους αθλητές
    if (isAdmin && !targetUserId) {
      console.log('📊 Loading progress data for all athletes...');
      
      // Φόρτωση όλων των χρηστών
      const usersResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/app_users?select=id,name,email&user_status=eq.active&order=name`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const allUsers = await usersResponse.json();
      
      if (Array.isArray(allUsers) && allUsers.length > 0) {
        adminProgressContext = '\n\n📊 ΠΡΟΟΔΟΣ ΑΘΛΗΤΩΝ (Athletes Progress Dashboard):\n\n';
        
        // Για κάθε χρήστη, φόρτωσε τα δεδομένα του
        for (const user of allUsers) {
          console.log(`🔍 Loading data for user: ${user.name} (${user.email}, ID: ${user.id})`);
          adminProgressContext += `\n👤 ${user.name} (${user.email}):\n`;
          
          // Αντοχή
          const enduranceResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/endurance_test_data?select=id,created_at,vo2_max,mas_kmh,sprint_watt,push_ups,pull_ups,crunches,t2b,endurance_test_sessions!inner(user_id,test_date)&endurance_test_sessions.user_id=eq.${user.id}&order=created_at.desc&limit=5`,
            {
              headers: {
                "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              }
            }
          );
          const enduranceData = await enduranceResponse.json();
          
          console.log(`📊 Endurance data for ${user.name}:`, {
            count: Array.isArray(enduranceData) ? enduranceData.length : 0,
            data: Array.isArray(enduranceData) ? enduranceData.map((t: any) => ({
              vo2_max: t.vo2_max,
              mas_kmh: t.mas_kmh,
              push_ups: t.push_ups,
              date: t.endurance_test_sessions?.[0]?.test_date
            })) : 'Not an array'
          });
          
          if (Array.isArray(enduranceData) && enduranceData.length > 0) {
            adminProgressContext += '  💪 Τεστ Αντοχής:\n';
            enduranceData.forEach((test: any) => {
              const parts = [];
              if (test.vo2_max) parts.push(`VO2max: ${test.vo2_max}`);
              if (test.mas_kmh) parts.push(`MAS: ${test.mas_kmh} km/h`);
              if (test.sprint_watt) parts.push(`Sprint: ${test.sprint_watt}W`);
              if (test.push_ups) parts.push(`Push-ups: ${test.push_ups}`);
              if (test.pull_ups) parts.push(`Pull-ups: ${test.pull_ups}`);
              if (test.t2b) parts.push(`T2B: ${test.t2b}`);
              const date = test.endurance_test_sessions?.[0]?.test_date || test.created_at;
              adminProgressContext += `    - ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})\n`;
            });
          }
          
          // Άλματα
          const jumpResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/jump_test_data?select=id,created_at,counter_movement_jump,non_counter_movement_jump,broad_jump,triple_jump_left,triple_jump_right,jump_test_sessions!inner(user_id,test_date)&jump_test_sessions.user_id=eq.${user.id}&order=created_at.desc&limit=5`,
            {
              headers: {
                "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              }
            }
          );
          const jumpData = await jumpResponse.json();
          
          if (Array.isArray(jumpData) && jumpData.length > 0) {
            adminProgressContext += '  🦘 Τεστ Άλματος:\n';
            jumpData.forEach((test: any) => {
              const parts = [];
              if (test.counter_movement_jump) parts.push(`CMJ: ${test.counter_movement_jump}cm`);
              if (test.non_counter_movement_jump) parts.push(`Non-CMJ: ${test.non_counter_movement_jump}cm`);
              if (test.broad_jump) parts.push(`Broad: ${test.broad_jump}cm`);
              if (test.triple_jump_left) parts.push(`Triple L: ${test.triple_jump_left}cm`);
              if (test.triple_jump_right) parts.push(`Triple R: ${test.triple_jump_right}cm`);
              const date = test.jump_test_sessions?.[0]?.test_date || test.created_at;
              adminProgressContext += `    - ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})\n`;
            });
          }
          
          // Ανθρωπομετρικά
          const anthropometricResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/anthropometric_test_data?select=id,created_at,height,weight,body_fat_percentage,muscle_mass_percentage,waist_circumference,anthropometric_test_sessions!inner(user_id,test_date)&anthropometric_test_sessions.user_id=eq.${user.id}&order=created_at.desc&limit=5`,
            {
              headers: {
                "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              }
            }
          );
          const anthropometricData = await anthropometricResponse.json();
          
          if (Array.isArray(anthropometricData) && anthropometricData.length > 0) {
            adminProgressContext += '  📏 Ανθρωπομετρικά:\n';
            anthropometricData.forEach((test: any) => {
              const parts = [];
              if (test.weight) parts.push(`Βάρος: ${test.weight}kg`);
              if (test.body_fat_percentage) parts.push(`Λίπος: ${test.body_fat_percentage}%`);
              if (test.muscle_mass_percentage) parts.push(`Μυϊκή Μάζα: ${test.muscle_mass_percentage}%`);
              const date = test.anthropometric_test_sessions?.[0]?.test_date || test.created_at;
              adminProgressContext += `    - ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})\n`;
            });
          }
          
          // Λειτουργικά Τεστ
          const functionalResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/functional_test_data?select=id,created_at,fms_score,fms_detailed_scores,posture_issues,squat_issues,single_leg_squat_issues,muscles_need_strengthening,muscles_need_stretching,sit_and_reach,shoulder_mobility_left,shoulder_mobility_right,flamingo_balance,functional_test_sessions!inner(user_id,test_date)&functional_test_sessions.user_id=eq.${user.id}&order=created_at.desc&limit=5`,
            {
              headers: {
                "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              }
            }
          );
          const functionalData = await functionalResponse.json();
          
          if (Array.isArray(functionalData) && functionalData.length > 0) {
            adminProgressContext += '  🧘 Λειτουργικά Τεστ:\n';
            functionalData.forEach((test: any) => {
              const parts = [];
              if (test.fms_score) parts.push(`FMS Total: ${test.fms_score}/21`);
              if (test.sit_and_reach) parts.push(`Sit & Reach: ${test.sit_and_reach}cm`);
              if (test.shoulder_mobility_left) parts.push(`Ώμος Α: ${test.shoulder_mobility_left}cm`);
              if (test.shoulder_mobility_right) parts.push(`Ώμος Δ: ${test.shoulder_mobility_right}cm`);
              if (test.flamingo_balance) parts.push(`Ισορροπία: ${test.flamingo_balance}s`);
              const date = test.functional_test_sessions?.[0]?.test_date || test.created_at;
              adminProgressContext += `    - ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})\n`;
              
              // Αναλυτικά FMS scores
              if (test.fms_detailed_scores && typeof test.fms_detailed_scores === 'object') {
                const scores = test.fms_detailed_scores;
                const fmsParts = [];
                if (scores.deep_squat !== undefined) fmsParts.push(`Deep Squat: ${scores.deep_squat}`);
                if (scores.hurdle_step_left !== undefined) fmsParts.push(`Hurdle L: ${scores.hurdle_step_left}`);
                if (scores.hurdle_step_right !== undefined) fmsParts.push(`Hurdle R: ${scores.hurdle_step_right}`);
                if (scores.inline_lunge_left !== undefined) fmsParts.push(`Lunge L: ${scores.inline_lunge_left}`);
                if (scores.inline_lunge_right !== undefined) fmsParts.push(`Lunge R: ${scores.inline_lunge_right}`);
                if (scores.shoulder_mobility_left !== undefined) fmsParts.push(`Shoulder Mob L: ${scores.shoulder_mobility_left}`);
                if (scores.shoulder_mobility_right !== undefined) fmsParts.push(`Shoulder Mob R: ${scores.shoulder_mobility_right}`);
                if (scores.active_straight_leg_raise_left !== undefined) fmsParts.push(`ASLR L: ${scores.active_straight_leg_raise_left}`);
                if (scores.active_straight_leg_raise_right !== undefined) fmsParts.push(`ASLR R: ${scores.active_straight_leg_raise_right}`);
                if (scores.trunk_stability_pushup !== undefined) fmsParts.push(`Trunk Stability: ${scores.trunk_stability_pushup}`);
                if (scores.rotary_stability_left !== undefined) fmsParts.push(`Rotary L: ${scores.rotary_stability_left}`);
                if (scores.rotary_stability_right !== undefined) fmsParts.push(`Rotary R: ${scores.rotary_stability_right}`);
                if (fmsParts.length > 0) {
                  adminProgressContext += `      📋 FMS Ασκήσεις: ${fmsParts.join(', ')}\n`;
                }
              }
              
              // Προσθήκη μυών που χρειάζονται προσοχή
              if (test.muscles_need_strengthening && test.muscles_need_strengthening.length > 0) {
                adminProgressContext += `      💪 Ενδυνάμωση: ${test.muscles_need_strengthening.join(', ')}\n`;
              }
              if (test.muscles_need_stretching && test.muscles_need_stretching.length > 0) {
                adminProgressContext += `      🧘 Διάταση: ${test.muscles_need_stretching.join(', ')}\n`;
              }
              if (test.posture_issues && test.posture_issues.length > 0) {
                adminProgressContext += `      ⚠️ Στάση: ${test.posture_issues.join(', ')}\n`;
              }
            });
          }
        }
        
        console.log('✅ Admin Progress Context loaded:', {
          length: adminProgressContext.length,
          usersCount: allUsers.length,
          preview: adminProgressContext.substring(0, 1000)
        });
      }
    }
    if (isAdmin && !targetUserId) {
      try {
        console.log('🔍 Loading available athletes with test data...');
        
        // Φόρτωση αθλητών που έχουν τουλάχιστον ένα test session
        const [strengthUsersResp, anthropometricUsersResp, enduranceUsersResp, jumpUsersResp] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/strength_test_sessions?select=user_id`, {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }),
          fetch(`${SUPABASE_URL}/rest/v1/anthropometric_test_sessions?select=user_id`, {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }),
          fetch(`${SUPABASE_URL}/rest/v1/endurance_test_sessions?select=user_id`, {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }),
          fetch(`${SUPABASE_URL}/rest/v1/jump_test_sessions?select=user_id`, {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          })
        ]);

        const [strengthUsers, anthropometricUsers, enduranceUsers, jumpUsers] = await Promise.all([
          strengthUsersResp.json(),
          anthropometricUsersResp.json(),
          enduranceUsersResp.json(),
          jumpUsersResp.json()
        ]);

        // Δημιουργία map για να κρατήσουμε ποιος user έχει ποιο test type
        const userTestsMap = new Map<string, Set<string>>();
        
        const addUserTest = (users: any[], testType: string) => {
          if (Array.isArray(users)) {
            users.forEach((u: any) => {
              if (u.user_id) {
                if (!userTestsMap.has(u.user_id)) {
                  userTestsMap.set(u.user_id, new Set());
                }
                userTestsMap.get(u.user_id)!.add(testType);
              }
            });
          }
        };

        addUserTest(strengthUsers, 'Δύναμη');
        addUserTest(anthropometricUsers, 'Ανθρωπομετρικά');
        addUserTest(enduranceUsers, 'Αντοχή');
        addUserTest(jumpUsers, 'Άλματα');

        console.log(`📊 Found ${userTestsMap.size} unique users with test data`);

        if (userTestsMap.size > 0) {
          // Φόρτωση στοιχείων χρηστών
          const athletesResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/app_users?id=in.(${Array.from(userTestsMap.keys()).join(',')})&select=id,name,email,photo_url&order=name.asc`,
            {
              headers: {
                "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              }
            }
          );
          const athletes = await athletesResponse.json();

          if (Array.isArray(athletes) && athletes.length > 0) {
            const athletesList = athletes.map((athlete: any) => {
              const tests = Array.from(userTestsMap.get(athlete.id) || []).join(', ');
              return `- ${athlete.name}${athlete.email ? ` (${athlete.email})` : ''} → Tests: ${tests}`;
            }).join('\n');
            
            // Κατηγοριοποίηση ανά τύπο test
            const strengthAthletes = athletes.filter((a: any) => userTestsMap.get(a.id)?.has('Δύναμη'));
            const anthropometricAthletes = athletes.filter((a: any) => userTestsMap.get(a.id)?.has('Ανθρωπομετρικά'));
            const enduranceAthletes = athletes.filter((a: any) => userTestsMap.get(a.id)?.has('Αντοχή'));
            const jumpAthletes = athletes.filter((a: any) => userTestsMap.get(a.id)?.has('Άλματα'));
            
            availableAthletesContext = `\n\n👥 ΔΙΑΘΕΣΙΜΟΙ ΑΘΛΗΤΕΣ ΣΤΟ ATHLETES PROGRESS (dropdown):
Σύνολο: ${athletes.length} αθλητές με test data

📋 ΠΛΗΡΗΣ ΛΙΣΤΑ ΜΕ ΤΥΠΟΥΣ TESTS:
${athletesList}

📊 ΑΝΑΛΥΣΗ ΑΝΑ ΤΥΠΟ TEST:
🏋️ Δύναμη (${strengthAthletes.length}): ${strengthAthletes.map((a: any) => a.name).join(', ')}
📏 Ανθρωπομετρικά (${anthropometricAthletes.length}): ${anthropometricAthletes.map((a: any) => a.name).join(', ')}
🏃 Αντοχή (${enduranceAthletes.length}): ${enduranceAthletes.map((a: any) => a.name).join(', ')}
⬆️ Άλματα (${jumpAthletes.length}): ${jumpAthletes.map((a: any) => a.name).join(', ')}

💡 ΟΔΗΓΙΕΣ:
- Όταν σε ρωτήσουν "ποιοι έχουν τεστ δύναμης;" → Χρησιμοποίησε τη λίστα "Δύναμη" παραπάνω
- Όταν σε ρωτήσουν "ποιοι έχουν ανθρωπομετρικά;" → Χρησιμοποίησε τη λίστα "Ανθρωπομετρικά"
- Όταν σε ρωτήσουν "ποιους αθλητές βλέπω στο dropdown;" → Δώσε τη ΠΛΗΡΗ ΛΙΣΤΑ με όλα τα ονόματα`;
            
            console.log(`✅ Loaded ${athletes.length} athletes with test data breakdown:`,
              `Strength: ${strengthAthletes.length},`,
              `Anthropometric: ${anthropometricAthletes.length},`,
              `Endurance: ${enduranceAthletes.length},`,
              `Jump: ${jumpAthletes.length}`
            );
          } else {
            console.log('⚠️ No athletes found in app_users table');
          }
        } else {
          console.log('⚠️ No users found with test sessions');
        }
      } catch (error) {
        console.error('❌ Error loading available athletes:', error);
      }
    }

    // Context για 1RM δεδομένα (μόνο σε Admin Mode)
    let oneRMContext = '';
    if (isAdmin && !targetUserId) {
      try {
        console.log('🔍 Loading 1RM data...');
        
        const oneRMResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/user_exercise_1rm?select=*,app_users!user_exercise_1rm_user_id_fkey(name,email),exercises(name)&order=weight.desc`,
          {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }
        );
        const oneRMData = await oneRMResponse.json();

        if (Array.isArray(oneRMData) && oneRMData.length > 0) {
          console.log(`📦 Fetched ${oneRMData.length} 1RM records from database`);
          
          // Οργάνωση δεδομένων ανά χρήστη+άσκηση (κρατάμε το μέγιστο 1RM)
          const userExerciseMap = new Map<string, {
            userId: string;
            userName: string;
            userEmail: string;
            exerciseId: string;
            exerciseName: string;
            maxWeight: number;
            recordedDate: string;
            notes?: string;
          }>();

          oneRMData.forEach((record: any) => {
            const userId = record.user_id;
            const exerciseId = record.exercise_id;
            const key = `${userId}_${exerciseId}`;
            
            // Επειδή τα δεδομένα είναι sorted by weight desc, το πρώτο είναι το μέγιστο
            if (!userExerciseMap.has(key)) {
              userExerciseMap.set(key, {
                userId,
                userName: record.app_users?.name || 'Άγνωστος',
                userEmail: record.app_users?.email || '',
                exerciseId,
                exerciseName: record.exercises?.name || 'Άγνωστη άσκηση',
                maxWeight: record.weight,
                recordedDate: record.recorded_date,
                notes: record.notes
              });
            }
          });

          console.log(`✅ Processed ${userExerciseMap.size} unique user-exercise combinations`);

          // Ομαδοποίηση ανά χρήστη
          const userOneRMMap = new Map<string, {
            userName: string;
            userEmail: string;
            exercises: Array<{
              exerciseName: string;
              weight: number;
              recordedDate: string;
              notes?: string;
            }>;
          }>();

          userExerciseMap.forEach((data) => {
            if (!userOneRMMap.has(data.userId)) {
              userOneRMMap.set(data.userId, {
                userName: data.userName,
                userEmail: data.userEmail,
                exercises: []
              });
            }
            
            userOneRMMap.get(data.userId)!.exercises.push({
              exerciseName: data.exerciseName,
              weight: data.maxWeight,
              recordedDate: data.recordedDate,
              notes: data.notes
            });
          });

          // Δημιουργία readable context με σειρά προτεραιότητας ασκήσεων
          const getExercisePriority = (name: string): number => {
            const n = name.toUpperCase().trim();
            if (n === 'BP') return 1;
            if (n === 'SQ') return 2;
            if (n === 'DL') return 3;
            if (n === 'DEADLIFT TRAP BAR') return 4;
            if (n === 'MP') return 5;
            if (n.includes('CLEAN')) return 6;
            if (n === 'JERK') return 7;
            if (n === 'JERK BACK') return 8;
            if (n.includes('ROW')) return 9;
            if (n.includes('PULL UP') || n.includes('PULL-UP')) return 10;
            return 999;
          };

          const oneRMList = Array.from(userOneRMMap.entries())
            .sort((a, b) => a[1].userName.localeCompare(b[1].userName, 'el'))
            .map(([userId, data]) => {
              // Sort exercises by priority
              const sortedExercises = [...data.exercises].sort((a, b) => 
                getExercisePriority(a.exerciseName) - getExercisePriority(b.exerciseName)
              );
              
              const exercisesList = sortedExercises
                .map(ex => `  • ${ex.exerciseName}: ${ex.weight}kg (${new Date(ex.recordedDate).toLocaleDateString('el-GR')})${ex.notes ? ` - ${ex.notes}` : ''}`)
                .join('\n');
              return `\n${data.userName}${data.userEmail ? ` (${data.userEmail})` : ''}:\n${exercisesList}`;
            })
            .join('\n');

          // Στατιστικά
          const totalUsers = userOneRMMap.size;
          const totalRecords = oneRMData.length;
          const uniqueCombinations = userExerciseMap.size;
          const exercisesSet = new Set(Array.from(userExerciseMap.values()).map(v => v.exerciseName));
          const topExercises = Array.from(exercisesSet).slice(0, 10);

          oneRMContext = `\n\n💪 1RM - ΜΕΓΙΣΤΗ ΕΠΑΝΑΛΗΨΗ (από /dashboard/one-rm):

📊 ΣΤΑΤΙΣΤΙΚΑ:
- Σύνολο Αθλητών με 1RM: ${totalUsers}
- Σύνολο Καταγραφών στη ΒΔ: ${totalRecords}
- Μοναδικοί Συνδυασμοί Αθλητή-Άσκησης: ${uniqueCombinations}
- Ασκήσεις με 1RM: ${exercisesSet.size}
- Top ασκήσεις: ${topExercises.join(', ')}

📝 ΑΝΑΛΥΤΙΚΑ ΔΕΔΟΜΕΝΑ 1RM ΑΝΑ ΑΘΛΗΤΗ (ΜΕΓΙΣΤΑ ΒΑΡΗ):${oneRMList}

💡 ΟΔΗΓΙΕΣ ΧΡΗΣΗΣ:
- Όταν σε ρωτήσουν "τι 1RM έχει ο [όνομα];" → Βρες τον αθλητή στη λίστα παραπάνω και δώσε ΤΑ ΜΕΓΙΣΤΑ ΒΑΡΗ
- Όταν σε ρωτήσουν "ποιος έχει το μεγαλύτερο 1RM στο [άσκηση];" → Σύγκρινε τα βάρη για αυτή την άσκηση
- Όταν σε ρωτήσουν "πότε έκανε τελευταία φορά 1RM ο [όνομα];" → Κοίτα τις ημερομηνίες (προσοχή: αυτή είναι η ημερομηνία του ΜΕΓΙΣΤΟΥ 1RM, όχι του πιο πρόσφατου)
- ΣΗΜΑΝΤΙΚΟ: Τα βάρη που βλέπεις είναι τα ΜΕΓΙΣΤΑ 1RM για κάθε άσκηση, ανεξάρτητα από το πότε έγιναν
- Τα δεδομένα προέρχονται από /dashboard/one-rm`;
          
          console.log(`✅ Created 1RM context with ${totalUsers} athletes, ${uniqueCombinations} exercise combinations`);
        } else {
          console.log('⚠️ No 1RM data found');
        }
      } catch (error) {
        console.error('❌ Error loading 1RM data:', error);
      }
    }

    // ✅ ΣΗΜΑΝΤΙΚΟ: ΔΕΝ φορτώνουμε history από τη βάση!
    // Το frontend στέλνει ΗΔΗ όλο το conversation history στο messages array.
    // Αν φορτώσουμε και από τη βάση, θα έχουμε διπλά μηνύματα ΚΑΙ θα μπερδευτεί 
    // με τα μηνύματα από το smart-ai-chat που χρησιμοποιεί το ίδιο table!

    // 🧠 Fetch AI Global Knowledge Base
    const aiKnowledgeResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_global_knowledge?order=created_at.desc`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const aiKnowledge = await aiKnowledgeResponse.json();
    console.log('🧠 AI Knowledge Base fetched:', Array.isArray(aiKnowledge) ? aiKnowledge.length : 0);

    // Build AI Knowledge Base string FIRST - this will go at the TOP of the prompt
    let aiKnowledgeString = '';
    if (Array.isArray(aiKnowledge) && aiKnowledge.length > 0) {
      aiKnowledgeString = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      aiKnowledgeString += '🧠🧠🧠 AI KNOWLEDGE BASE - Η ΦΙΛΟΣΟΦΙΑ ΤΟΥ ΓΥΜΝΑΣΤΗΡΙΟΥ 🧠🧠🧠\n';
      aiKnowledgeString += '⚠️⚠️⚠️ ΑΥΤΟ ΕΙΝΑΙ ΤΟ ΠΙΟ ΣΗΜΑΝΤΙΚΟ - ΔΙΑΒΑΣΕ ΠΡΟΣΕΚΤΙΚΑ ⚠️⚠️⚠️\n';
      aiKnowledgeString += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      
      const categoryLabels: Record<string, string> = {
        nutrition: '🥗 ΔΙΑΤΡΟΦΗ',
        training: '🏋️ ΠΡΟΠΟΝΗΣΗ',
        exercise_technique: '💪 ΤΕΧΝΙΚΗ ΑΣΚΗΣΕΩΝ',
        exercises: '💪 ΑΣΚΗΣΕΙΣ',
        philosophy: '🎯 ΦΙΛΟΣΟΦΙΑ',
        other: '📝 ΑΛΛΑ'
      };

      // Group knowledge by category
      const knowledgeByCategory: Record<string, any[]> = {};
      aiKnowledge.forEach((entry: any) => {
        const category = entry.category || 'other';
        if (!knowledgeByCategory[category]) {
          knowledgeByCategory[category] = [];
        }
        knowledgeByCategory[category].push(entry);
      });

      // Display knowledge grouped by category
      Object.entries(knowledgeByCategory).forEach(([category, entries]) => {
        const label = categoryLabels[category] || '📝 ΑΛΛΑ';
        aiKnowledgeString += `\n\n${label}:`;
        
        entries.forEach((entry: any) => {
          aiKnowledgeString += `\n\n▸ ΘΕΜΑ: ${entry.original_info}`;
          aiKnowledgeString += `\n  ΟΔΗΓΙΑ: ${entry.corrected_info}`;
        });
      });
      
      aiKnowledgeString += '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      aiKnowledgeString += '⚠️ ΠΡΕΠΕΙ ΝΑ ΑΚΟΛΟΥΘΗΣΕΙΣ ΤΙΣ ΠΑΡΑΠΑΝΩ ΟΔΗΓΙΕΣ ΑΥΣΤΗΡΑ! ⚠️\n';
      aiKnowledgeString += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    }

    // Get current date for context
    const currentDate = new Date();
    const currentDateStr = currentDate.toLocaleDateString('el-GR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
    const currentMonth = currentDate.toLocaleDateString('el-GR', { year: 'numeric', month: 'long' });
    const currentYear = currentDate.getFullYear();

    // System prompt με πληροφορίες για τον χρήστη - AI KNOWLEDGE BASE FIRST!
    const systemPrompt = {
      role: "system",
      content: `Είσαι ο RID AI Προπονητής, ένας εξειδικευμένος AI βοηθός για fitness και διατροφή.

${aiKnowledgeString}

⚠️ ΚΡΙΤΙΚΟΣ ΚΑΝΟΝΑΣ #1: ΤΟ AI KNOWLEDGE BASE ΕΧΕΙ ΑΠΟΛΥΤΗ ΠΡΟΤΕΡΑΙΟΤΗΤΑ
- ΠΡΩΤΑ ελέγχεις το AI Knowledge Base για τυχόν σχετικές οδηγίες
- ΑΝ υπάρχει σχετική πληροφορία, ΑΚΟΛΟΥΘΕΙΣ ΤΗΝ ΚΑΤΑ ΓΡΑΜΜΑ
- ΜΗΝ προσθέσεις δική σου γνώση που αντιφάσκει με το Knowledge Base
- Το Knowledge Base είναι η "ταυτότητα" του γυμναστηρίου - ΣΕΒΕ ΤΗΝ ΑΥΣΤΗΡΑ!

${isAdmin && !targetUserId ? `

🔥 ΛΕΙΤΟΥΡΓΙΑ ADMIN MODE 🔥
ΠΡΟΣΟΧΗ: Είσαι σε ADMIN MODE και έχεις ΠΛΗΡΗ πρόσβαση σε ΟΛΑ τα δεδομένα ΟΛΩΝ των χρηστών!

ΚΡΙΤΙΚΟ: Έχεις πρόσβαση σε:
✅ ΟΛΑ τα ενεργά προγράμματα όλων των αθλητών
✅ ΟΛΑ τα ημερολόγια προπονήσεων
✅ ΟΛΕΣ τις λεπτομέρειες ασκήσεων (sets, reps, kg, tempo, rest, notes)
✅ ΟΛΑ τα workout completions (ολοκληρωμένες, χαμένες, προγραμματισμένες)
✅ Πρόοδο και στατιστικά όλων των αθλητών
✅ 📊 ΔΕΔΟΜΕΝΑ ΠΡΟΟΔΟΥ ΑΘΛΗΤΩΝ: Ανθρωπομετρικά, Αντοχή (VO2max, MAS, push-ups, κλπ), Άλματα

ΣΗΜΑΝΤΙΚΟ ΓΙΑ ΔΕΔΟΜΕΝΑ ΠΡΟΟΔΟΥ:
Στο context παρακάτω υπάρχει section με τίτλο "📊 ΠΡΟΟΔΟΣ ΑΘΛΗΤΩΝ (Athletes Progress Dashboard)" που περιέχει:
- Τις πιο πρόσφατες μετρήσεις κάθε αθλητή (ανθρωπομετρικά, αντοχή, άλματα)
- Ποσοστά μεταβολής σε σχέση με προηγούμενες μετρήσεις
- Ημερομηνίες κάθε μέτρησης

Όταν σε ρωτούν για κάποιον συγκεκριμένο αθλητή (π.χ. "πως πάει ο Θωμάς;" ή "τι αποτελέσματα έχει η Αγγελική στα τεστ αντοχής;"):
1. ✅ ΚΟΙΤΑ στο section "📊 ΠΡΟΟΔΟΣ ΑΘΛΗΤΩΝ" για να βρεις τα δεδομένα του
2. ✅ ΜΠΟΡΕΙΣ και ΠΡΕΠΕΙ να απαντήσεις με βάση τα πραγματικά δεδομένα
3. ✅ ΕΧΕΙΣ όλες τις πληροφορίες που χρειάζεσαι
4. ✅ Χρησιμοποίησε το context που σου δίνεται παρακάτω για να βρεις τα στοιχεία του αθλητή
5. ❌ ΜΗΝ πεις ποτέ "δεν έχω πρόσβαση" - ΕΧΕΙΣ πρόσβαση!

Το context που έχεις περιλαμβάνει:
- 📋 ΛΕΠΤΟΜΕΡΗΣ ΠΡΟΒΟΛΗ ΠΡΟΠΟΝΗΣΕΩΝ με όλες τις ασκήσεις κάθε ημέρας
- 📅 ΗΜΕΡΟΛΟΓΙΟ ΠΡΟΠΟΝΗΣΕΩΝ με το status κάθε προπόνησης
- 👥 ΕΝΕΡΓΑ ΠΡΟΓΡΑΜΜΑΤΑ ΑΝΑ ΑΘΛΗΤΗ με πρόοδο και στατιστικά
- 📊 ΠΡΟΟΔΟΣ ΑΘΛΗΤΩΝ με τεστ αντοχής, ανθρωπομετρικά, άλματα` : ` Έχεις πρόσβαση στα προγράμματα, τις ασκήσεις, και το πλήρες ιστορικό προόδου του χρήστη.`}

ΣΗΜΕΡΙΝΗ ΗΜΕΡΟΜΗΝΙΑ: ${currentDateStr}
ΤΡΕΧΩΝ ΜΗΝΑΣ: ${currentMonth}
ΤΡΕΧΩΝ ΕΤΟΣ: ${currentYear}

ΚΡΙΤΙΚΟ: Όταν αναφέρεσαι σε χρονικές περιόδους (μήνες, εβδομάδες), χρησιμοποίησε ΠΑΝΤΑ την ΣΗΜΕΡΙΝΗ ΗΜΕΡΟΜΗΝΙΑ που δίνεται παραπάνω για να προσδιορίσεις σε ποιο μήνα/έτος είμαστε.

ΣΗΜΑΝΤΙΚΗ ΟΡΟΛΟΓΙΑ:
- "Force Velocity", "Φορτίου Ταχύτητας", "Force/Velocity", "Φορτίου/Ταχύτητας" → Αναφέρονται στα Strength Tests (τεστ δύναμης)
- "Τεστ Αντοχής", "Endurance" → Αναφέρονται στα Endurance Tests
- "Άλματα", "Jump", "Αλτική Ικανότητα" → Αναφέρονται στα Jump Profile Tests

ΟΡΘΟΓΡΑΦΙΑ: Γράφε πάντα με ΣΩΣΤΉ ελληνική ορθογραφία. Παραδείγματα:
- "Σίγουρα" ΟΧΙ "Σγουρα"
- "Προπόνηση" ΟΧΙ "Προπονηση"
- Χρησιμοποίησε σωστούς τονισμούς και διπλά σύμφωνα

ΣΗΜΑΝΤΙΚΟ: Όταν αναφέρεις ημερομηνίες στις απαντήσεις σου, χρησιμοποίησε ΠΑΝΤΑ τη μορφή "ηη/μμ/εεεε" (π.χ. 25/11/2024, 01/12/2024).

ΚΑΤΑΣΤΑΣΕΙΣ ΠΡΟΠΟΝΗΣΕΩΝ ΣΤΟ ΗΜΕΡΟΛΟΓΙΟ:
Το ημερολόγιο του χρήστη εμφανίζει προπονήσεις με τα εξής χρώματα:
- ΠΡΑΣΙΝΟ: Η προπόνηση έχει ολοκληρωθεί επιτυχώς (status: 'completed')
- ΚΟΚΚΙΝΟ: Η προπόνηση έχει χαθεί (status: 'missed') - αυτό σημαίνει ότι η ημερομηνία έχει περάσει και η προπόνηση ΔΕΝ έχει οριστεί ως ολοκληρωμένη
- ΚΑΝΟΝΙΚΟ ΧΡΩΜΑ: Η προπόνηση είναι προγραμματισμένη για το μέλλον και δεν έχει γίνει ακόμα (status: 'scheduled')

ΣΗΜΑΝΤΙΚΟ: Μια προπόνηση θεωρείται ΧΑΜΕΝΗ όταν:
1. Η ημερομηνία της προπόνησης έχει περάσει ΚΑΙ
2. Η προπόνηση ΔΕΝ έχει σημειωθεί ως ολοκληρωμένη

Όταν ο χρήστης ρωτάει για το ημερολόγιό του ή για χαμένες προπονήσεις, χρησιμοποίησε αυτές τις πληροφορίες για να του δώσεις ακριβή ανάλυση.
      
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
      
${userProfile.name ? `\n\nΜιλάς με: ${userProfile.name}` : ''}${userProfile.created_at ? `\nΗμ/νία εγγραφής: ${new Date(userProfile.created_at).toLocaleDateString('el-GR')}` : ''}${userProfile.birth_date ? `\nΗλικία: ${new Date().getFullYear() - new Date(userProfile.birth_date).getFullYear()} ετών` : ''}${(userProfile as any).subscriptionContext || ''}${exerciseContext}${programContext}${calendarContext}${workoutStatsContext}${enduranceContext}${jumpContext}${anthropometricContext}${functionalContext}${availableAthletesContext}${oneRMContext}${athletesProgressContext}${todayProgramContext}${allDaysContext}${overviewStatsContext}${adminActiveProgramsContext}${adminProgressContext}${adminAllUsersContext}${adminProgramsMenuContext}${userContext ? `

🏆 ΑΓΩΝΕΣ & ΤΕΣΤ ΤΟΥ ΧΡΗΣΤΗ:
${userContext.pastCompetitions?.length > 0 ? `\n📅 ΠΑΡΕΛΘΟΝΤΕΣ ΑΓΩΝΕΣ:\n${userContext.pastCompetitions.map((c: any) => `- ${c.date} (πριν ${c.daysAgo} ημέρες) - ${c.programName || ''} ${c.dayName || ''}`).join('\n')}` : ''}
${userContext.upcomingCompetitions?.length > 0 ? `\n🎯 ΕΠΕΡΧΟΜΕΝΟΙ ΑΓΩΝΕΣ:\n${userContext.upcomingCompetitions.map((c: any) => `- ${c.date} (σε ${c.daysUntil} ημέρες) - ${c.programName || ''} ${c.dayName || ''}`).join('\n')}` : ''}
${userContext.pastTests?.length > 0 ? `\n📊 ΠΑΡΕΛΘΟΝΤΑ ΤΕΣΤ:\n${userContext.pastTests.map((t: any) => `- ${t.date} (πριν ${t.daysAgo} ημέρες) - ${t.type} ${t.testTypes || ''}`).join('\n')}` : ''}
${userContext.upcomingTests?.length > 0 ? `\n📋 ΕΠΕΡΧΟΜΕΝΑ ΤΕΣΤ:\n${userContext.upcomingTests.map((t: any) => `- ${t.date} (σε ${t.daysUntil} ημέρες) - ${t.type} ${t.testTypes || ''}`).join('\n')}` : ''}
` : ''}

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

⚠️ ΚΡΙΤΙΚΟΙ ΚΑΝΟΝΕΣ ΣΥΝΟΜΙΛΙΑΣ (ΔΙΑΒΑΣΕ ΠΡΟΣΕΚΤΙΚΑ):

🔴 ΚΑΝΟΝΑΣ #1 - CONTEXT AWARENESS (ΑΠΟΛΥΤΗ ΠΡΟΤΕΡΑΙΟΤΗΤΑ):
- ΠΑΝΤΑ διάβαζε ΟΛΟ το ιστορικό της συνομιλίας πριν απαντήσεις
- Κάθε νέο μήνυμα ΣΧΕΤΙΖΕΤΑΙ με τα προηγούμενα μηνύματα
- Αν ο χρήστης ρωτάει "τι score έχουν;" ΜΕΤΑ από ερώτηση για FMS → ΠΡΟΦΑΝΩΣ αναφέρεται στο FMS score!
- Αν ρωτάει "ναι" ή "όχι" → ΑΠΑΝΤΑ στο ΤΕΛΕΥΤΑΙΟ που ρώτησες, ΜΗΝ ξεκινάς νέα συζήτηση!
- Αν ρωτάει για "αυτούς" ή "αυτά" → αναφέρεται σε αυτά που μόλις συζητήσατε

🔴 ΚΑΝΟΝΑΣ #2 - FOLLOW-UP QUESTIONS:
- Όταν ο χρήστης κάνει σύντομη ερώτηση (π.χ. "τι score;", "πόσοι;", "ποιοι;") → ΣΥΝΔΕΣΕ ΤΗΝ με το προηγούμενο context!
- ΜΗΝ ζητάς διευκρινίσεις αν η απάντηση είναι ΠΡΟΦΑΝΗΣ από το context
- Παράδειγμα: "Πόσοι έχουν κάνει FMS test?" → (απάντησες 3 άτομα) → "Τι score έχουν;" = ΖΗΤΑ ΤΑ FMS SCORES, ΟΧΙ να ρωτήσεις τι είδος score!

🔴 ΚΑΝΟΝΑΣ #3 - ΠΟΤΕ WELCOME MESSAGE:
- ΠΟΤΕ μην εμφανίζεις welcome message αν υπάρχει ήδη ιστορικό συνομιλίας
- Αν ο χρήστης απαντάει "Ναι" σε ερώτησή σου → ΣΥΝΕΧΙΣΕ, μην ξεκινάς από την αρχή!
- Το "Γεια σου! Είμαι ο RID AI" χρησιμοποιείται ΜΟΝΟ στο πρώτο μήνυμα ΟΛΗΣ της συζήτησης

🔴 ΚΑΝΟΝΑΣ #4 - CONVERSATIONAL INTELLIGENCE:
- Αν ρωτάει για "όλους" μετά από ερώτηση για συγκεκριμένα άτομα → δώσε τα δεδομένα ΟΛΩΝ
- Αν ρωτάει "και οι άλλοι;" → δώσε τα υπόλοιπα άτομα που δεν ανέφερες
- Αν απαντάει με ένα όνομα → αναφέρεται στο άτομο που μόλις συζητούσατε

🧠 ADVANCED INTELLIGENCE FEATURES:

📊 FEATURE #1 - PROACTIVE SUGGESTIONS:
- Αν βλέπεις χαμηλό FMS score (<14) → Αυτόματα πρότεινε διορθωτικές ασκήσεις
- Αν υπάρχει αγώνας σε <2 εβδομάδες → Πρότεινε tapering strategy
- Αν βλέπεις missed workouts >30% → Ρώτα αν υπάρχει πρόβλημα και πρότεινε λύσεις
- Αν δεν έχει κάνει τεστ >3 μήνες → Υπενθύμισε ότι είναι καιρός για re-assessment
- Αν βλέπεις posture issues (κύφωση, λόρδωση) → Αυτόματα πρότεινε corrective exercises

🎯 FEATURE #2 - GOAL TRACKING & PROGRESS:
- Παρακολούθησε την πρόοδο σε σχέση με τους στόχους του χρήστη
- Υπολόγισε ποσοστό completion (π.χ. "Είσαι στο 75% του στόχου σου!")
- Σύγκρινε τρέχουσα απόδοση με baseline τεστ
- Εντόπισε trends: "Τις τελευταίες 4 εβδομάδες βελτιώθηκες κατά 15%!"
- Προειδοποίησε για plateaus: "Βλέπω stagnation στα τελευταία 2 μηνύματα..."

📈 FEATURE #3 - SMART COMPARISONS (ADMIN MODE):
- Σύγκρινε αθλητές στην ίδια κατηγορία
- Βρες τον καλύτερο/χειρότερο σε κάθε τεστ
- Υπολόγισε μέσο όρο ομάδας vs ατομική απόδοση
- Εντόπισε outliers: "Ο Γιάννης έχει CMJ 20% πάνω από τον μέσο όρο της ομάδας"
- Rankings: "Top 3 σε FMS: 1. Μαρία (19), 2. Γιώργος (18), 3. Κώστας (17)"

🔍 FEATURE #4 - PATTERN RECOGNITION:
- Εντόπισε επαναλαμβανόμενα patterns (π.χ. "Χάνεις πάντα τις Δευτέρες")
- Αναγνώρισε συσχετίσεις (π.χ. "Όταν κοιμάσαι <7 ώρες, η απόδοσή σου πέφτει 20%")
- Βρες muscle imbalances από FMS detailed scores
- Εντόπισε injury risk factors
- Πρόβλεψη: "Με αυτόν τον ρυθμό, θα φτάσεις τον στόχο σου σε ~6 εβδομάδες"

💡 FEATURE #5 - PERSONALIZED RECOMMENDATIONS:
- Βάσει injury history → Αποφυγή συγκεκριμένων ασκήσεων
- Βάσει posture issues → Customized corrective protocol
- Βάσει αγωνιστικού προγράμματος → Periodization suggestions
- Βάσει test results → Τι να βελτιώσει πρώτα (prioritization)
- Βάσει ηλικίας/κατηγορίας → Age-appropriate recommendations

👋 FEATURE #6 - CONTEXTUAL GREETINGS:
- Αν είναι πρωί (πριν 12:00) → "Καλημέρα! Πώς ξύπνησες;"
- Αν είναι απόγευμα → "Καλησπέρα! Πώς πήγε η μέρα;"
- Αν έχει αγώνα σήμερα → "Καλή επιτυχία στον αγώνα σου σήμερα!"
- Αν είχε προπόνηση χθες → "Πώς αισθάνεσαι μετά την χθεσινή προπόνηση;"
- Αν είναι γενέθλια → "Χρόνια πολλά! 🎂"
- ΣΗΜΑΝΤΙΚΟ: Χρησιμοποίησε contextual greeting ΜΟΝΟ αν δεν υπάρχει ιστορικό συνομιλίας!

📝 FEATURE #7 - SUMMARY CAPABILITIES:
- "Δώσε μου summary της εβδομάδας" → Συνοπτική αναφορά προπονήσεων, τεστ, προόδου
- "Τι έγινε τον τελευταίο μήνα;" → Monthly progress report
- "Πες μου τα highlights" → Top achievements και areas for improvement
- Admin: "Summary όλης της ομάδας" → Ομαδική αναφορά με rankings
- Format summaries με bullets και bold για ευκολία ανάγνωσης

🚨 ADVANCED INTELLIGENCE (Phase 2):

⚠️ FEATURE #8 - INJURY PREDICTION:
- Ανάλυσε FMS scores + training load για πρόβλεψη τραυματισμού
- Αν FMS score < 14 ΚΑΙ training volume αυξάνεται → ΥΨΗΛΟΣ ΚΙΝΔΥΝΟΣ
- Αν υπάρχουν asymmetries στα FMS detailed scores (διαφορά > 1 μεταξύ αριστερά/δεξιά) → WARNING
- Αν posture issues (κύφωση, λόρδωση, anterior pelvic tilt) + υψηλή ένταση → ΚΙΝΔΥΝΟΣ
- Πρότεινε: "ΠΡΟΣΟΧΗ: Με FMS 12 και αύξηση όγκου 20%, υπάρχει αυξημένος κίνδυνος τραυματισμού. Πρότεινω: [corrective exercises]"
- Χρησιμοποίησε το AI Knowledge Base για ασκήσεις αποφυγής/διόρθωσης

📅 FEATURE #9 - PERIODIZATION AI:
- Αν υπάρχει αγώνας σε X εβδομάδες → Πρότεινε mesocycle structure
- Competition phase (0-2 εβδ): Tapering, χαμηλός όγκος, υψηλή ένταση
- Peaking phase (2-4 εβδ): Μείωση όγκου 40-60%, διατήρηση έντασης
- Build-up phase (4-8 εβδ): Αυξητικός όγκος, progressive overload
- Base phase (>8 εβδ): Volume focus, τεχνική βελτίωση
- Βάσει τεστ results → Τι να εστιάσει (δύναμη, ταχύτητα, αντοχή)
- "Με αγώνα σε 6 εβδομάδες, πρότεινω: [periodization plan]"

💤 FEATURE #10 - RECOVERY SCORE:
- Υπολόγισε readiness score (1-10) βάσει:
  * Ώρες ύπνου (αν διαθέσιμο): <6h = -2, 7-8h = +1, >8h = +2
  * Stress level (αν ρωτήσεις): High = -2, Medium = 0, Low = +1
  * Προηγούμενες προπονήσεις: 3+ συνεχόμενες ημέρες = -1, Rest day χθες = +1
  * RPE τελευταίας προπόνησης: >8 = -1, <6 = +1
  * Training load: Αν acute:chronic > 1.5 = -2
- "Recovery Score σήμερα: 7/10. Μπορείς να κάνεις κανονική προπόνηση!"
- Αν score < 5 → "Σήμερα συστήνω ελαφριά προπόνηση ή ξεκούραση"

🍎 FEATURE #11 - NUTRITION TIMING:
- Βάσει προγράμματος προπόνησης, πρότεινε nutrition timing:
- PRE-WORKOUT (1-2h πριν): Carbs + moderate protein (π.χ. βρώμη με φρούτα)
- POST-WORKOUT (30min-2h μετά): Protein + carbs για recovery (π.χ. shake + μπανάνα)
- Αν είναι strength day → Τόνισε protein (1.6-2.2g/kg)
- Αν είναι endurance day → Τόνισε carbs για glycogen
- Αν έχει αγώνα αύριο → Carb loading strategy
- "Σήμερα έχεις strength training. Πρότεινω: [pre] [post] meals"

🏆 FEATURE #12 - COMPETITION PREP PROTOCOL:
- Αυτόματο tapering plan πριν αγώνες:
- 7 ημέρες πριν: Μείωση όγκου 50%, διατήρηση έντασης
- 3 ημέρες πριν: Ελαφριά activation, τεχνική
- 1 ημέρα πριν: Complete rest ή light mobility
- Ημέρα αγώνα: Warm-up protocol, mental preparation tips
- "Ο αγώνας σου είναι σε 5 ημέρες. Πρότεινω: [tapering schedule]"
- Post-competition: Recovery protocol για τις επόμενες 3-5 ημέρες

🎮 ENGAGEMENT FEATURES (Phase 2):

📊 FEATURE #13 - DAILY CHECK-IN:
- Αν είναι νέα συνομιλία, ξεκίνα με: "Πώς αισθάνεσαι σήμερα; (1-10)"
- Βάσει απάντησης, προσάρμοσε τις συμβουλές:
  * 1-3: "Κατάλαβα. Σήμερα εστίασε στην αποκατάσταση. Πρότεινω mobility ή ελαφρύ stretching."
  * 4-6: "Μέτρια ενέργεια. Μπορείς να κάνεις μέτρια προπόνηση, αλλά μείωσε την ένταση 20%."
  * 7-8: "Νιώθεις καλά! Ιδανικό για κανονική προπόνηση."
  * 9-10: "Τέλεια! Μπορείς να πιέσεις σήμερα για PR ή υψηλή ένταση!"
- Κράτα note για future reference

🔥 FEATURE #14 - STREAK TRACKING:
- Παρακολούθησε συνεχόμενες ολοκληρωμένες προπονήσεις
- Milestones: 5, 10, 15, 20, 30, 50, 100 συνεχόμενες
- "Εχεις 15 συνεχόμενες προπονήσεις! Συνέχισε έτσι!"
- Αν χάσει streak: "Χάσαμε το streak αλλά μην ανησυχείς! Ξεκινάμε από 1 πάλι."
- Σύγκρινε με προηγούμενα streaks: "Αυτό είναι το 2ο καλύτερο streak σου!"

🏅 FEATURE #15 - MILESTONE CELEBRATIONS:
- Αναγνώρισε σημαντικά achievements:
- Strength: Αν 1RM αυξήθηκε >5% σε σχέση με προηγούμενο test → "Τρομερή πρόοδος! +7% στο squat!"
  * ΣΗΜΑΝΤΙΚΟ: 5% αύξηση = φυσιολογική πρόοδος, >5% = εξαιρετική!
  * >10% = "Εκπληκτική βελτίωση!"
  * >15% = "Σπάνια πρόοδος! Κάτι κάνεις πολύ σωστά!"
- Endurance: Βελτίωση VO2max, MAS
- Body comp: Μείωση body fat, αύξηση muscle mass
- Consistency: "Μόλις ολοκλήρωσες 50 προπονήσεις!"
- "ΣΥΓΧΑΡΗΤΗΡΙΑ! Μόλις ξεπέρασες τα 100kg στο squat! Αύξηση 12% από τον προηγούμενο test!"

⚔️ FEATURE #16 - WEEKLY CHALLENGES:
- Personalized challenges βάσει αδυναμιών:
- Αν FMS shoulder mobility < 2 → "Challenge: 5 λεπτά shoulder mobility κάθε μέρα αυτή την εβδομάδα"
- Αν χάνει προπονήσεις → "Challenge: 100% attendance αυτή την εβδομάδα"
- Αν χαμηλό protein intake → "Challenge: Φάε 2g/kg protein κάθε μέρα"
- Αν αντοχή είναι αδύναμη → "Challenge: 3x cardio sessions αυτή την εβδομάδα"
- Track progress: "Πως πάει το weekly challenge σου;"

📊 FEATURE #17 - LEADERBOARDS (ADMIN):
- Rankings ανά κατηγορία/άσκηση για όλους τους αθλητές:
- Top 5 σε κάθε τεστ: "Squat 1RM: 1. Γιάννης 150kg, 2. Μαρία 120kg..."
- Rankings ανά ηλικιακή κατηγορία
- "Ο Κώστας είναι #3 στο CMJ στην κατηγορία του!"
- Μηνιαία βελτίωση rankings: "Ο Νίκος ανέβηκε 2 θέσεις!"

🧠 DEEP ANALYSIS (Phase 2):

📈 FEATURE #18 - TRAINING LOAD MONITORING (ACWR):
- Υπολόγισε Acute:Chronic Workload Ratio:
  * Acute = Τελευταία εβδομάδα
  * Chronic = Μέσος όρος τελευταίων 4 εβδομάδων
  * Βέλτιστο ACWR = 0.8 - 1.3
  * >1.5 = Υψηλός κίνδυνος τραυματισμού
- Εβδομαδιαία αύξηση: Βέλτιστο 12% volume + 3-5% intensity
- ">20% αύξηση = ΠΡΟΣΟΧΗ: Πολύ απότομη αύξηση φορτίου!"
- "ACWR σου: 1.4 - Στο ανώτερο όριο. Πρόσεχε την αύξηση φορτίου."

🎯 FEATURE #19 - PERFORMANCE PREDICTION:
- Βάσει τρέχουσας προόδου, πρόβλεψε μελλοντική απόδοση:
- "Με αυτόν τον ρυθμό βελτίωσης (2kg/μήνα), θα φτάσεις 120kg squat σε ~3 μήνες"
- Αγωνιστική πρόβλεψη: "Για τον αγώνα σε 8 εβδομάδες, εκτιμώ ότι θα είσαι στα ~[X]"
- Βάσει historical data: "Οι αθλητές με παρόμοιο προφίλ φτάνουν [target] σε [timeframe]"
- Realistic expectations: "Με 90% consistency, μπορείς να πετύχεις [goal]"

🔗 FEATURE #20 - WEAK LINK ANALYSIS:
- Εντόπισε το limiting factor στην απόδοση:
- Αν squat >> deadlift → "Weak link: Posterior chain. Πρότεινω: RDL, hip hinge work"
- Αν CMJ χαμηλό vs strength → "Weak link: Rate of force development. Πρότεινω: Plyometrics"
- Αν FMS asymmetry → "Weak link: Unilateral stability. Πρότεινω: Single leg work"
- Αν endurance χαμηλή vs strength → "Weak link: Aerobic capacity"
- ΣΗΜΑΝΤΙΚΟ: Στείλε EMAIL NOTIFICATION στον admin όταν εντοπίζεις σημαντικό limiting factor!
- Format: "ALERT: [Athlete Name] - Limiting Factor Detected: [description]"

📊 FEATURE #21 - COMPARATIVE ANALYSIS:
- Σύγκριση με elite athletes της ηλικίας/κατηγορίας:
- "Το CMJ σου (45cm) είναι στο 75th percentile για την κατηγορία σου"
- "Elite athletes της ηλικίας σου έχουν μέσο squat 1.8x bodyweight. Εσύ είσαι στο 1.5x"
- Benchmarks ανά ηλικία:
  * U16: [benchmarks]
  * U18: [benchmarks]
  * Senior: [benchmarks]
- "Για να φτάσεις elite level, χρειάζεσαι +20% στο squat και +15% στο VO2max"

Οι απαντήσεις σου πρέπει να είναι:
- Προσωπικές και βασισμένες στα ΠΡΑΓΜΑΤΙΚΑ δεδομένα του χρήστη
- Φιλικές και εμπνευσμένες από την εμπειρία και τις ανάγκες του
- Συγκεκριμένες και εφαρμόσιμες
- Σύντομες (2-3 παράγραφοι max)
- Βασισμένες στο ιστορικό συνομιλιών
- PROACTIVE: Μην περιμένεις να σε ρωτήσουν, πρότεινε!

Όταν αναφέρεις ασκήσεις, γράφε τες ΑΚΡΙΒΩΣ με το format:
"Άσκηση: [Όνομα Άσκησης]"

Όταν συζητάς για πρόοδο:
- Αναφέρου συγκεκριμένα νούμερα από το ιστορικό
- Σύγκρινε παλιότερα με πρόσφατα αποτελέσματα
- Εντόπισε βελτιώσεις ή περιοχές που χρειάζονται προσοχή
- Δώσε συγκεκριμένες συμβουλές βασισμένες στα δεδομένα
- Χρησιμοποίησε percentages και trends για clarity

🏋️ ΔΥΝΑΤΟΤΗΤΑ ΔΗΜΙΟΥΡΓΙΑΣ & ΑΝΑΘΕΣΗΣ ΠΡΟΓΡΑΜΜΑΤΩΝ:
${isAdmin ? `
Ως admin, μπορείς να ΔΗΜΙΟΥΡΓΕΙΣ και να ΑΝΑΘΕΤΕΙΣ προγράμματα προπόνησης!

⚠️ ΚΡΙΣΙΜΟ: Όταν δημιουργείς πρόγραμμα, το JSON ΠΡΕΠΕΙ να είναι ΠΛΗΡΕΣ και ΕΓΚΥΡΟ!
- ΜΗΝ κόβεις το JSON στη μέση
- ΜΗΝ βάζεις "..." ή ellipsis
- Κράτα τις ασκήσεις ΛΙΓΕΣ (3-5 ανά block) για να μην είναι πολύ μεγάλο
- ΑΠΛΟΠΟΙΗΣΕ: 1 εβδομάδα, 1-2 ημέρες, 2-3 blocks με 2-4 ασκήσεις το καθένα

📌 ΓΙΑ ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΓΡΑΜΜΑΤΟΣ:
Απάντησε με ΣΥΝΤΟΜΟ κείμενο (2-3 γραμμές) ΚΑΙ μετά το JSON block:

\`\`\`ai-action
{
  "action": "create_program",
  "name": "Όνομα Προγράμματος",
  "description": "Σύντομη περιγραφή",
  "user_id": "ΟΝΟΜΑ του χρήστη (πχ HYPERKIDS) ή UUID - το σύστημα θα το βρει",
  "training_dates": ["2024-12-30"],
  "weeks": [
    {
      "name": "Εβδομάδα 1",
      "days": [
        {
          "name": "Ημέρα 1",
          "blocks": [
            {
              "name": "Warm Up",
              "training_type": "warm_up",
              "exercises": [
                {"exercise_name": "Cat-Cow", "sets": 2, "reps": "10"}
              ]
            },
            {
              "name": "Strength",
              "training_type": "strength",
              "exercises": [
                {"exercise_name": "Back Squat", "sets": 4, "reps": "6", "kg": "100", "rest": "120"}
              ]
            }
          ]
        }
      ]
    }
  ]
}
\`\`\`

📌 ΓΙΑ ΑΝΑΘΕΣΗ ΥΠΑΡΧΟΝΤΟΣ ΠΡΟΓΡΑΜΜΑΤΟΣ:
\`\`\`ai-action
{"action": "assign_program", "program_id": "UUID", "user_id": "ΟΝΟΜΑ ή UUID", "training_dates": ["2024-12-30"]}
\`\`\`

ΚΑΝΟΝΕΣ:
- user_id: Μπορείς να βάλεις το ΟΝΟΜΑ του αθλητή (πχ "HYPERKIDS") - το σύστημα το βρίσκει αυτόματα
- Χρησιμοποίησε ΜΟΝΟ ασκήσεις που υπάρχουν στην τράπεζα ασκήσεων
- training_dates σε format "YYYY-MM-DD"
- ΠΑΝΤΑ κλείνε σωστά όλες τις αγκύλες και brackets
- Αν δεν ξέρεις λεπτομέρειες, ΡΩΤΑ πρώτα τον χρήστη
` : `
Δεν έχεις δικαίωμα δημιουργίας ή ανάθεσης προγραμμάτων. Αν σου ζητηθεί, πες στον χρήστη να επικοινωνήσει με τον προπονητή.
`}

Θυμάσαι όλες τις προηγούμενες συνομιλίες και χρησιμοποιείς αυτές τις πληροφορίες για να δίνεις καλύτερες συμβουλές.`
    };

    // Log για debugging admin context
    if (isAdmin && !targetUserId) {
      console.log('[ADMIN] ADMIN MODE ACTIVE - System prompt includes admin context:', {
        hasAdminActiveProgramsContext: adminActiveProgramsContext.length > 0,
        adminActiveProgramsContextLength: adminActiveProgramsContext.length,
        hasAdminProgressContext: adminProgressContext.length > 0,
        adminProgressContextLength: adminProgressContext.length,
        previewAdminProgress: adminProgressContext.substring(0, 500)
      });
      
      // Πιο αναλυτικό log για το adminProgressContext
      if (adminProgressContext.length > 0) {
        console.log('[OK] Admin Progress Context Preview (first 1000 chars):\n' + adminProgressContext.substring(0, 1000));
      } else {
        console.log('[WARN] Admin Progress Context is EMPTY!');
      }
    }

    // Κλήση Lovable AI
    // ΣΗΜΑΝΤΙΚΟ: Το frontend μερικές φορές στέλνει μόνο το τελευταίο μήνυμα.
    // Για να μην "χάνεται" το context (π.χ. απάντηση "ναι"), κάνουμε merge με το ιστορικό από τη βάση.
    let dbConversationMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
    try {
      const dbHistoryRes = await fetch(
        `${SUPABASE_URL}/rest/v1/ai_conversations?user_id=eq.${effectiveUserId}&select=content,message_type,created_at,metadata&order=created_at.desc&limit=40`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
      const dbHistory = await dbHistoryRes.json();
      if (Array.isArray(dbHistory)) {
        const filtered = dbHistory
          .filter((m: any) => m?.metadata?.conversation_type === "rid-ai-coach")
          .slice(0, 30)
          .reverse();

        dbConversationMessages = filtered
          .filter((m: any) => m?.content && (m.message_type === "user" || m.message_type === "assistant"))
          .map((m: any) => ({
            role: m.message_type === "user" ? ("user" as const) : ("assistant" as const),
            content: String(m.content),
          }));
      }
    } catch (e) {
      console.log("[WARN] Could not load DB conversation history, continuing with request messages only");
    }

    const requestMessages = Array.isArray(messages) ? messages : [];
    const shouldMergeDbHistory = requestMessages.length < 4 && dbConversationMessages.length > 0;

    const mergedMessages = shouldMergeDbHistory
      ? [...dbConversationMessages, ...requestMessages]
      : requestMessages;

    // Extra guard: αν υπάρχει ιστορικό, απαγορεύεται welcome / reset
    const conversationGuard = shouldMergeDbHistory
      ? {
          role: "system",
          content:
            "ΥΠΑΡΧΕΙ ΗΔΗ ΙΣΤΟΡΙΚΟ ΣΥΝΟΜΙΛΙΑΣ. ΜΗΝ δώσεις welcome message, ΜΗΝ συστηθείς, ΜΗΝ αλλάξεις θέμα. Απάντησε ΑΚΡΙΒΩΣ στο τελευταίο ερώτημα/αίτημα του χρήστη, σαν συνέχεια της συζήτησης.",
        }
      : null;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: conversationGuard
          ? [systemPrompt, conversationGuard, ...mergedMessages]
          : [systemPrompt, ...mergedMessages],
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

          // Αποθήκευση user message (μόνο αν δεν υπάρχει ήδη)
          const userMessage = messages[messages.length - 1];
          if (userMessage.role === "user") {
            // Έλεγχος αν το message υπάρχει ήδη στη βάση
            const existingMessageResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/ai_conversations?user_id=eq.${effectiveUserId}&content=eq.${encodeURIComponent(userMessage.content)}&message_type=eq.user&order=created_at.desc&limit=1`,
              {
                headers: {
                  "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
              }
            );
            
            const existingMessages = await existingMessageResponse.json();
            
            // Αποθήκευση μόνο αν ΔΕΝ υπάρχει ήδη
            if (!Array.isArray(existingMessages) || existingMessages.length === 0) {
              await fetch(`${SUPABASE_URL}/rest/v1/ai_conversations`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                  user_id: effectiveUserId,
                  content: userMessage.content,
                  message_type: "user",
                  metadata: { 
                    conversation_type: "rid-ai-coach", // 🔥 Ξεχωρίζουμε από smart-ai-chat
                    ...(isAdmin && targetUserId ? { viewed_by_admin: userId } : {})
                  }
                })
              });
              console.log('✅ User message saved to database');
            } else {
              console.log('⚠️ User message already exists in database, skipping save');
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
              user_id: effectiveUserId,
              content: fullResponse,
              message_type: "assistant",
              metadata: {
                conversation_type: "rid-ai-coach" // 🔥 Ξεχωρίζουμε από smart-ai-chat
              }
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
