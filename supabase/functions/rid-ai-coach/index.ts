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
    const isCoach = callerUserData[0]?.role === 'coach';
    const isFederation = callerUserData[0]?.role === 'federation';
    const isAdminOrCoach = isAdmin || isCoach || isFederation;

    // 🏋️ ΦΟΡΤΩΣΗ COACH DATA (Αθλητές και Συνδρομές Coach)
    let coachAthletesContext = '';
    let coachSubscriptionsContext = '';
    
    if (isAdminOrCoach) {
      console.log(`🏋️ Loading coach data for ${isAdmin ? 'admin' : 'coach'} mode...`);
      
      // Φόρτωση αθλητών του coach (coach_users)
      const coachUsersResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/coach_users?coach_id=eq.${userId}&select=*&order=created_at.desc`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const coachUsersData = await coachUsersResponse.json();
      
      if (Array.isArray(coachUsersData) && coachUsersData.length > 0) {
        console.log(`✅ Loaded ${coachUsersData.length} coach athletes`);
        
        // Φόρτωση συνδρομών για αυτούς τους αθλητές
        const coachUserIds = coachUsersData.map((u: any) => u.id);
        const coachSubsResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/coach_subscriptions?coach_user_id=in.(${coachUserIds.join(',')})&select=*,subscription_types(name,price,duration_months)&order=end_date.desc`,
          {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }
        );
        const coachSubsData = await coachSubsResponse.json();
        
        // Map subscriptions by coach_user_id
        const subsMap: Record<string, any[]> = {};
        if (Array.isArray(coachSubsData)) {
          coachSubsData.forEach((sub: any) => {
            if (!subsMap[sub.coach_user_id]) subsMap[sub.coach_user_id] = [];
            subsMap[sub.coach_user_id].push(sub);
          });
        }
        
        // Υπολογισμός κατάστασης συνδρομής για κάθε αθλητή
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const getSubscriptionStatus = (subs: any[]) => {
          if (!subs || subs.length === 0) return { status: 'inactive', label: 'Ανενεργός' };
          
          const activeSub = subs.find(sub => {
            const endDate = new Date(sub.end_date);
            endDate.setHours(23, 59, 59, 999);
            return endDate >= today && sub.status === 'active';
          });
          
          if (!activeSub) return { status: 'inactive', label: 'Ανενεργός' };
          if (activeSub.is_paid === false) return { status: 'unpaid', label: 'Απλήρωτη' };
          if (activeSub.is_paused) return { status: 'paused', label: 'Σε παύση' };
          return { status: 'active', label: 'Ενεργός' };
        };
        
        // Build athletes context
        const activeAthletes = coachUsersData.filter((u: any) => {
          const subs = subsMap[u.id] || [];
          const status = getSubscriptionStatus(subs);
          return status.status === 'active';
        });
        const inactiveAthletes = coachUsersData.filter((u: any) => {
          const subs = subsMap[u.id] || [];
          const status = getSubscriptionStatus(subs);
          return status.status === 'inactive';
        });
        const unpaidAthletes = coachUsersData.filter((u: any) => {
          const subs = subsMap[u.id] || [];
          const status = getSubscriptionStatus(subs);
          return status.status === 'unpaid';
        });
        const pausedAthletes = coachUsersData.filter((u: any) => {
          const subs = subsMap[u.id] || [];
          const status = getSubscriptionStatus(subs);
          return status.status === 'paused';
        });
        
        coachAthletesContext = `\n\n🏋️ ΑΘΛΗΤΕΣ COACH (coach_users):
📌 ΤΙ ΕΙΝΑΙ:
- Οι "coach_users" είναι οι αθλητές που έχουν εγγραφεί/δημιουργηθεί από τον coach.
- Αυτοί είναι οι πελάτες του coach που διαχειρίζεται ο ίδιος.
- Κάθε coach μπορεί να δημιουργεί τους δικούς του αθλητές στη σελίδα "Οι Αθλητές μου".
- Οι αθλητές αυτοί μπορούν να έχουν συνδρομές (coach_subscriptions) που διαχειρίζεται ο coach.

📊 ΣΤΑΤΙΣΤΙΚΑ:
- Συνολικοί αθλητές του coach: ${coachUsersData.length}
- Ενεργοί (με ενεργή συνδρομή): ${activeAthletes.length}
- Ανενεργοί (χωρίς συνδρομή ή ληγμένη): ${inactiveAthletes.length}
- Απλήρωτες συνδρομές: ${unpaidAthletes.length}
- Σε παύση: ${pausedAthletes.length}

📋 ΛΙΣΤΑ ΑΘΛΗΤΩΝ:
`;
        
        coachUsersData.forEach((athlete: any) => {
          const subs = subsMap[athlete.id] || [];
          const status = getSubscriptionStatus(subs);
          const activeSub = subs.find((s: any) => {
            const endDate = new Date(s.end_date);
            endDate.setHours(23, 59, 59, 999);
            return endDate >= today && s.status === 'active';
          });
          
          let subInfo = '';
          if (activeSub) {
            const endDate = new Date(activeSub.end_date);
            const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            const typeName = activeSub.subscription_types?.name || 'Unknown';
            subInfo = ` | ${typeName} λήγει ${activeSub.end_date} (${daysUntil > 0 ? `σε ${daysUntil} ημέρες` : 'ΛΗΓΜΕΝΗ'})`;
          }
          
          coachAthletesContext += `  • ${athlete.name} (${athlete.email}) - ${status.label}${subInfo}\n`;
        });
        
        // Subscriptions overview
        if (Array.isArray(coachSubsData) && coachSubsData.length > 0) {
          const activeSubsCount = coachSubsData.filter((s: any) => {
            const endDate = new Date(s.end_date);
            endDate.setHours(23, 59, 59, 999);
            return endDate >= today && s.status === 'active';
          }).length;
          const unpaidSubsCount = coachSubsData.filter((s: any) => s.is_paid === false).length;
          const pausedSubsCount = coachSubsData.filter((s: any) => s.is_paused === true).length;
          
          coachSubscriptionsContext = `\n\n💳 ΣΥΝΔΡΟΜΕΣ COACH (coach_subscriptions):
📊 ΣΤΑΤΙΣΤΙΚΑ:
- Συνολικές συνδρομές: ${coachSubsData.length}
- Ενεργές: ${activeSubsCount}
- Απλήρωτες: ${unpaidSubsCount}
- Σε παύση: ${pausedSubsCount}

📋 ΛΙΣΤΑ ΣΥΝΔΡΟΜΩΝ (πρόσφατες):
`;
          
          coachSubsData.slice(0, 20).forEach((sub: any) => {
            const athlete = coachUsersData.find((u: any) => u.id === sub.coach_user_id);
            const athleteName = athlete?.name || 'Unknown';
            const typeName = sub.subscription_types?.name || 'Unknown';
            const endDate = new Date(sub.end_date);
            const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            
            let statusEmoji = '✅';
            if (sub.is_paid === false) statusEmoji = '💰';
            else if (sub.is_paused) statusEmoji = '⏸️';
            else if (daysUntil < 0) statusEmoji = '❌';
            else if (daysUntil <= 7) statusEmoji = '⚠️';
            
            coachSubscriptionsContext += `  ${statusEmoji} ${athleteName}: ${typeName} | ${sub.start_date} - ${sub.end_date} (${daysUntil > 0 ? `σε ${daysUntil} ημέρες` : `ΛΗΓΜΕΝΗ πριν ${Math.abs(daysUntil)} ημέρες`})${sub.is_paid === false ? ' [ΑΠΛΗΡΩΤΗ]' : ''}${sub.is_paused ? ' [ΠΑΥΣΗ]' : ''}\n`;
          });
        }
      } else {
        coachAthletesContext = `\n\n🏋️ ΑΘΛΗΤΕΣ COACH (coach_users):
📌 ΤΙ ΕΙΝΑΙ:
- Οι "coach_users" είναι οι αθλητές που έχουν εγγραφεί/δημιουργηθεί από τον coach.
- Αυτοί είναι οι πελάτες του coach που διαχειρίζεται ο ίδιος.
- Κάθε coach μπορεί να δημιουργεί τους δικούς του αθλητές στη σελίδα "Οι Αθλητές μου".
- Οι αθλητές αυτοί μπορούν να έχουν συνδρομές (coach_subscriptions) που διαχειρίζεται ο coach.

⚠️ ΚΑΤΑΣΤΑΣΗ: Δεν έχουν δημιουργηθεί ακόμα αθλητές από αυτόν τον coach.
💡 ΣΥΜΒΟΥΛΗ: Για να προσθέσεις αθλητές, πήγαινε στη σελίδα "Οι Αθλητές μου" (/dashboard/my-athletes).\n`;
      }
    }

    // 🏋️ COACH PROGRESS: Φόρτωση test data για τους αθλητές του coach (app_users)
    let coachProgressContext = '';
    if (isCoach && !targetUserId) {
      console.log('📊 Coach mode: Loading progress data for coach athletes...');
      
      // Φόρτωση αθλητών του coach (app_users with coach_id)
      const coachAthletesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/app_users?coach_id=eq.${userId}&select=id,name,email&order=name.asc`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const coachAthletes = await coachAthletesResponse.json();
      
      if (Array.isArray(coachAthletes) && coachAthletes.length > 0) {
        const athleteIds = coachAthletes.map((a: any) => a.id);
        coachProgressContext = `\n\n📊 ΠΡΟΟΔΟΣ ΑΘΛΗΤΩΝ COACH:\n`;
        
        for (const athlete of coachAthletes) {
          coachProgressContext += `\n👤 ${athlete.name} (${athlete.email}):\n`;
          
          // Strength tests
          try {
            const strengthRes = await fetch(
              `${SUPABASE_URL}/rest/v1/strength_test_attempts?select=id,weight_kg,velocity_ms,exercise_id,exercises(name),strength_test_sessions!inner(user_id,test_date)&strength_test_sessions.user_id=eq.${athlete.id}&order=strength_test_sessions.test_date.desc&limit=20`,
              { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
            );
            const strengthData = await strengthRes.json();
            if (Array.isArray(strengthData) && strengthData.length > 0) {
              coachProgressContext += '  🏋️ Force/Velocity:\n';
              strengthData.slice(0, 10).forEach((t: any) => {
                const date = t.strength_test_sessions?.[0]?.test_date || '';
                coachProgressContext += `    - ${t.exercises?.name || '?'}: ${t.weight_kg}kg @ ${t.velocity_ms}m/s (${date})\n`;
              });
            }
          } catch(e) { console.log('⚠️ Strength error for', athlete.name); }
          
          // Endurance tests
          try {
            const endRes = await fetch(
              `${SUPABASE_URL}/rest/v1/endurance_test_data?select=*,endurance_test_sessions!inner(user_id,test_date)&endurance_test_sessions.user_id=eq.${athlete.id}&order=created_at.desc&limit=5`,
              { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
            );
            const endData = await endRes.json();
            if (Array.isArray(endData) && endData.length > 0) {
              coachProgressContext += '  🏃 Αντοχή:\n';
              endData.forEach((t: any) => {
                const parts = [];
                if (t.vo2_max) parts.push(`VO2max: ${t.vo2_max}`);
                if (t.mas_kmh) parts.push(`MAS: ${t.mas_kmh} km/h`);
                if (t.push_ups) parts.push(`Push-ups: ${t.push_ups}`);
                if (t.pull_ups) parts.push(`Pull-ups: ${t.pull_ups}`);
                const date = t.endurance_test_sessions?.[0]?.test_date || t.created_at;
                coachProgressContext += `    - ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})\n`;
              });
            }
          } catch(e) { console.log('⚠️ Endurance error for', athlete.name); }
          
          // Jump tests
          try {
            const jumpRes = await fetch(
              `${SUPABASE_URL}/rest/v1/jump_test_data?select=*,jump_test_sessions!inner(user_id,test_date)&jump_test_sessions.user_id=eq.${athlete.id}&order=created_at.desc&limit=5`,
              { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
            );
            const jumpData = await jumpRes.json();
            if (Array.isArray(jumpData) && jumpData.length > 0) {
              coachProgressContext += '  ⬆️ Άλματα:\n';
              jumpData.forEach((t: any) => {
                const parts = [];
                if (t.counter_movement_jump) parts.push(`CMJ: ${t.counter_movement_jump}cm`);
                if (t.non_counter_movement_jump) parts.push(`NCMJ: ${t.non_counter_movement_jump}cm`);
                if (t.broad_jump) parts.push(`Broad: ${t.broad_jump}cm`);
                const date = t.jump_test_sessions?.[0]?.test_date || t.created_at;
                coachProgressContext += `    - ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})\n`;
              });
            }
          } catch(e) { console.log('⚠️ Jump error for', athlete.name); }
          
          // Anthropometric tests
          try {
            const anthRes = await fetch(
              `${SUPABASE_URL}/rest/v1/anthropometric_test_data?select=*,anthropometric_test_sessions!inner(user_id,test_date)&anthropometric_test_sessions.user_id=eq.${athlete.id}&order=created_at.desc&limit=5`,
              { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
            );
            const anthData = await anthRes.json();
            if (Array.isArray(anthData) && anthData.length > 0) {
              coachProgressContext += '  📏 Ανθρωπομετρικά:\n';
              anthData.forEach((t: any) => {
                const parts = [];
                if (t.weight) parts.push(`Βάρος: ${t.weight}kg`);
                if (t.body_fat_percentage) parts.push(`Λίπος: ${t.body_fat_percentage}%`);
                if (t.muscle_mass_percentage) parts.push(`Μυϊκή: ${t.muscle_mass_percentage}%`);
                const date = t.anthropometric_test_sessions?.[0]?.test_date || t.created_at;
                coachProgressContext += `    - ${parts.join(', ')} (${new Date(date).toLocaleDateString('el-GR')})\n`;
              });
            }
          } catch(e) { console.log('⚠️ Anthropometric error for', athlete.name); }
          
          // Coach-specific test sessions (coach_strength, coach_endurance, etc.)
          try {
            const cStrRes = await fetch(
              `${SUPABASE_URL}/rest/v1/coach_strength_test_data?select=*,exercises(name),coach_strength_test_sessions!inner(coach_id,user_id,test_date)&coach_strength_test_sessions.user_id=eq.${athlete.id}&coach_strength_test_sessions.coach_id=eq.${userId}&order=created_at.desc&limit=10`,
              { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
            );
            const cStrData = await cStrRes.json();
            if (Array.isArray(cStrData) && cStrData.length > 0) {
              coachProgressContext += '  🏋️ Coach Strength Tests:\n';
              cStrData.forEach((t: any) => {
                coachProgressContext += `    - ${t.exercises?.name || '?'}: ${t.weight_kg}kg${t.velocity_ms ? ` @ ${t.velocity_ms}m/s` : ''}${t.is_1rm ? ' (1RM)' : ''} (${t.coach_strength_test_sessions?.[0]?.test_date || ''})\n`;
              });
            }
          } catch(e) {}
          
          // 1RM data
          try {
            const rmRes = await fetch(
              `${SUPABASE_URL}/rest/v1/user_exercise_1rm?user_id=eq.${athlete.id}&select=*,exercises(name)&order=weight.desc`,
              { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
            );
            const rmData = await rmRes.json();
            if (Array.isArray(rmData) && rmData.length > 0) {
              coachProgressContext += '  💪 1RM:\n';
              rmData.forEach((r: any) => {
                coachProgressContext += `    - ${r.exercises?.name || '?'}: ${r.weight}kg (${r.recorded_date})\n`;
              });
            }
          } catch(e) {}
          
          // Program assignments
          try {
            const progRes = await fetch(
              `${SUPABASE_URL}/rest/v1/program_assignments?user_id=eq.${athlete.id}&select=id,status,training_dates,programs!fk_program_assignments_program_id(name)&order=created_at.desc&limit=3`,
              { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
            );
            const progData = await progRes.json();
            if (Array.isArray(progData) && progData.length > 0) {
              coachProgressContext += '  📋 Προγράμματα:\n';
              progData.forEach((p: any) => {
                const total = p.training_dates?.length || 0;
                coachProgressContext += `    - ${p.programs?.name || '?'} (${p.status}) - ${total} ημέρες\n`;
              });
            }
          } catch(e) {}
        }
        
        console.log(`✅ Coach progress context: ${coachProgressContext.length} chars for ${coachAthletes.length} athletes`);
      }
    }

    // 🏛️ FEDERATION DATA: Φόρτωση δεδομένων για ομοσπονδία
    let federationContext = '';
    if (isFederation && !targetUserId) {
      console.log('🏛️ Federation mode: Loading clubs and athletes data...');
      
      // Φόρτωση συνδεδεμένων συλλόγων
      const clubsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/federation_clubs?federation_id=eq.${userId}&select=club_id,app_users!federation_clubs_club_id_fkey(id,name,email)`,
        { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
      );
      const clubsData = await clubsRes.json();
      
      if (Array.isArray(clubsData) && clubsData.length > 0) {
        const clubs = clubsData.map((c: any) => ({ id: c.club_id, name: c.app_users?.name || 'Σύλλογος', email: c.app_users?.email || '' }));
        
        federationContext = `\n\n🏛️ ΟΜΟΣΠΟΝΔΙΑ - ΔΕΔΟΜΕΝΑ:\n\n📋 ΣΥΝΔΕΔΕΜΕΝΟΙ ΣΥΛΛΟΓΟΙ (${clubs.length}):\n`;
        
        for (const club of clubs) {
          federationContext += `\n🏠 ${club.name} (${club.email}):\n`;
          
          // Αθλητές κάθε συλλόγου
          const athletesRes = await fetch(
            `${SUPABASE_URL}/rest/v1/app_users?coach_id=eq.${club.id}&select=id,name,email&order=name.asc`,
            { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
          );
          const athletes = await athletesRes.json();
          
          if (Array.isArray(athletes) && athletes.length > 0) {
            federationContext += `  👥 Αθλητές (${athletes.length}):\n`;
            
            for (const athlete of athletes) {
              federationContext += `    👤 ${athlete.name} (${athlete.email}):\n`;
              
              // Strength tests
              try {
                const sRes = await fetch(
                  `${SUPABASE_URL}/rest/v1/strength_test_attempts?select=weight_kg,velocity_ms,exercises(name),strength_test_sessions!inner(test_date)&strength_test_sessions.user_id=eq.${athlete.id}&order=strength_test_sessions.test_date.desc&limit=5`,
                  { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
                );
                const sData = await sRes.json();
                if (Array.isArray(sData) && sData.length > 0) {
                  federationContext += '      🏋️ Δύναμη: ';
                  federationContext += sData.map((t: any) => `${t.exercises?.name}: ${t.weight_kg}kg`).join(', ') + '\n';
                }
              } catch(e) {}
              
              // Endurance
              try {
                const eRes = await fetch(
                  `${SUPABASE_URL}/rest/v1/endurance_test_data?select=vo2_max,mas_kmh,push_ups,pull_ups,endurance_test_sessions!inner(test_date)&endurance_test_sessions.user_id=eq.${athlete.id}&order=created_at.desc&limit=3`,
                  { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
                );
                const eData = await eRes.json();
                if (Array.isArray(eData) && eData.length > 0) {
                  const latest = eData[0];
                  const parts = [];
                  if (latest.vo2_max) parts.push(`VO2max: ${latest.vo2_max}`);
                  if (latest.mas_kmh) parts.push(`MAS: ${latest.mas_kmh}`);
                  if (latest.push_ups) parts.push(`Push-ups: ${latest.push_ups}`);
                  if (parts.length > 0) federationContext += `      🏃 Αντοχή: ${parts.join(', ')}\n`;
                }
              } catch(e) {}
              
              // Jump
              try {
                const jRes = await fetch(
                  `${SUPABASE_URL}/rest/v1/jump_test_data?select=counter_movement_jump,broad_jump,jump_test_sessions!inner(test_date)&jump_test_sessions.user_id=eq.${athlete.id}&order=created_at.desc&limit=3`,
                  { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
                );
                const jData = await jRes.json();
                if (Array.isArray(jData) && jData.length > 0) {
                  const latest = jData[0];
                  const parts = [];
                  if (latest.counter_movement_jump) parts.push(`CMJ: ${latest.counter_movement_jump}cm`);
                  if (latest.broad_jump) parts.push(`Broad: ${latest.broad_jump}cm`);
                  if (parts.length > 0) federationContext += `      ⬆️ Άλματα: ${parts.join(', ')}\n`;
                }
              } catch(e) {}
              
              // Anthropometric
              try {
                const aRes = await fetch(
                  `${SUPABASE_URL}/rest/v1/anthropometric_test_data?select=weight,body_fat_percentage,muscle_mass_percentage,anthropometric_test_sessions!inner(test_date)&anthropometric_test_sessions.user_id=eq.${athlete.id}&order=created_at.desc&limit=3`,
                  { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
                );
                const aData = await aRes.json();
                if (Array.isArray(aData) && aData.length > 0) {
                  const latest = aData[0];
                  const parts = [];
                  if (latest.weight) parts.push(`Βάρος: ${latest.weight}kg`);
                  if (latest.body_fat_percentage) parts.push(`Λίπος: ${latest.body_fat_percentage}%`);
                  if (parts.length > 0) federationContext += `      📏 Σωματομετρικά: ${parts.join(', ')}\n`;
                }
              } catch(e) {}
              
              // 1RM
              try {
                const rmRes = await fetch(
                  `${SUPABASE_URL}/rest/v1/user_exercise_1rm?user_id=eq.${athlete.id}&select=weight,exercises(name)&order=weight.desc&limit=5`,
                  { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
                );
                const rmData = await rmRes.json();
                if (Array.isArray(rmData) && rmData.length > 0) {
                  federationContext += '      💪 1RM: ';
                  federationContext += rmData.map((r: any) => `${r.exercises?.name}: ${r.weight}kg`).join(', ') + '\n';
                }
              } catch(e) {}

            // Subscriptions for each athlete (user_subscriptions)
            try {
              const subRes = await fetch(
                `${SUPABASE_URL}/rest/v1/user_subscriptions?user_id=eq.${athlete.id}&select=*,subscription_types(name,price,duration_months)&order=end_date.desc&limit=5`,
                { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
              );
              const subData = await subRes.json();
              if (Array.isArray(subData) && subData.length > 0) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const activeSub = subData.find((s: any) => {
                  const endDate = new Date(s.end_date);
                  endDate.setHours(23, 59, 59, 999);
                  return endDate >= today && s.status === 'active';
                });
                if (activeSub) {
                  const endDate = new Date(activeSub.end_date);
                  const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                  federationContext += `      💳 Συνδρομή: ${activeSub.subscription_types?.name || '?'} | λήγει ${activeSub.end_date} (${daysUntil > 0 ? `σε ${daysUntil} ημέρες` : 'ΛΗΓΜΕΝΗ'})${activeSub.is_paused ? ' [ΠΑΥΣΗ]' : ''}\n`;
                } else {
                  federationContext += `      💳 Συνδρομή: Ανενεργός\n`;
                }
              } else {
                federationContext += `      💳 Συνδρομή: Καμία\n`;
              }
            } catch(e) {}
          } // end for (athlete)
          
          // Club-level subscription summary
          try {
            const clubSubsRes = await fetch(
              `${SUPABASE_URL}/rest/v1/user_subscriptions?select=*,subscription_types(name),app_users!user_subscriptions_user_id_fkey(name,coach_id)&app_users.coach_id=eq.${club.id}&order=end_date.desc&limit=50`,
              { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
            );
            const clubSubsData = await clubSubsRes.json();
            if (Array.isArray(clubSubsData) && clubSubsData.length > 0) {
              const today2 = new Date();
              today2.setHours(0, 0, 0, 0);
              const activeCount = clubSubsData.filter((s: any) => {
                const endDate = new Date(s.end_date);
                endDate.setHours(23, 59, 59, 999);
                return endDate >= today2 && s.status === 'active';
              }).length;
              const pausedCount = clubSubsData.filter((s: any) => s.is_paused).length;
              federationContext += `  📊 Σύνοψη Συνδρομών: ${activeCount} ενεργές, ${pausedCount} σε παύση, ${clubSubsData.length} συνολικά\n`;
            }
          } catch(e) {}
          
          // Coach subscriptions (coach_subscriptions for coach_users)
          try {
            const coachUsersRes = await fetch(
              `${SUPABASE_URL}/rest/v1/coach_users?coach_id=eq.${club.id}&select=id,name`,
              { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
            );
            const coachUsersData2 = await coachUsersRes.json();
            if (Array.isArray(coachUsersData2) && coachUsersData2.length > 0) {
              const cuIds = coachUsersData2.map((u: any) => u.id);
              const cSubsRes = await fetch(
                `${SUPABASE_URL}/rest/v1/coach_subscriptions?coach_user_id=in.(${cuIds.join(',')})&select=*,subscription_types(name)&order=end_date.desc&limit=50`,
                { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
              );
              const cSubsData = await cSubsRes.json();
              if (Array.isArray(cSubsData) && cSubsData.length > 0) {
                const today3 = new Date();
                today3.setHours(0, 0, 0, 0);
                const activeCount2 = cSubsData.filter((s: any) => {
                  const endDate = new Date(s.end_date);
                  endDate.setHours(23, 59, 59, 999);
                  return endDate >= today3 && s.status === 'active';
                }).length;
                const unpaidCount = cSubsData.filter((s: any) => s.is_paid === false).length;
                federationContext += `  📊 Coach Συνδρομές: ${activeCount2} ενεργές, ${unpaidCount} απλήρωτες, ${cSubsData.length} συνολικά\n`;
              }
            }
          } catch(e) {}

          } else {
            federationContext += `  ⚠️ Δεν υπάρχουν αθλητές\n`;
          }
        }
        
        console.log(`✅ Federation context: ${federationContext.length} chars for ${clubs.length} clubs`);
      } else {
        federationContext = '\n\n🏛️ ΟΜΟΣΠΟΝΔΙΑ: Δεν βρέθηκαν συνδεδεμένοι σύλλογοι.\n';
      }
    }

    // 🏆 FEDERATION COMPETITIONS & RANKING DATA
    let federationCompetitionsContext = '';
    if (isFederation && !targetUserId) {
      console.log('🏆 Federation mode: Loading competitions and ranking data...');
      try {
        // Φόρτωση αγώνων ομοσπονδίας
        const compsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/federation_competitions?federation_id=eq.${userId}&select=*&order=competition_date.desc&limit=20`,
          { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
        );
        const compsData = await compsRes.json();
        
        if (Array.isArray(compsData) && compsData.length > 0) {
          federationCompetitionsContext = `\n\n🏆 ΑΓΩΝΕΣ ΟΜΟΣΠΟΝΔΙΑΣ (${compsData.length}):\n`;
          
          for (const comp of compsData) {
            const isRanking = comp.counts_for_ranking ? ' [RANKING]' : '';
            federationCompetitionsContext += `\n🥊 ${comp.name}${isRanking}\n  📅 Ημ/νία: ${comp.competition_date}\n  📍 Τοποθεσία: ${comp.location || '-'}\n  📋 Προθεσμία δηλώσεων: ${comp.registration_deadline || '-'}\n  Status: ${comp.status}\n`;
            
            // Φόρτωση κατηγοριών αγώνα
            try {
              const catsRes = await fetch(
                `${SUPABASE_URL}/rest/v1/federation_competition_categories?competition_id=eq.${comp.id}&select=*`,
                { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
              );
              const catsData = await catsRes.json();
              if (Array.isArray(catsData) && catsData.length > 0) {
                federationCompetitionsContext += `  📊 Κατηγορίες (${catsData.length}): ${catsData.map((c: any) => `${c.gender === 'male' ? '♂' : '♀'} ${c.age_group} ${c.weight_min}-${c.weight_max}kg`).join(', ')}\n`;
              }
            } catch(e) {}
            
            // Φόρτωση δηλώσεων
            try {
              const regsRes = await fetch(
                `${SUPABASE_URL}/rest/v1/federation_competition_registrations?competition_id=eq.${comp.id}&select=*,app_users!federation_competition_registrations_athlete_id_fkey(name,email,coach_id)&order=created_at.desc`,
                { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
              );
              const regsData = await regsRes.json();
              if (Array.isArray(regsData) && regsData.length > 0) {
                federationCompetitionsContext += `  👥 Δηλώσεις (${regsData.length}): ${regsData.map((r: any) => r.app_users?.name || '?').join(', ')}\n`;
              }
            } catch(e) {}
            
            // Φόρτωση αποτελεσμάτων αγώνα (ranking results)
            if (comp.counts_for_ranking) {
              try {
                const resultsRes = await fetch(
                  `${SUPABASE_URL}/rest/v1/federation_competition_results?competition_id=eq.${comp.id}&select=*,app_users!federation_competition_results_athlete_id_fkey(name)&order=placement.asc`,
                  { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
                );
                const resultsData = await resultsRes.json();
                if (Array.isArray(resultsData) && resultsData.length > 0) {
                  federationCompetitionsContext += `  🏅 Αποτελέσματα:\n`;
                  resultsData.forEach((r: any) => {
                    const medal = r.placement === 1 ? '🥇' : r.placement === 2 ? '🥈' : r.placement === 3 ? '🥉' : `#${r.placement}`;
                    federationCompetitionsContext += `    ${medal} ${r.app_users?.name || '?'} (${r.gender === 'male' ? '♂' : '♀'} ${r.age_group} ${r.weight_category}) - ${r.points || 0} πόντοι\n`;
                  });
                }
              } catch(e) {}
            }
          }
        }
        
        // Φόρτωση ranking points configuration
        try {
          const rpRes = await fetch(
            `${SUPABASE_URL}/rest/v1/federation_ranking_points?federation_id=eq.${userId}&select=*&order=placement.asc`,
            { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
          );
          const rpData = await rpRes.json();
          if (Array.isArray(rpData) && rpData.length > 0) {
            federationCompetitionsContext += `\n📊 ΣΥΣΤΗΜΑ ΒΑΘΜΟΛΟΓΙΑΣ RANKING:\n`;
            rpData.forEach((rp: any) => {
              const medal = rp.placement === 1 ? '🥇' : rp.placement === 2 ? '🥈' : rp.placement === 3 ? '🥉' : `#${rp.placement}`;
              federationCompetitionsContext += `  ${medal} ${rp.placement}η θέση: ${rp.points} πόντοι\n`;
            });
          }
        } catch(e) {}
        
        // Φόρτωση γενικού ranking (top αθλητές)
        try {
          const allResultsRes = await fetch(
            `${SUPABASE_URL}/rest/v1/federation_competition_results?select=athlete_id,points,placement,gender,age_group,weight_category,app_users!federation_competition_results_athlete_id_fkey(name),federation_competitions!inner(federation_id,counts_for_ranking)&federation_competitions.federation_id=eq.${userId}&federation_competitions.counts_for_ranking=eq.true`,
            { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
          );
          const allResultsData = await allResultsRes.json();
          if (Array.isArray(allResultsData) && allResultsData.length > 0) {
            // Aggregate by athlete
            const athleteMap = new Map<string, { name: string; totalPoints: number; golds: number; silvers: number; bronzes: number }>();
            allResultsData.forEach((r: any) => {
              const existing = athleteMap.get(r.athlete_id) || { name: r.app_users?.name || '?', totalPoints: 0, golds: 0, silvers: 0, bronzes: 0 };
              existing.totalPoints += r.points || 0;
              if (r.placement === 1) existing.golds++;
              if (r.placement === 2) existing.silvers++;
              if (r.placement === 3) existing.bronzes++;
              athleteMap.set(r.athlete_id, existing);
            });
            
            const sorted = Array.from(athleteMap.values()).sort((a, b) => b.totalPoints - a.totalPoints);
            federationCompetitionsContext += `\n🏆 ΓΕΝΙΚΟ RANKING (Top ${Math.min(sorted.length, 20)}):\n`;
            sorted.slice(0, 20).forEach((a, i) => {
              federationCompetitionsContext += `  ${i + 1}. ${a.name}: ${a.totalPoints} πόντοι (🥇${a.golds} 🥈${a.silvers} 🥉${a.bronzes})\n`;
            });
          }
        } catch(e) {}
        
        console.log(`✅ Federation competitions context: ${federationCompetitionsContext.length} chars`);
        
        // 🥊 BRACKETS & LIVE DATA (competition_matches + competition_rings)
        for (const comp of compsData) {
          let allMatchesForComp: any[] = [];
          try {
            const matchesRes = await fetch(
              `${SUPABASE_URL}/rest/v1/competition_matches?competition_id=eq.${comp.id}&select=*,athlete1:app_users!competition_matches_athlete1_id_fkey(name),athlete2:app_users!competition_matches_athlete2_id_fkey(name),category:federation_competition_categories!competition_matches_category_id_fkey(name),athlete1_club:app_users!competition_matches_athlete1_club_id_fkey(name),athlete2_club:app_users!competition_matches_athlete2_club_id_fkey(name)&order=match_order.asc.nullslast,round_number.desc,match_number.asc`,
              { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
            );
            const matchesData = await matchesRes.json();
            if (Array.isArray(matchesData) && matchesData.length > 0) {
              allMatchesForComp = matchesData;
              federationCompetitionsContext += `\n  🥊 ΖΕΥΓΑΡΩΜΑΤΑ/BRACKETS (${matchesData.length} αγώνες):\n`;
              matchesData.forEach((m: any) => {
                const winner = m.winner_id ? (m.winner_id === m.athlete1_id ? m.athlete1?.name : m.athlete2?.name) : null;
                const status = m.status === 'completed' ? '✅' : m.is_bye ? '⏭️ BYE' : '⏳';
                const club1 = m.athlete1_club?.name ? ` [${m.athlete1_club.name}]` : '';
                const club2 = m.athlete2_club?.name ? ` [${m.athlete2_club.name}]` : '';
                const orderStr = m.match_order ? ` (Σειρά αγώνα: #${m.match_order})` : '';
                federationCompetitionsContext += `    ${status} R${m.round_number} #${m.match_number}${orderStr}: ${m.athlete1?.name || 'TBD'}${club1} vs ${m.athlete2?.name || 'TBD'}${club2}${winner ? ` → Νικητής: ${winner}` : ''} ${m.result_type ? `(${m.result_type})` : ''} [${m.category?.name || ''}]\n`;
              });
            }
          } catch(e) {}

          try {
            const ringsRes = await fetch(
              `${SUPABASE_URL}/rest/v1/competition_rings?competition_id=eq.${comp.id}&select=*&order=ring_number.asc`,
              { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
            );
            const ringsData = await ringsRes.json();
            if (Array.isArray(ringsData) && ringsData.length > 0) {
              federationCompetitionsContext += `\n  📺 LIVE RINGS (${ringsData.length}):\n`;
              ringsData.forEach((r: any) => {
                // Find the current match for this ring
                const currentMatch = r.current_match_id ? allMatchesForComp.find((m: any) => m.id === r.current_match_id) : null;
                const currentMatchInfo = currentMatch 
                  ? `🔴 ΤΡΕΧΩΝ ΑΓΩΝΑΣ: #${currentMatch.match_order || currentMatch.match_number} - ${currentMatch.athlete1?.name || 'TBD'} vs ${currentMatch.athlete2?.name || 'TBD'} [${currentMatch.category?.name || ''}] (R${r.timer_current_round || 1}, ${r.timer_is_break ? 'BREAK' : 'ΑΓΩΝΑΣ'}, ${r.timer_remaining_seconds != null ? r.timer_remaining_seconds + 'sec left' : '-'})` 
                  : 'Κανένας τρέχων αγώνας';
                
                // Find remaining matches for this ring
                const ringMatches = allMatchesForComp.filter((m: any) => 
                  m.match_order && m.match_order >= (r.match_range_start || 0) && m.match_order <= (r.match_range_end || 999) && !m.is_bye
                );
                const pendingMatches = ringMatches.filter((m: any) => m.status !== 'completed');
                const currentOrder = currentMatch?.match_order || 0;
                const upcomingMatches = pendingMatches.filter((m: any) => m.match_order > currentOrder).sort((a: any, b: any) => a.match_order - b.match_order);
                
                federationCompetitionsContext += `    Ring ${r.ring_number} (${r.ring_name || '-'}): ${r.is_active ? '🔴 LIVE' : '⚪ OFF'} | Αγώνες: ${r.match_range_start || '?'}-${r.match_range_end || '?'}\n`;
                federationCompetitionsContext += `      ${currentMatchInfo}\n`;
                if (upcomingMatches.length > 0) {
                  federationCompetitionsContext += `      📋 Επόμενοι αγώνες στο ring (${upcomingMatches.length}):\n`;
                  upcomingMatches.forEach((m: any) => {
                    federationCompetitionsContext += `        #${m.match_order}: ${m.athlete1?.name || 'TBD'} vs ${m.athlete2?.name || 'TBD'} [${m.category?.name || ''}]\n`;
                  });
                }
              });
            }
          } catch(e) {}
        }
        
      } catch(e) { console.log('⚠️ Error loading federation competitions:', e); }
    }

    // 🏛️ FEDERATION SUBSCRIPTIONS & RECEIPTS
    let federationSubscriptionsContext = '';
    let federationReceiptsContext = '';
    if (isFederation && !targetUserId) {
      console.log('🏛️ Federation mode: Loading subscriptions and receipts...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Federation's own subscriptions (coach_subscriptions where coach_id = federationId)
      try {
        const fedSubsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/coach_subscriptions?coach_id=eq.${userId}&select=*,subscription_types(name,price,duration_months),app_users!coach_subscriptions_user_id_fkey(name,email)&order=end_date.desc`,
          { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
        );
        const fedSubsData = await fedSubsRes.json();

        if (Array.isArray(fedSubsData) && fedSubsData.length > 0) {
          const activeCount = fedSubsData.filter((s: any) => {
            const endDate = new Date(s.end_date);
            endDate.setHours(23, 59, 59, 999);
            return endDate >= today && s.status === 'active' && !s.is_paused;
          }).length;
          const unpaidCount = fedSubsData.filter((s: any) => s.is_paid === false).length;
          const pausedCount = fedSubsData.filter((s: any) => s.is_paused).length;
          const expiredCount = fedSubsData.filter((s: any) => {
            const endDate = new Date(s.end_date);
            endDate.setHours(23, 59, 59, 999);
            return endDate < today;
          }).length;

          const totalRevenue = fedSubsData.reduce((sum: number, s: any) => sum + (s.subscription_types?.price || 0), 0);
          const paidRevenue = fedSubsData.filter((s: any) => s.is_paid !== false).reduce((sum: number, s: any) => sum + (s.subscription_types?.price || 0), 0);
          const unpaidRevenue = fedSubsData.filter((s: any) => s.is_paid === false).reduce((sum: number, s: any) => sum + (s.subscription_types?.price || 0), 0);

          federationSubscriptionsContext = `\n\n💳 ΣΥΝΔΡΟΜΕΣ ΟΜΟΣΠΟΝΔΙΑΣ (δικοί της τύποι):
📊 ΣΤΑΤΙΣΤΙΚΑ:
- Συνολικές συνδρομές: ${fedSubsData.length}
- Ενεργές: ${activeCount}
- Απλήρωτες: ${unpaidCount}
- Σε παύση: ${pausedCount}
- Ληγμένες: ${expiredCount}

💰 ΟΙΚΟΝΟΜΙΚΑ:
- Συνολικά έσοδα: ${totalRevenue}€
- Εισπραχθέντα: ${paidRevenue}€
- Απλήρωτα: ${unpaidRevenue}€

📋 ΛΙΣΤΑ ΣΥΝΔΡΟΜΩΝ:
`;
          fedSubsData.forEach((sub: any) => {
            const clubName = sub.app_users?.name || 'Άγνωστο';
            const typeName = sub.subscription_types?.name || '?';
            const price = sub.subscription_types?.price || 0;
            const endDate = new Date(sub.end_date);
            const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

            let statusEmoji = '✅';
            if (sub.is_paid === false) statusEmoji = '💰';
            else if (sub.is_paused) statusEmoji = '⏸️';
            else if (daysUntil < 0) statusEmoji = '❌';
            else if (daysUntil <= 7) statusEmoji = '⚠️';

            federationSubscriptionsContext += `  ${statusEmoji} ${clubName}: ${typeName} (${price}€) | ${sub.start_date} - ${sub.end_date} (${daysUntil > 0 ? `σε ${daysUntil} ημέρες` : `ΛΗΓΜΕΝΗ πριν ${Math.abs(daysUntil)} ημέρες`})${sub.is_paid === false ? ' [ΑΠΛΗΡΩΤΗ]' : ''}${sub.is_paused ? ' [ΠΑΥΣΗ]' : ''}\n`;
          });
        } else {
          federationSubscriptionsContext = '\n\n💳 ΣΥΝΔΡΟΜΕΣ ΟΜΟΣΠΟΝΔΙΑΣ: Δεν υπάρχουν συνδρομές.\n';
        }
      } catch(e) { console.log('⚠️ Error loading federation subscriptions:', e); }

      // Federation receipts
      try {
        const fedReceiptsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/coach_receipts?coach_id=eq.${userId}&select=*,app_users!coach_receipts_user_id_fkey(name,email),subscription_types(name)&order=created_at.desc&limit=50`,
          { headers: { "apikey": SUPABASE_SERVICE_ROLE_KEY!, "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
        );
        const fedReceiptsData = await fedReceiptsRes.json();

        if (Array.isArray(fedReceiptsData) && fedReceiptsData.length > 0) {
          const totalAmount = fedReceiptsData.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
          const markedCount = fedReceiptsData.filter((r: any) => r.mark).length;

          federationReceiptsContext = `\n\n🧾 ΑΠΟΔΕΙΞΕΙΣ ΟΜΟΣΠΟΝΔΙΑΣ:
📊 ΣΤΑΤΙΣΤΙΚΑ:
- Συνολικές αποδείξεις: ${fedReceiptsData.length}
- Συνολικό ποσό: ${totalAmount}€
- Μαρκαρισμένες: ${markedCount}

📋 ΛΙΣΤΑ ΑΠΟΔΕΙΞΕΩΝ (πρόσφατες):
`;
          fedReceiptsData.slice(0, 30).forEach((r: any) => {
            const clubName = r.app_users?.name || 'Άγνωστο';
            const typeName = r.subscription_types?.name || r.receipt_type || '?';
            const date = new Date(r.created_at).toLocaleDateString('el-GR');
            federationReceiptsContext += `  🧾 ${r.receipt_number}: ${clubName} - ${typeName} - ${r.amount}€ (${date})${r.mark ? ` [${r.mark}]` : ''}${r.notes ? ` | ${r.notes}` : ''}\n`;
          });
        } else {
          federationReceiptsContext = '\n\n🧾 ΑΠΟΔΕΙΞΕΙΣ ΟΜΟΣΠΟΝΔΙΑΣ: Δεν υπάρχουν αποδείξεις.\n';
        }
      } catch(e) { console.log('⚠️ Error loading federation receipts:', e); }

      console.log(`✅ Federation subscriptions context: ${federationSubscriptionsContext.length} chars, receipts: ${federationReceiptsContext.length} chars`);
    }

    let userSubscriptionStatus = 'inactive';
    let hasActiveSubscription = false;
    let subscriptionsContext = '';
    
    // Για τον χρήστη που κάνει request, ελέγχουμε την συνδρομή του
    const userSubscriptionResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/user_subscriptions?user_id=eq.${userId}&status=eq.active&end_date=gte.${new Date().toISOString().split('T')[0]}&select=*,subscription_types(name,description)&order=end_date.desc&limit=1`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const userSubscriptionData = await userSubscriptionResponse.json();
    
    if (Array.isArray(userSubscriptionData) && userSubscriptionData.length > 0) {
      hasActiveSubscription = true;
      userSubscriptionStatus = 'active';
      console.log(`✅ User ${userId} has active subscription:`, userSubscriptionData[0]);
    } else {
      console.log(`⚠️ User ${userId} does NOT have an active subscription`);
    }
    
    // Admin: φόρτωση ΟΛΩΝ των συνδρομών για overview
    if (isAdmin && !targetUserId) {
      const allSubscriptionsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/user_subscriptions?select=*,subscription_types(name),app_users!user_subscriptions_user_id_fkey(name)&order=created_at.desc&limit=100`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const allSubscriptionsData = await allSubscriptionsResponse.json();
      
      if (Array.isArray(allSubscriptionsData) && allSubscriptionsData.length > 0) {
        const activeCount = allSubscriptionsData.filter((s: any) => s.status === 'active').length;
        const inactiveCount = allSubscriptionsData.filter((s: any) => s.status !== 'active').length;
        
        subscriptionsContext = `\n\n📊 ΣΥΝΔΡΟΜΕΣ OVERVIEW:\n- Ενεργές: ${activeCount}\n- Ανενεργές: ${inactiveCount}\n`;
        
        // Λίστα με τους χρήστες και τις συνδρομές τους
        const subscriptionsList = allSubscriptionsData.slice(0, 20).map((s: any) => {
          const userName = s.app_users?.name || 'Unknown';
          const typeName = s.subscription_types?.name || 'Unknown';
          const status = s.status;
          const endDate = s.end_date;
          return `  • ${userName}: ${typeName} (${status}) - λήγει: ${endDate}`;
        }).join('\n');
        
        subscriptionsContext += `\nΠρόσφατες συνδρομές:\n${subscriptionsList}`;
        console.log(`✅ Admin: Loaded ${allSubscriptionsData.length} subscriptions`);
      }
    }
    
    // 🏋️ ΦΟΡΤΩΣΗ ΤΡΑΠΕΖΑΣ ΑΣΚΗΣΕΩΝ (για δημιουργία προγραμμάτων)
    // Διαθέσιμο για admin Ή για users με ενεργή συνδρομή
    let exerciseDatabaseContext = '';
    const canAccessProgramBuilder = isAdmin || hasActiveSubscription;
    
    if (canAccessProgramBuilder) {
      const exercisesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/exercises?select=id,name&order=name.asc`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const exercisesData = await exercisesResponse.json();
      if (Array.isArray(exercisesData) && exercisesData.length > 0) {
        console.log(`✅ Loaded ${exercisesData.length} exercises from database`);
        const exerciseNames = exercisesData.map((e: any) => e.name).join(', ');
        exerciseDatabaseContext = `\n\n📚 ΔΙΑΘΕΣΙΜΕΣ ΑΣΚΗΣΕΙΣ ΣΤΗΝ ΤΡΑΠΕΖΑ (${exercisesData.length} ασκήσεις):\n${exerciseNames}\n\n⚠️ ΧΡΗΣΙΜΟΠΟΙΗΣΕ ΜΟΝΟ ασκήσεις από αυτή τη λίστα! Αν δεν υπάρχει, χρησιμοποίησε κάτι παρόμοιο.`;
      }
    }

    // 📅 ΦΟΡΤΩΣΗ ΕΤΗΣΙΟΥ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΥ (Annual Planning)
    let annualPlanningContext = '';
    let phaseConfigContext = '';
    
    // Φόρτωση training phase configurations
    const phaseConfigResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/training_phase_config?select=*&order=phase_type.asc`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const phaseConfigData = await phaseConfigResponse.json();
    
    // Φόρτωση rep schemes ανά φάση
    const repSchemesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/phase_rep_schemes?select=*`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const repSchemesData = await repSchemesResponse.json();
    
    // Φόρτωση ασκήσεων ανά φάση
    const phaseExercisesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/phase_exercises?select=*,exercises(name)`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const phaseExercisesData = await phaseExercisesResponse.json();
    
    // Φόρτωση corrective exercises for issues
    const correctiveIssuesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/corrective_issue_exercises?select=*,exercises(name)`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const correctiveIssuesData = await correctiveIssuesResponse.json();
    
    // Φόρτωση corrective exercises for muscles
    const correctiveMusclesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/corrective_muscle_exercises?select=*,exercises(name),muscles(name)`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const correctiveMusclesData = await correctiveMusclesResponse.json();
    
    if (Array.isArray(phaseConfigData) && phaseConfigData.length > 0) {
      console.log(`✅ Loaded ${phaseConfigData.length} training phase configs`);
      
      phaseConfigContext = '\n\n📅 ΡΥΘΜΙΣΕΙΣ ΠΡΟΠΟΝΗΤΙΚΩΝ ΦΑΣΕΩΝ:\n';
      
      // Group by phase_type (main phases)
      const mainPhases = phaseConfigData.filter((p: any) => p.phase_type === 'main');
      const subPhases = phaseConfigData.filter((p: any) => p.phase_type === 'sub');
      
      phaseConfigContext += '\n🎯 ΚΥΡΙΕΣ ΦΑΣΕΙΣ:\n';
      mainPhases.forEach((phase: any) => {
        phaseConfigContext += `  - ${phase.phase_name} (${phase.phase_key})\n`;
        
        // Rep schemes για αυτή τη φάση
        const phaseRepSchemes = Array.isArray(repSchemesData) 
          ? repSchemesData.filter((rs: any) => rs.phase_config_id === phase.id)
          : [];
        if (phaseRepSchemes.length > 0) {
          phaseConfigContext += `    📊 Επαναλήψεις:\n`;
          phaseRepSchemes.forEach((rs: any) => {
            phaseConfigContext += `      • ${rs.rep_range || rs.rep_scheme}${rs.notes ? ` (${rs.notes})` : ''}\n`;
          });
        }
        
        // Ασκήσεις για αυτή τη φάση
        const phaseExs = Array.isArray(phaseExercisesData) 
          ? phaseExercisesData.filter((pe: any) => pe.phase_config_id === phase.id)
          : [];
        if (phaseExs.length > 0) {
          phaseConfigContext += `    🏋️ Ασκήσεις: ${phaseExs.map((e: any) => e.exercises?.name || 'Unknown').join(', ')}\n`;
        }
      });
      
      phaseConfigContext += '\n📍 ΥΠΟ-ΦΑΣΕΙΣ:\n';
      subPhases.forEach((phase: any) => {
        phaseConfigContext += `  - ${phase.phase_name} (${phase.phase_key})${phase.parent_phase_key ? ` [ανήκει στο: ${phase.parent_phase_key}]` : ''}\n`;
      });
    }
    
    // Corrective exercises context
    if ((Array.isArray(correctiveIssuesData) && correctiveIssuesData.length > 0) || 
        (Array.isArray(correctiveMusclesData) && correctiveMusclesData.length > 0)) {
      phaseConfigContext += '\n\n🔧 ΔΙΟΡΘΩΤΙΚΕΣ ΑΣΚΗΣΕΙΣ:\n';
      
      if (Array.isArray(correctiveIssuesData) && correctiveIssuesData.length > 0) {
        // Group by issue_category + issue_name
        const issueGroups: Record<string, any[]> = {};
        correctiveIssuesData.forEach((ci: any) => {
          const key = `${ci.issue_category}|${ci.issue_name}`;
          if (!issueGroups[key]) issueGroups[key] = [];
          issueGroups[key].push(ci);
        });
        
        phaseConfigContext += '\n  📋 Ανά Πρόβλημα Κίνησης:\n';
        Object.entries(issueGroups).forEach(([key, exercises]) => {
          const [category, issueName] = key.split('|');
          phaseConfigContext += `    ${category} - ${issueName}:\n`;
          exercises.forEach((e: any) => {
            phaseConfigContext += `      • ${e.exercises?.name || 'Unknown'} (${e.exercise_type})${e.notes ? ` - ${e.notes}` : ''}\n`;
          });
        });
      }
      
      if (Array.isArray(correctiveMusclesData) && correctiveMusclesData.length > 0) {
        // Group by muscle
        const muscleGroups: Record<string, any[]> = {};
        correctiveMusclesData.forEach((cm: any) => {
          const muscleName = cm.muscles?.name || 'Unknown';
          if (!muscleGroups[muscleName]) muscleGroups[muscleName] = [];
          muscleGroups[muscleName].push(cm);
        });
        
        phaseConfigContext += '\n  💪 Ανά Μυ:\n';
        Object.entries(muscleGroups).forEach(([muscle, exercises]) => {
          phaseConfigContext += `    ${muscle}:\n`;
          exercises.forEach((e: any) => {
            phaseConfigContext += `      • ${e.exercises?.name || 'Unknown'} (${e.action_type})${e.notes ? ` - ${e.notes}` : ''}\n`;
          });
        });
      }
    }

    // 🥗 ΦΟΡΤΩΣΗ ΤΡΑΠΕΖΑΣ ΦΑΓΗΤΩΝ (για δημιουργία προγραμμάτων διατροφής)
    let foodsDatabaseContext = '';
    if (canAccessProgramBuilder) {
      const foodsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/foods?select=id,name,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,category&order=name.asc`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const foodsData = await foodsResponse.json();
      if (Array.isArray(foodsData) && foodsData.length > 0) {
        console.log(`✅ Loaded ${foodsData.length} foods from database`);
        
        // Group foods by category
        const foodsByCategory: Record<string, any[]> = {};
        foodsData.forEach((food: any) => {
          const cat = food.category || 'Άλλα';
          if (!foodsByCategory[cat]) {
            foodsByCategory[cat] = [];
          }
          foodsByCategory[cat].push(food);
        });
        
        // Create context string with nutritional info
        let foodsList = '';
        Object.entries(foodsByCategory).forEach(([category, foods]) => {
          foodsList += `\n📌 ${category}:\n`;
          foods.forEach((f: any) => {
            foodsList += `  - ${f.name} (ανά 100g: ${f.calories_per_100g || 0}kcal, P:${f.protein_per_100g || 0}g, C:${f.carbs_per_100g || 0}g, F:${f.fat_per_100g || 0}g)\n`;
          });
        });
        
        foodsDatabaseContext = `\n\n🥗 ΤΡΑΠΕΖΑ ΦΑΓΗΤΩΝ (${foodsData.length} τρόφιμα):${foodsList}\n\n⚠️ ΧΡΗΣΙΜΟΠΟΙΗΣΕ ΜΟΝΟ τρόφιμα από αυτή τη λίστα για προγράμματα διατροφής! Χρησιμοποίησε τα ΑΚΡΙΒΗ ονόματα.`;
      }
    }

    // Αν είναι admin και έχει δώσει targetUserId, χρησιμοποιούμε αυτό
    // Αλλιώς χρησιμοποιούμε το δικό του userId
    const effectiveUserId = (isAdmin && targetUserId) ? targetUserId : userId;

    // 🔥 ADMIN CONTEXT: Φόρτωση ΟΛΩΝ των active programs αν είναι admin
    let adminActiveProgramsContext = '';
    let workoutHistoryContext = ''; // Initialize here so it's always defined
    if (isAdmin && !targetUserId) {
      // Φόρτωση ΟΛΩΝ των assignments (για όλους τους χρήστες, ΧΩΡΙΣ date filter - όλων των χρόνων)
      const allAssignmentsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/program_assignments?select=*`,
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
        
        // 🏋️ Φόρτωση exercise_results για πραγματικά αποτελέσματα προπονήσεων
        const allCompletionIds = Array.isArray(allCompletions) ? allCompletions.map((c: any) => c.id) : [];
        let allExerciseResults: any[] = [];
        if (allCompletionIds.length > 0) {
          // Batch loading για μεγάλες λίστες
          const batchSize = 50;
          for (let i = 0; i < allCompletionIds.length; i += batchSize) {
            const batchIds = allCompletionIds.slice(i, i + batchSize);
            const exerciseResultsResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/exercise_results?workout_completion_id=in.(${batchIds.join(',')})&select=*`,
              {
                headers: {
                  "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
              }
            );
            const exerciseResultsData = await exerciseResultsResponse.json();
            if (Array.isArray(exerciseResultsData)) {
              allExerciseResults.push(...exerciseResultsData);
            }
          }
          console.log(`✅ Loaded ${allExerciseResults.length} exercise results`);
        }
        
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
                    
                    // Programmed values
                    let exerciseLine = `      • ${exerciseName}: ${pe.sets || '?'}x${pe.reps || '?'}`;
                    if (pe.kg) exerciseLine += ` @ ${pe.kg}kg`;
                    if (pe.percentage_1rm) exerciseLine += ` (${pe.percentage_1rm}%1RM)`;
                    if (pe.velocity_ms) exerciseLine += ` @ ${pe.velocity_ms}m/s`;
                    if (pe.tempo) exerciseLine += ` tempo ${pe.tempo}`;
                    if (pe.rest) exerciseLine += ` rest ${pe.rest}s`;
                    if (pe.notes) exerciseLine += ` [${pe.notes}]`;
                    
                    // Actual results if completed
                    if (completion?.status === 'completed') {
                      const exerciseResult = allExerciseResults.find((er: any) => 
                        er.workout_completion_id === completion.id && er.program_exercise_id === pe.id
                      );
                      if (exerciseResult) {
                        exerciseLine += '\n        ➜ ΠΡΑΓΜΑΤΙΚΑ: ';
                        const actualParts: string[] = [];
                        if (exerciseResult.actual_sets) actualParts.push(`${exerciseResult.actual_sets} sets`);
                        if (exerciseResult.actual_reps) actualParts.push(`${exerciseResult.actual_reps} reps`);
                        if (exerciseResult.actual_kg) actualParts.push(`${exerciseResult.actual_kg}kg`);
                        if (exerciseResult.actual_velocity_ms) actualParts.push(`${exerciseResult.actual_velocity_ms}m/s`);
                        if (exerciseResult.actual_rest) actualParts.push(`rest ${exerciseResult.actual_rest}s`);
                        exerciseLine += actualParts.join(', ');
                        if (exerciseResult.notes) exerciseLine += ` [${exerciseResult.notes}]`;
                      }
                    }
                    
                    detailedWorkoutsContext += exerciseLine + '\n';
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

    // 📅 ADMIN ANNUAL PLANNING CONTEXT: Φόρτωση μακροκύκλων ΟΛΩΝ των χρηστών
    let adminAnnualPlanningContext = '';
    if (isAdmin && !targetUserId) {
      console.log('📅 Admin mode: Loading annual planning for ALL users...');
      
      // Φόρτωση ΟΛΩΝ των user_annual_phases
      const allAnnualPhasesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/user_annual_phases?select=*&order=year.desc,month.asc`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const allAnnualPhases = await allAnnualPhasesResponse.json();
      
      // Φόρτωση ΟΛΩΝ των χρηστών
      const allUsersForPlanningResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/app_users?select=id,name,email&order=name.asc`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const allUsersForPlanning = await allUsersForPlanningResponse.json();
      const totalUsers = Array.isArray(allUsersForPlanning) ? allUsersForPlanning.length : 0;
      
      if (Array.isArray(allAnnualPhases)) {
        // Βρες μοναδικούς χρήστες με μακροκύκλο
        const usersWithMacrocycle = [...new Set(allAnnualPhases.map((p: any) => p.user_id))];
        const usersWithMacrocycleCount = usersWithMacrocycle.length;
        const usersWithoutMacrocycleCount = totalUsers - usersWithMacrocycleCount;
        
        console.log(`✅ Annual Planning: ${usersWithMacrocycleCount} users with macrocycle, ${usersWithoutMacrocycleCount} without`);
        
        const PHASE_LABELS: Record<string, string> = {
          'corrective': 'Διορθωτικές',
          'stabilization': 'Σταθεροποίηση',
          'connecting-linking': 'Σύνδεση',
          'movement-skills': 'Κινητικές Δεξιότητες',
          'non-functional-hypertrophy': 'Μη Λειτουργική Υπερτροφία',
          'functional-hypertrophy': 'Λειτουργική Υπερτροφία',
          'maximal-strength': 'Μέγιστη Δύναμη',
          'power': 'Ισχύς',
          'endurance': 'Αντοχή',
          'competition': 'Αγωνιστική'
        };
        
        adminAnnualPlanningContext = `\n\n📅 ΕΤΗΣΙΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ (ANNUAL PLANNING / ΜΑΚΡΟΚΥΚΛΟΣ):

📊 ΣΤΑΤΙΣΤΙΚΑ:
- Συνολικοί χρήστες στην πλατφόρμα: ${totalUsers}
- Χρήστες ΜΕ ανατεθειμένο μακροκύκλο: ${usersWithMacrocycleCount}
- Χρήστες ΧΩΡΙΣ μακροκύκλο: ${usersWithoutMacrocycleCount}
- Συνολικές καταχωρήσεις φάσεων: ${allAnnualPhases.length}

⚠️ ΣΗΜΑΝΤΙΚΟ: Μόνο ${usersWithMacrocycleCount} από τους ${totalUsers} χρήστες έχουν σχεδιασμένο μακροκύκλο!

`;
        
        if (usersWithMacrocycleCount > 0 && Array.isArray(allUsersForPlanning)) {
          // Group phases by user
          const phasesByUser: Record<string, any[]> = {};
          allAnnualPhases.forEach((phase: any) => {
            if (!phasesByUser[phase.user_id]) phasesByUser[phase.user_id] = [];
            phasesByUser[phase.user_id].push(phase);
          });
          
          adminAnnualPlanningContext += `📋 ΧΡΗΣΤΕΣ ΜΕ ΜΑΚΡΟΚΥΚΛΟ:\n`;
          
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth() + 1;
          const MONTH_NAMES = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μάι', 'Ιούν', 'Ιούλ', 'Αύγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
          
          Object.entries(phasesByUser).slice(0, 20).forEach(([userId, phases]) => {
            const user = allUsersForPlanning.find((u: any) => u.id === userId);
            const userName = user?.name || 'Unknown';
            const userEmail = user?.email || '';
            
            // Τρέχουσα φάση
            const currentPhase = phases.find((p: any) => p.year === currentYear && p.month === currentMonth);
            const currentPhaseLabel = currentPhase ? (PHASE_LABELS[currentPhase.phase] || currentPhase.phase) : 'Δεν έχει οριστεί';
            
            // Πόσοι μήνες έχουν προγραμματιστεί
            const monthsPlanned = phases.length;
            
            adminAnnualPlanningContext += `  • ${userName} (${userEmail}): ${monthsPlanned} μήνες, Τρέχουσα φάση: ${currentPhaseLabel}\n`;
          });
          
          if (usersWithMacrocycleCount > 20) {
            adminAnnualPlanningContext += `  ... και άλλοι ${usersWithMacrocycleCount - 20} χρήστες\n`;
          }
        }
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
    let adminGlobalUnpaidSubscriptions: any[] = [];
    let adminUserNameById: Record<string, string> = {};
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
        
        adminAllUsersContext = '\n\n👥 ΛΙΣΤΑ ΧΡΗΣΤΩΝ (Dashboard/Users) - IDs / Emails / Ημερομηνίες Εγγραφής:\n';
        
        allUsersFull.forEach((user: any) => {
          const regDate = user.created_at ? new Date(user.created_at).toLocaleDateString('el-GR') : 'Άγνωστη';
          adminAllUsersContext += `- ${user.name} | ${user.email} | id: ${user.id} | Εγγράφηκε ${regDate}\n`;
        });
        
        // ΥΠΟΛΟΓΙΣΜΟΣ ΣΤΑΤΙΣΤΙΚΩΝ ΣΥΝΔΡΟΜΩΝ
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let activeCount = 0;
        let pausedCount = 0;
        let expiringSoonCount = 0; // λήγουν σε 7 ημέρες
        let expiredCount = 0;
        let futureCount = 0;
        let paidCount = 0;
        let unpaidCount = 0;
        let unknownPaymentCount = 0;
        let activeUnpaidCount = 0;
        
        if (Array.isArray(allSubscriptions)) {
          allSubscriptions.forEach((sub: any) => {
            const endDateObj = sub.end_date ? new Date(sub.end_date) : null;
            const startDateObj = sub.start_date ? new Date(sub.start_date) : null;

            if (sub.is_paid === true) paidCount++;
            else if (sub.is_paid === false) unpaidCount++;
            else unknownPaymentCount++;
            
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
                if (sub.is_paid === false) {
                  activeUnpaidCount++;
                }
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
        adminAllUsersContext += `   💸 Απλήρωτες: ${unpaidCount}\n`;
        adminAllUsersContext += `   💰 Πληρωμένες: ${paidCount}\n`;
        adminAllUsersContext += `   ❓ Άγνωστη κατάσταση πληρωμής: ${unknownPaymentCount}\n`;
        adminAllUsersContext += `   🚨 Ενεργές αλλά ΑΠΛΗΡΩΤΕΣ: ${activeUnpaidCount}\n`;
        adminAllUsersContext += '═══════════════════════════════════════════════════\n\n';
        adminAllUsersContext += '⚠️ ΣΗΜΑΝΤΙΚΟ: start_date = ΕΝΑΡΞΗ συνδρομής, end_date = ΛΗΞΗ συνδρομής\n\n';
        
        const usersWithSubs = allUsersFull.filter((user: any) => {
          if (!Array.isArray(allSubscriptions)) return false;
          return allSubscriptions.some((s: any) => s.user_id === user.id);
        });

        const userNameById: Record<string, string> = {};
        allUsersFull.forEach((u: any) => {
          userNameById[u.id] = u.name;
        });
        adminUserNameById = userNameById;

        const unpaidSubscriptionsList = Array.isArray(allSubscriptions)
          ? allSubscriptions.filter((s: any) => s.is_paid === false)
          : [];

        adminGlobalUnpaidSubscriptions = unpaidSubscriptionsList
          .map((sub: any) => {
            const subType = Array.isArray(allSubTypes)
              ? allSubTypes.find((st: any) => st.id === sub.subscription_type_id)
              : null;

            return {
              ...sub,
              user_name: userNameById[sub.user_id] || `Χρήστης ${sub.user_id}`,
              subscription_type_name: subType?.name || 'Άγνωστος τύπος',
            };
          })
          .sort((a: any, b: any) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime());

        if (adminGlobalUnpaidSubscriptions.length > 0) {
          adminAllUsersContext += '🚨 ΑΝΑΛΥΤΙΚΗ ΛΙΣΤΑ ΑΠΛΗΡΩΤΩΝ ΣΥΝΔΡΟΜΩΝ (GLOBAL):\n';
          adminGlobalUnpaidSubscriptions.forEach((sub: any, index: number) => {
            adminAllUsersContext += `  ${index + 1}. ${sub.user_name} | ${sub.subscription_type_name} | subscription_id: ${sub.id} | ${sub.start_date || '-'} → ${sub.end_date || '-'}${sub.is_paused ? ' [ΠΑΥΣΗ]' : ''}\n`;
          });
          adminAllUsersContext += '\n';
        } else {
          adminAllUsersContext += '✅ Δεν υπάρχουν απλήρωτες συνδρομές αυτή τη στιγμή.\n\n';
        }
        
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
              adminAllUsersContext += `     🆔 subscription_id: ${sub.id}\n`;
              adminAllUsersContext += `     📆 Έναρξη: ${startDate} | Λήξη: ${endDate}\n`;
              adminAllUsersContext += `     📊 Κατάσταση: ${statusText}\n`;
              adminAllUsersContext += `     💳 Πληρωμή: ${sub.is_paid === false ? 'ΑΠΛΗΡΩΤΗ' : sub.is_paid === true ? 'ΠΛΗΡΩΜΕΝΗ' : 'ΑΓΝΩΣΤΟ'}\n`;
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
    let strengthHistory: any[] = [];
    
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

      // 📅 ΦΟΡΤΩΣΗ ΕΤΗΣΙΟΥ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΥ ΧΡΗΣΤΗ (από ΟΛΟΥΣ τους πίνακες)
      
      const PHASE_LABELS: Record<string, string> = {
        'corrective': 'Διορθωτικές',
        'stabilization': 'Σταθεροποίηση',
        'connecting-linking': 'Σύνδεση',
        'movement-skills': 'Κινητικές Δεξιότητες',
        'non-functional-hypertrophy': 'Μη Λειτουργική Υπερτροφία',
        'functional-hypertrophy': 'Λειτουργική Υπερτροφία',
        'maximal-strength': 'Μέγιστη Δύναμη',
        'power': 'Ισχύς',
        'endurance': 'Αντοχή',
        'competition': 'Αγωνιστική',
        'pwr-end': 'Power/Endurance',
        'spd-end': 'Speed/Endurance',
        'str-spd': 'Strength/Speed'
      };
      
      const MONTH_NAMES = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μάι', 'Ιούν', 'Ιούλ', 'Αύγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
      const DAY_NAMES = ['', 'Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ', 'Κυρ'];
      
      // 1️⃣ ΠΡΩΤΑ: Φόρτωση από user_annual_phases (χειροκίνητο annual planning από UI)
      const userAnnualPhasesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/user_annual_phases?user_id=eq.${effectiveUserId}&select=*&order=year.desc,month.asc`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const userAnnualPhases = await userAnnualPhasesResponse.json();
      
      // 2️⃣ ΔΕΥΤΕΡΟΝ: Φόρτωση από user_annual_planning (AI-generated planning με JSON)
      const userAnnualPlanningResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/user_annual_planning?user_id=eq.${effectiveUserId}&select=*`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const userAnnualPlanningData = await userAnnualPlanningResponse.json();
      
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      let hasAnnualPlan = false;
      
      // ============= ΦΟΡΤΩΣΗ ΑΠΟ user_annual_phases (ΧΕΙΡΟΚΙΝΗΤΟ) =============
      if (Array.isArray(userAnnualPhases) && userAnnualPhases.length > 0) {
        hasAnnualPlan = true;
        console.log(`✅ Loaded ${userAnnualPhases.length} annual phases from user_annual_phases (manual)`);
        
        // Group by year
        const phasesByYear: Record<number, any[]> = {};
        userAnnualPhases.forEach((phase: any) => {
          if (!phasesByYear[phase.year]) phasesByYear[phase.year] = [];
          phasesByYear[phase.year].push(phase);
        });
        
        annualPlanningContext = '\n\n📅 ΕΤΗΣΙΟΣ ΠΡΟΠΟΝΗΤΙΚΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ ΧΡΗΣΤΗ (Χειροκίνητος):\n';
        
        Object.entries(phasesByYear)
          .sort(([a], [b]) => Number(b) - Number(a))
          .forEach(([year, phases]) => {
            annualPlanningContext += `\n  📆 Έτος ${year}:\n`;
            
            // Group by month
            const phasesByMonth: Record<number, any[]> = {};
            phases.forEach((phase: any) => {
              if (!phasesByMonth[phase.month]) phasesByMonth[phase.month] = [];
              phasesByMonth[phase.month].push(phase);
            });
            
            Object.entries(phasesByMonth)
              .sort(([a], [b]) => Number(a) - Number(b))
              .forEach(([month, monthPhases]) => {
                const isCurrentMonth = Number(year) === currentYear && Number(month) === currentMonth;
                const indicator = isCurrentMonth ? '👉 ' : '   ';
                const phaseLabels = monthPhases.map((p: any) => PHASE_LABELS[p.phase] || p.phase).join(', ');
                annualPlanningContext += `${indicator}${MONTH_NAMES[Number(month) - 1]}: ${phaseLabels}\n`;
              });
          });
        
        // Τρέχουσες φάσεις για τον τρέχοντα μήνα
        const currentPhases = userAnnualPhases.filter((p: any) => p.year === currentYear && p.month === currentMonth);
        if (currentPhases.length > 0) {
          const currentPhaseLabels = currentPhases.map((p: any) => PHASE_LABELS[p.phase] || p.phase).join(', ');
          annualPlanningContext += `\n  🎯 ΤΡΕΧΟΥΣΕΣ ΦΑΣΕΙΣ (${MONTH_NAMES[currentMonth - 1]} ${currentYear}): ${currentPhaseLabels}\n`;
        }
        
        // Φάσεις για τον ζητούμενο μήνα (αν ο χρήστης ρωτάει για συγκεκριμένο μήνα)
        annualPlanningContext += `\n  ℹ️ ΣΗΜΑΝΤΙΚΟ: Όταν ο χρήστης ζητάει πρόγραμμα για συγκεκριμένο μήνα, χρησιμοποίησε τις φάσεις αυτού του μήνα!\n`;
      }
      
      // ============= ΦΟΡΤΩΣΗ ΑΠΟ user_annual_planning (AI-GENERATED) =============
      if (Array.isArray(userAnnualPlanningData) && userAnnualPlanningData.length > 0) {
        const planning = userAnnualPlanningData[0];
        console.log(`✅ Loaded annual planning from user_annual_planning (AI-generated, year: ${planning.year})`);
        
        if (!hasAnnualPlan) {
          annualPlanningContext = '\n\n📅 ΕΤΗΣΙΟΣ ΠΡΟΠΟΝΗΤΙΚΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ ΧΡΗΣΤΗ:\n';
        } else {
          annualPlanningContext += '\n\n📅 ΕΠΙΠΛΕΟΝ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ (AI-Generated):\n';
        }
        hasAnnualPlan = true;
        
        annualPlanningContext += `📆 Έτος: ${planning.year}\n`;
        
        // ΜΗΝΙΑΙΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ (monthly_phases JSON array)
        if (planning.monthly_phases && Array.isArray(planning.monthly_phases)) {
          annualPlanningContext += '\n📊 ΜΗΝΙΑΙΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ:\n';
          
          const sortedMonthlyPhases = [...planning.monthly_phases].sort((a: any, b: any) => {
            if (a.month !== b.month) return a.month - b.month;
            return (a.week || 0) - (b.week || 0);
          });
          
          sortedMonthlyPhases.forEach((phase: any) => {
            const isCurrentMonth = planning.year === currentYear && phase.month === currentMonth;
            const indicator = isCurrentMonth ? '👉 ' : '   ';
            const phaseLabel = PHASE_LABELS[phase.phase] || phase.phase;
            const weekInfo = phase.week ? ` (Εβδ. ${phase.week})` : '';
            annualPlanningContext += `${indicator}${MONTH_NAMES[phase.month - 1]}${weekInfo}: ${phaseLabel}\n`;
          });
        }
        
        // ΕΒΔΟΜΑΔΙΑΙΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ (weekly_phases JSON array)
        if (planning.weekly_phases && Array.isArray(planning.weekly_phases) && planning.weekly_phases.length > 0) {
          annualPlanningContext += '\n📆 ΕΒΔΟΜΑΔΙΑΙΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ (με πραγματικές ημερομηνίες):\n';
          annualPlanningContext += '⚠️ ΚΡΙΣΙΜΟ: Όταν δημιουργείς πρόγραμμα, χρησιμοποίησε ΑΥΤΕΣ τις ημερομηνίες για training_dates!\n\n';
          
          const getDateFromWeekDay = (year: number, month: number, week: number, dayOfWeek: number): string => {
            const firstOfMonth = new Date(year, month - 1, 1);
            const firstDayOfWeek = firstOfMonth.getDay();
            const daysToMonday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
            const firstMonday = new Date(year, month - 1, 1 - daysToMonday);
            const targetDate = new Date(firstMonday);
            targetDate.setDate(firstMonday.getDate() + (week - 1) * 7 + (dayOfWeek - 1));
            return targetDate.toISOString().split('T')[0];
          };
          
          const sortedWeeklyPhases = [...planning.weekly_phases].sort((a: any, b: any) => {
            if (a.month !== b.month) return a.month - b.month;
            if (a.week !== b.week) return a.week - b.week;
            return (a.day || 0) - (b.day || 0);
          });
          
          const groupedByWeek: Record<string, any[]> = {};
          sortedWeeklyPhases.forEach((phase: any) => {
            const key = `${planning.year}-${String(phase.month).padStart(2, '0')}-W${phase.week}`;
            if (!groupedByWeek[key]) groupedByWeek[key] = [];
            groupedByWeek[key].push(phase);
          });
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const currentDateStr = today.toISOString().split('T')[0];
          
          let upcomingTrainingDates: string[] = [];
          
          Object.entries(groupedByWeek)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([weekKey, phases]) => {
              const daysInfo: string[] = [];
              phases.forEach((p: any) => {
                const actualDate = getDateFromWeekDay(planning.year, p.month, p.week, p.day);
                const phaseLabel = PHASE_LABELS[p.phase] || p.phase;
                const dayName = DAY_NAMES[p.day] || `Day${p.day}`;
                
                if (actualDate >= currentDateStr) {
                  upcomingTrainingDates.push(actualDate);
                }
                
                daysInfo.push(`    • ${dayName} ${actualDate}: ${phaseLabel}`);
              });
              
              if (daysInfo.length > 0) {
                annualPlanningContext += `  📅 ${weekKey}:\n${daysInfo.join('\n')}\n`;
              }
            });
          
          upcomingTrainingDates = [...new Set(upcomingTrainingDates)].sort();
          
          if (upcomingTrainingDates.length > 0) {
            annualPlanningContext += `\n🎯 ΕΠΟΜΕΝΕΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΕΝΕΣ ΗΜΕΡΟΜΗΝΙΕΣ ΠΡΟΠΟΝΗΣΗΣ:\n`;
            annualPlanningContext += `  ${upcomingTrainingDates.slice(0, 20).join(', ')}\n`;
            if (upcomingTrainingDates.length > 20) {
              annualPlanningContext += `  ... και ${upcomingTrainingDates.length - 20} ακόμη\n`;
            }
            annualPlanningContext += `\n⚠️ ΣΗΜΑΝΤΙΚΟ: Όταν ο χρήστης ζητάει να δημιουργήσεις πρόγραμμα ΧΩΡΙΣ να καθορίσει ημερομηνία:\n`;
            annualPlanningContext += `  - Χρησιμοποίησε ΑΥΤΕΣ τις ημερομηνίες από τον Εβδομαδιαίο Προγραμματισμό!\n`;
            annualPlanningContext += `  - Δηλαδή: training_dates: ["${upcomingTrainingDates.slice(0, 5).join('","')}"${upcomingTrainingDates.length > 5 ? ',...' : ''}"]\n`;
          }
        }
        
        if (planning.notes) {
          annualPlanningContext += `\n📝 Σημειώσεις: ${planning.notes}\n`;
        }
      }
      
      // ============= ΔΕΝ ΒΡΕΘΗΚΕ ΚΑΝΕΝΑ ANNUAL PLAN =============
      if (!hasAnnualPlan) {
        console.log(`⚠️ No annual planning found for user ${effectiveUserId} in any table`);
        annualPlanningContext = '\n\n⚠️ ΠΡΟΣΟΧΗ: Δεν βρέθηκε Ετήσιος/Μηνιαίος/Εβδομαδιαίος Προγραμματισμός για αυτόν τον χρήστη!\n';
        annualPlanningContext += 'Αν ο χρήστης ζητήσει πρόγραμμα βασισμένο στο annual plan, ενημέρωσέ τον ότι δεν υπάρχει προγραμματισμός.\n';
      }

    // Φόρτωση ΟΛΩΝ των assignments του χρήστη (ΧΩΡΙΣ status filter - όλων των χρόνων)
    const assignmentsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/program_assignments?user_id=eq.${effectiveUserId}&select=*`,
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
        `${SUPABASE_URL}/rest/v1/programs?id=in.(${programIds.join(',')})&select=id,name,description,training_days,program_weeks!fk_program_weeks_program_id(id,name,week_number,program_days!fk_program_days_week_id(id,name,day_number,estimated_duration_minutes,is_test_day,test_types,is_competition_day,program_blocks!fk_program_blocks_day_id(id,name,block_order,training_type,workout_format,workout_duration,program_exercises!fk_program_exercises_block_id(id,sets,reps,reps_mode,kg,kg_mode,percentage_1rm,velocity_ms,tempo,rest,notes,exercise_order,exercises!fk_program_exercises_exercise_id(id,name,description,video_url)))))`,
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
    
    // Φόρτωση ΟΛΩΝ των workout completions (χωρίς limit) για πλήρες ιστορικό
    const workoutCompletionsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/workout_completions?user_id=eq.${effectiveUserId}&order=scheduled_date.desc&select=*`,
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

    // 🏋️ Φόρτωση exercise_results για τα πραγματικά αποτελέσματα των ολοκληρωμένων προπονήσεων
    const completionIds = workoutCompletions.map((c: any) => c.id).filter(Boolean);
    let exerciseResults: any[] = [];
    if (completionIds.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < completionIds.length; i += batchSize) {
        const batchIds = completionIds.slice(i, i + batchSize);
        const exerciseResultsResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/exercise_results?workout_completion_id=in.(${batchIds.join(',')})&select=*`,
          {
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }
        );
        const batchData = await exerciseResultsResponse.json();
        if (Array.isArray(batchData)) exerciseResults.push(...batchData);
      }
      console.log('📊 Exercise Results loaded:', exerciseResults.length);
    }

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
    
    // Φόρτωση strength test sessions με nested attempts (για strengthHistory context)
    const strengthSessionsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/strength_test_sessions?user_id=eq.${effectiveUserId}&select=id,test_date,strength_test_attempts(id,weight_kg,velocity_ms,exercise_id,is_1rm,exercises(name))&order=test_date.desc&limit=20`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    strengthHistory = await strengthSessionsResponse.json();
    
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

    // 📋 ΠΛΗΡΕΣ ιστορικό ΟΛΩΝ των ολοκληρωμένων προπονήσεων (χωρίς limit)
    try {
      const completed = workoutCompletions
        .filter((c: any) => c.status === 'completed')
        .sort((a: any, b: any) => {
          const da = new Date(a.scheduled_date || a.completed_date || a.created_at).getTime();
          const db = new Date(b.scheduled_date || b.completed_date || b.created_at).getTime();
          return db - da;
        });
      // Χωρίς slice - φορτώνουμε ΟΛΕΣ τις ολοκληρωμένες προπονήσεις

      if (completed.length > 0 && Array.isArray(enrichedAssignments) && enrichedAssignments.length > 0) {
        workoutHistoryContext = `\n\n📋 ΟΛΕΣ ΟΙ ΟΛΟΚΛΗΡΩΜΕΝΕΣ ΠΡΟΠΟΝΗΣΕΙΣ (${completed.length} συνολικά, με πραγματικά αποτελέσματα):\n`;

        completed.forEach((completion: any) => {
          const assignment = enrichedAssignments.find((a: any) => a.id === completion.assignment_id);
          const program = assignment?.programs;
          const userName = assignment?.app_users?.name || userProfile?.name || '';

          const scheduledDate = completion.scheduled_date || completion.completed_date || '';

          // Βρες ποια ημέρα του προγράμματος αντιστοιχεί στο scheduledDate
          let dayProgram: any = null;
          if (assignment?.training_dates && program?.program_weeks?.[0]?.program_days?.length) {
            const idx = assignment.training_dates.findIndex((d: string) => d === completion.scheduled_date);
            const daysPerWeek = program.program_weeks[0].program_days.length;
            if (idx >= 0) {
              dayProgram = program.program_weeks[0].program_days[idx % daysPerWeek];
            }
          }

          workoutHistoryContext += `\n✅ ${userName}${program?.name ? ` - ${program.name}` : ''}\nΗμερομηνία: ${scheduledDate}\n${completion.rpe_score ? `RPE: ${completion.rpe_score}\n` : ''}`;

          if (!dayProgram) {
            workoutHistoryContext += `⚠️ Δεν βρέθηκε το day template για αυτή την ημερομηνία\n`;
            return;
          }

          workoutHistoryContext += `Ημέρα: ${dayProgram.name || `Day ${dayProgram.day_number}`}\n`;

          (dayProgram.program_blocks || []).forEach((block: any) => {
            workoutHistoryContext += `  🔹 ${block.name}${block.training_type ? ` (${block.training_type})` : ''}\n`;
            (block.program_exercises || []).forEach((pe: any) => {
              const exName = pe.exercises?.name || 'Άγνωστη άσκηση';

              let line = `    • ${exName}: ${pe.sets || '?'}x${pe.reps || '?'}`;
              if (pe.kg) line += ` @ ${pe.kg}kg`;
              if (pe.percentage_1rm) line += ` (${pe.percentage_1rm}%1RM)`;
              if (pe.velocity_ms) line += ` @ ${pe.velocity_ms}m/s`;
              if (pe.tempo) line += ` tempo ${pe.tempo}`;
              if (pe.rest) line += ` rest ${pe.rest}s`;
              if (pe.notes) line += ` [${pe.notes}]`;

              const result = exerciseResults.find((er: any) => er.workout_completion_id === completion.id && er.program_exercise_id === pe.id);
              if (result) {
                const actualParts: string[] = [];
                if (result.actual_sets) actualParts.push(`${result.actual_sets} sets`);
                if (result.actual_reps) actualParts.push(`${result.actual_reps} reps`);
                if (result.actual_kg) actualParts.push(`${result.actual_kg}kg`);
                if (result.actual_velocity_ms) actualParts.push(`${result.actual_velocity_ms}m/s`);
                if (result.actual_rest) actualParts.push(`rest ${result.actual_rest}s`);
                if (actualParts.length > 0) {
                  line += `\n      ➜ ΠΡΑΓΜΑΤΙΚΑ: ${actualParts.join(', ')}`;
                }
                if (result.notes) line += ` [${result.notes}]`;
              }

              workoutHistoryContext += line + `\n`;
            });
          });
        });

        workoutHistoryContext += `\n\n🎯 ΟΔΗΓΙΑ: Αν ο χρήστης ζητήσει «αντέγραψε την τελευταία προπόνηση και κάν'την assign σήμερα», χρησιμοποίησε την ΠΙΟ ΠΡΟΣΦΑΤΗ ολοκληρωμένη προπόνηση από το section παραπάνω (χωρίς να ζητήσεις να σου δώσουν τα στοιχεία).`;
      }
    } catch (e) {
      console.error('⚠️ workoutHistoryContext build error:', e);
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
          let enduranceData: any[] = [];
          try {
            const enduranceResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/endurance_test_data?select=id,created_at,vo2_max,mas_kmh,sprint_watt,push_ups,pull_ups,crunches,t2b,endurance_test_sessions!inner(user_id,test_date)&endurance_test_sessions.user_id=eq.${user.id}&order=created_at.desc&limit=5`,
              {
                headers: {
                  "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
              }
            );
            if (enduranceResponse.ok) {
              enduranceData = await enduranceResponse.json();
            } else {
              console.log(`⚠️ Endurance response not OK for ${user.name}: ${enduranceResponse.status}`);
            }
          } catch (e) {
            console.log(`⚠️ Error loading endurance data for ${user.name}:`, e);
          }
          
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
          let jumpData: any[] = [];
          try {
            const jumpResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/jump_test_data?select=id,created_at,counter_movement_jump,non_counter_movement_jump,broad_jump,triple_jump_left,triple_jump_right,jump_test_sessions!inner(user_id,test_date)&jump_test_sessions.user_id=eq.${user.id}&order=created_at.desc&limit=5`,
              {
                headers: {
                  "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
              }
            );
            if (jumpResponse.ok) {
              jumpData = await jumpResponse.json();
            } else {
              console.log(`⚠️ Jump response not OK for ${user.name}: ${jumpResponse.status}`);
            }
          } catch (e) {
            console.log(`⚠️ Error loading jump data for ${user.name}:`, e);
          }
          
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
          let anthropometricData: any[] = [];
          try {
            const anthropometricResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/anthropometric_test_data?select=id,created_at,height,weight,body_fat_percentage,muscle_mass_percentage,waist_circumference,anthropometric_test_sessions!inner(user_id,test_date)&anthropometric_test_sessions.user_id=eq.${user.id}&order=created_at.desc&limit=5`,
              {
                headers: {
                  "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
              }
            );
            if (anthropometricResponse.ok) {
              anthropometricData = await anthropometricResponse.json();
            } else {
              console.log(`⚠️ Anthropometric response not OK for ${user.name}: ${anthropometricResponse.status}`);
            }
          } catch (e) {
            console.log(`⚠️ Error loading anthropometric data for ${user.name}:`, e);
          }
          
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
          let functionalData: any[] = [];
          try {
            const functionalResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/functional_test_data?select=id,created_at,fms_score,fms_detailed_scores,posture_issues,squat_issues,single_leg_squat_issues,muscles_need_strengthening,muscles_need_stretching,sit_and_reach,shoulder_mobility_left,shoulder_mobility_right,flamingo_balance,functional_test_sessions!inner(user_id,test_date)&functional_test_sessions.user_id=eq.${user.id}&order=created_at.desc&limit=5`,
              {
                headers: {
                  "apikey": SUPABASE_SERVICE_ROLE_KEY!,
                  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
              }
            );
            if (functionalResponse.ok) {
              functionalData = await functionalResponse.json();
            } else {
              console.log(`⚠️ Functional response not OK for ${user.name}: ${functionalResponse.status}`);
            }
          } catch (e) {
            console.log(`⚠️ Error loading functional data for ${user.name}:`, e);
          }
          
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
✅ 🏋️ COACH DATA: Αθλητές coach (coach_users) και συνδρομές coach (coach_subscriptions)
✅ 💸 GLOBAL ΛΙΣΤΑ ΑΠΛΗΡΩΤΩΝ συνδρομών με ονόματα και subscription_id

⚠️ ΚΡΙΤΙΚΟ ΓΙΑ ΑΝΑΘΕΣΕΙΣ (ASSIGNMENTS) ΣΕ ADMIN MODE:
- Όταν ο χρήστης λέει «βρες την προπόνηση του Α και ανάθεσέ την στον Β», τότε:
  1) Ο Α είναι η ΠΗΓΗ (source) της προπόνησης (από ποιον/ποιανού προπόνηση διαβάζεις)
  2) Ο Β είναι ο ΠΑΡΑΛΗΠΤΗΣ (recipient) που θα πάρει την ανάθεση
- Στο 
  \`\`\`ai-action
  {"action":"create_program", ...}
  \`\`\`
  τα πεδία user_id / user_ids / group_id αφορούν ΠΑΝΤΑ τον/τους ΠΑΡΑΛΗΠΤΗ/ΠΑΡΑΛΗΠΤΕΣ.
- ΠΟΤΕ μην βάζεις user_id = το δικό σου (του admin) εκτός αν ο χρήστης πει ρητά «ανάθεσέ το σε μένα».
- Για να μην γίνεται λάθος σε κοινά επώνυμα/παρόμοια ονόματα:
  ✅ ΠΑΝΤΑ χρησιμοποίησε το ΑΚΡΙΒΕΣ UUID id από το section «👥 ΛΙΣΤΑ ΧΡΗΣΤΩΝ» (όχι σκέτο όνομα).
  ❌ Αν υπάρχουν 2 πιθανοί χρήστες που ταιριάζουν, ΡΩΤΑ διευκρίνιση και ΜΗΝ μαντεύεις.

ΣΗΜΑΝΤΙΚΟ ΓΙΑ ΔΕΔΟΜΕΝΑ ΠΡΟΟΔΟΥ:
Στο context παρακάτω υπάρχει section με τίτλο "📊 ΠΡΟΟΔΟΣ ΑΘΛΗΤΩΝ (Athletes Progress Dashboard)" που περιέχει:
- Τις πιο πρόσφατες μετρήσεις κάθε αθλητή (ανθρωπομετρικά, αντοχή, άλματα)
- Ποσοστά μεταβολής σε σχέση με προηγούμενες μετρήσεις
- Ημερομηνίες κάθε μέτρησης

ΣΗΜΑΝΤΙΚΟ ΓΙΑ ΑΠΛΗΡΩΤΕΣ ΣΥΝΔΡΟΜΕΣ (ADMIN):
1. ✅ Για ερώτηση τύπου "ποιες συνδρομές είναι απλήρωτες", χρησιμοποιείς ΑΠΕΥΘΕΙΑΣ το section "🚨 ΑΝΑΛΥΤΙΚΗ ΛΙΣΤΑ ΑΠΛΗΡΩΤΩΝ ΣΥΝΔΡΟΜΩΝ (GLOBAL)"
2. ✅ Αν η λίστα είναι κενή, απαντάς ξεκάθαρα: "Δεν υπάρχουν απλήρωτες συνδρομές αυτή τη στιγμή"
3. ❌ ΠΟΤΕ μην ζητάς όνομα χρήστη για global unpaid list όταν είσαι σε admin mode
4. ❌ ΠΟΤΕ μην λες ότι "δεν έχεις πρόσβαση" ή "δεν μπορείς να φιλτράρεις" σε admin mode

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
- 📊 ΠΡΟΟΔΟΣ ΑΘΛΗΤΩΝ με τεστ αντοχής, ανθρωπομετρικά, άλματα
- 🏋️ ΑΘΛΗΤΕΣ COACH με κατάσταση συνδρομής κάθε αθλητή
- 💳 ΣΥΝΔΡΟΜΕΣ COACH με λίστα ενεργών, απλήρωτων, σε παύση συνδρομών` : isCoach && !targetUserId ? `

🏋️ ΛΕΙΤΟΥΡΓΙΑ COACH MODE 🏋️
Είσαι σε COACH MODE και έχεις πρόσβαση στα δεδομένα των αθλητών σου!

COACH DATA - Έχεις πρόσβαση σε:
✅ Λίστα των αθλητών σου (coach_users)
✅ Συνδρομές των αθλητών σου (coach_subscriptions)
✅ Κατάσταση κάθε αθλητή (ενεργός, ανενεργός, απλήρωτη, σε παύση)
✅ Πρόοδο αθλητών (tests, 1RM, σωματομετρικά)
✅ Προγράμματα αθλητών

ΣΗΜΑΝΤΙΚΟ: Μπορείς να απαντήσεις ερωτήσεις όπως:
- "Πόσους αθλητές έχω;"
- "Ποιοι αθλητές έχουν απλήρωτες συνδρομές;"
- "Ποιος έχει το μεγαλύτερο άλμα;"
- "Πως πάει ο Γιώργος στα βάρη;"

Το context που έχεις περιλαμβάνει:
- 🏋️ ΑΘΛΗΤΕΣ COACH με κατάσταση συνδρομής
- 💳 ΣΥΝΔΡΟΜΕΣ COACH με οικονομικά στοιχεία
- 📊 ΠΡΟΟΔΟΣ ΑΘΛΗΤΩΝ COACH με αναλυτικά αποτελέσματα τεστ (Force/Velocity, Endurance, Jump, Anthropometric, 1RM)` : isFederation && !targetUserId ? `

🏛️ ΛΕΙΤΟΥΡΓΙΑ FEDERATION MODE 🏛️
Είσαι σε FEDERATION MODE και έχεις τον ρόλο του ΣΥΝΤΟΝΙΣΤΗ/ΟΡΓΑΝΩΤΗ!

⚠️ ΣΗΜΑΝΤΙΚΟ: ΔΕΝ είσαι προπονητής ή διατροφολόγος σε αυτό το mode.
Είσαι ΟΡΓΑΝΩΤΙΚΟΣ ΒΟΗΘΟΣ της ομοσπονδίας. Απαντάς με επαγγελματικό, οργανωτικό ύφος.
Βοηθάς με: διοργάνωση αγώνων, κλήρωση/ζευγαρώματα, live streaming, ranking, διαχείριση συλλόγων, συνδρομές, στατιστικά.

FEDERATION DATA - Έχεις πρόσβαση σε:
✅ Λίστα συνδεδεμένων συλλόγων (coaches)
✅ Λίστα αθλητών ανά σύλλογο
✅ Αποτελέσματα τεστ (δύναμη, αντοχή, άλματα, σωματομετρικά) για ΟΛΟΥΣ τους αθλητές
✅ 1RM δεδομένα αθλητών
✅ Συνδρομές της ομοσπονδίας (δικοί της τύποι, κατάσταση, πληρωμές)
✅ Αποδείξεις της ομοσπονδίας (ποσά, ημερομηνίες, σωματεία)
✅ 🏆 ΑΓΩΝΕΣ ομοσπονδίας (ημερομηνίες, κατηγορίες, δηλώσεις, αποτελέσματα)
✅ 🏅 RANKING αθλητών (πόντοι, μετάλλια, κατάταξη ανά κατηγορία)
✅ 🥊 ΖΕΥΓΑΡΩΜΑΤΑ/BRACKETS (κλήρωση, αγώνες, νικητές, γύροι)
✅ 📺 LIVE RINGS (ρινγκ, YouTube streams, τρέχοντες αγώνες)

ΣΗΜΑΝΤΙΚΟ: Μπορείς να απαντήσεις ερωτήσεις όπως:
- "Πόσους συλλόγους έχω;"
- "Πόσους αθλητές έχει ο ΑΟ Αθηνών;"
- "Ποιος αθλητής έχει το καλύτερο VO2max;"
- "Δείξε μου τα αποτελέσματα του Παπαδόπουλου"
- "Πόσες ενεργές συνδρομές έχω;"
- "Ποιες συνδρομές είναι απλήρωτες;"
- "Σύνοψη εσόδων/εξόδων"
- "Ποιοι αγώνες μετράνε για ranking;"
- "Ποιος είναι πρώτος στο ranking;"
- "Ποιοι είναι τα ζευγαρώματα στην κατηγορία Χ;"
- "Ποιος κέρδισε στον αγώνα #5;"
- "Πόσα rings έχει η διοργάνωση;"
- "Ποιος αγωνίζεται τώρα στο ring 1;"

Το context που έχεις περιλαμβάνει:
- 🏛️ ΟΜΟΣΠΟΝΔΙΑ - ΔΕΔΟΜΕΝΑ με λίστα συλλόγων, αθλητών και αναλυτικά τεστ
- 💳 ΣΥΝΔΡΟΜΕΣ ΟΜΟΣΠΟΝΔΙΑΣ με στατιστικά, οικονομικά και λίστα
- 🧾 ΑΠΟΔΕΙΞΕΙΣ ΟΜΟΣΠΟΝΔΙΑΣ με ποσά και λεπτομέρειες
- 🏆 ΑΓΩΝΕΣ ΟΜΟΣΠΟΝΔΙΑΣ με κατηγορίες, δηλώσεις και αποτελέσματα
- 🏅 RANKING αθλητών με πόντους και μετάλλια
- 🥊 ΖΕΥΓΑΡΩΜΑΤΑ/BRACKETS με γύρους, νικητές και αποτελέσματα
- 📺 LIVE RINGS με κατάσταση streaming` : ` Έχεις πρόσβαση στα προγράμματα, τις ασκήσεις, ΟΛΟ το ημερολόγιο και ΟΛΑ τα αποτελέσματα προπόνησης (workout completions + exercise results) του χρήστη.`}

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
      
${userProfile.name ? `\n\nΜιλάς με: ${userProfile.name}` : ''}${userProfile.created_at ? `\nΗμ/νία εγγραφής: ${new Date(userProfile.created_at).toLocaleDateString('el-GR')}` : ''}${userProfile.birth_date ? `\nΗλικία: ${new Date().getFullYear() - new Date(userProfile.birth_date).getFullYear()} ετών` : ''}${(userProfile as any).subscriptionContext || ''}${exerciseContext}${programContext}${calendarContext}${workoutStatsContext}${workoutHistoryContext}${enduranceContext}${jumpContext}${anthropometricContext}${functionalContext}${availableAthletesContext}${oneRMContext}${athletesProgressContext}${todayProgramContext}${allDaysContext}${overviewStatsContext}${adminActiveProgramsContext}${adminProgressContext}${adminAllUsersContext}${adminProgramsMenuContext}${adminAnnualPlanningContext}${phaseConfigContext}${annualPlanningContext}${coachAthletesContext}${coachSubscriptionsContext}${coachProgressContext}${federationContext}${federationSubscriptionsContext}${federationReceiptsContext}${federationCompetitionsContext}${userContext ? `

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

🔴🔴🔴 ΚΑΝΟΝΑΣ #5 - ΔΟΜΗ ΠΡΟΓΡΑΜΜΑΤΩΝ ΑΝΑΛΟΓΑ ΜΕ ΗΜΕΡΕΣ/ΕΒΔΟΜΑΔΑ (ΥΠΟΧΡΕΩΤΙΚΟ) 🔴🔴🔴

ΔΙΑΒΑΣΕ ΜΕ ΠΡΟΣΟΧΗ! Όταν δημιουργείς πρόγραμμα, ΠΡΕΠΕΙ να ακολουθήσεις τη ΣΩΣΤΗ δομή:

⛔ ΣΗΜΑΝΤΙΚΟ - ΑΠΑΓΟΡΕΥΕΤΑΙ: ΜΗΝ αποκαλύπτεις ΠΟΤΕ τη δομή/μεθοδολογία του προγράμματος στον χρήστη!
- ΜΗΝ γράφεις "Δομή προγράμματος: Upper/Lower Split" ή παρόμοια
- ΜΗΝ εξηγείς τη λογική push/pull, horizontal/vertical κλπ
- ΜΗΝ αναφέρεις τα blocks και τη σύνθεσή τους
- ΑΠΛΑ δημιούργησε το πρόγραμμα χωρίς να εξηγήσεις ΠΩΣ το έφτιαξες
- Η δομή είναι ΕΣΩΤΕΡΙΚΗ ΓΝΩΣΗ, όχι για τον χρήστη!

📌 1 ΗΜΕΡΑ/ΕΒΔΟΜΑΔΑ = Total Body
- 3 blocks: STR (lower push/upper pull/core) + END (lower pull/upper push/core) + ACC
- Μία μέρα που δουλεύει ΟΛΟ το σώμα

📌 2 ΗΜΕΡΕΣ/ΕΒΔΟΜΑΔΑ = Push/Pull Alternation  
- Μέρα 1 STR: upper PUSH + lower PULL → Μέρα 2 STR: upper PULL + lower PUSH
- Μέρα 1 END: upper PULL + lower PUSH → Μέρα 2 END: upper PUSH + lower PULL
- ΤΟ ΙΔΙΟ set x reps schema και στις 2 μέρες!

📌 3 ΗΜΕΡΕΣ/ΕΒΔΟΜΑΔΑ = 3 επιλογές:
- Επιλογή A: Day1=Upper Push/Lower Pull, Day2=Upper Pull/Lower Push, Day3=Total Body
- Επιλογή B: Day1=Upper, Day2=Lower, Day3=Total Body
- Επιλογή C: Alternating εβδομάδες (W1: U-L-U, W2: L-U-L, κλπ)

📌 4 ΗΜΕΡΕΣ/ΕΒΔΟΜΑΔΑ = 2 επιλογές:
- Επιλογή A (Upper/Lower Split): 2 Upper + 2 Lower
  * Day1: Upper (horizontal push + vertical pull)
  * Day2: Lower (push bilateral + pull unilateral)  
  * Day3: Upper (vertical push + horizontal pull)
  * Day4: Lower (pull bilateral + push unilateral)
  
- Επιλογή B (Mixed Split):
  * Day1: Upper push horizontal + Lower pull hip + Accessory
  * Day2: Lower push knee + Upper pull vertical + Accessory
  * Day3: Upper push vertical + Lower pull knee + Accessory
  * Day4: Lower push bilateral + Core + Cardio

⚠️ ΣΗΜΑΝΤΙΚΟ: Κάθε block ΠΡΕΠΕΙ να έχει: 1 lower + 1 upper + 1 core
⚠️ Push/Pull εναλλάσσονται: αν lower=push τότε upper=pull (και αντίστροφα)
⚠️ ΑΚΟΛΟΥΘΑ ΤΑ ΑΝΑΛΥΤΙΚΑ ΠΑΡΑΔΕΙΓΜΑΤΑ ΣΤΟ ΤΕΛΟΣ ΤΟΥ PROMPT!

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

🎯 FEATURE #22 - EXOS EXERCISE SELECTION FRAMEWORK:
Χρησιμοποίησε το EXOS framework για έξυπνη επιλογή ασκήσεων βάσει φάσης και τύπου:

📌 LOADING STRATEGIES (από Mechanical → Metabolic Stress):
1. Supra Maximal Eccentrics (110-115% 1RM) - Μέγιστο mechanical stress
2. Maximal Loads & Speed (95-100% 1RM)
3. Clusters (intra-rep rest 15-30s) - π.χ. 2 reps + 10s + 1 rep @ 90%
4. Accommodating Resistance - Chains (Strength), Bands (Power), Air (Both)
5. High Intensity Training (HIT) - Strength + HIT sets = ↑↑ anabolic hormones
6. Strip Sets (intra-set load variations) - Max→80→60→40
7. Drop Sets - Συνεχόμενα σετ με μειωμένο φορτίο
8. Timed Sets - Reps per time interval - Μέγιστο metabolic stress

📌 STRENGTH QUALITIES MATRIX - Επιλογή τύπου προπόνησης ανά φάση:
| Exercise Type       | Foundational      | Hypertrophy              | Strength  | Power          |
|---------------------|-------------------|--------------------------|-----------|----------------|
| Total Body Power    | Foundational      | Foundational Hypertrophy | Power     | Strength Speed |
| Primary/Secondary   | Foundational      | Functional Hypertrophy   | Strength  | Speed Strength |
| Rotational          | Foundational      | Non-Functional Hypertrophy| Power    | Speed Strength |
| Auxiliary           | Foundational      | Non-Functional Hypertrophy| Func.Hyp | Func.Hyp       |

📌 PHASE → QUALITY MAPPING:
- Corrective, Stabilization, Movement Skills → Foundational
- Non-Functional/Functional Hypertrophy → Hypertrophy  
- Starting/Explosive/Reactive Strength → Strength
- Str/Spd, Power, Spd/Str, Speed → Power
- Str-End → Hypertrophy (metabolic focus)
- Pwr-End → Strength (power endurance)
- Spd-End → Power (speed endurance)

📌 ΚΑΝΟΝΕΣ ΕΠΙΛΟΓΗΣ ΑΣΚΗΣΕΩΝ:
1. Βρες τη ΦΑΣΗ του αθλητή (π.χ. Functional Hypertrophy)
2. Αντιστοίχισε σε QUALITY (Hypertrophy)
3. Για κάθε ΤΥΠΟ άσκησης, χρησιμοποίησε τον πίνακα:
   - Total Body Power → Foundational Hypertrophy
   - Primary/Secondary → Functional Hypertrophy
   - Rotational → Non-Functional Hypertrophy
   - Auxiliary → Non-Functional Hypertrophy
4. Επέλεξε κατάλληλη LOADING STRATEGY βάσει stress που θέλεις

📌 ΠΑΡΑΔΕΙΓΜΑ:
Φάση: Power → Quality: Power
- Total Body Power exercises: Strength Speed focus → Explosive, velocity-based
- Primary/Secondary: Speed Strength → Sub-max loads, max speed
- Rotational: Speed Strength → Medicine ball throws, rotational plyos
- Auxiliary: Functional Hypertrophy → Moderate load, controlled tempo

Όταν προτείνεις πρόγραμμα ή ασκήσεις, ΠΑΝΤΑ λαμβάνεις υπόψη:
- Τη ΦΑΣΗ που βρίσκεται ο αθλητής
- Τον ΤΥΠΟ της άσκησης
- Το επιθυμητό STRESS (mechanical vs metabolic)
- Την κατάλληλη LOADING STRATEGY

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

💳 ΔΥΝΑΤΟΤΗΤΑ ΔΙΑΧΕΙΡΙΣΗΣ ΣΥΝΔΡΟΜΩΝ:
Μπορείς να δημιουργείς, παύεις, επαναφέρεις και ανανεώνεις συνδρομές!

ΔΙΑΘΕΣΙΜΟΙ ΤΥΠΟΙ ΣΥΝΔΡΟΜΩΝ:
- HYPERATHLETES (1μ): ef18bb03-4981-4a8e-a02c-62f19e9e5a6f - €70
- HYPERATHLETES (3μ): 5f7f13a1-70ea-445a-a819-edb8020a6f15 - €210
- HYPERATHLETES (12μ): 7d2f00cd-56ec-45a2-9d9c-82ce9b767fcd - €650
- HYPERGYM (1μ): 7f3a1c02-437d-4b24-93bb-3a6676870d49 - €120
- HYPERGYM (12μ): 643e51f3-2837-400d-ae89-a0e8e13ec988 - €750
- HYPERGYM 25% (1μ): a6a27586-bc1e-446a-b276-779b6c3b95c0 - €90
- HYPERKIDS (1μ): 9c90c778-bcb2-4b46-9aaf-402e8deb9d85 - €60
- HYPERsync (12μ): 9c46ca26-9837-4eb8-8ced-11e25ecf8388 - €690
- 1 επίσκεψη: f5220303-1181-4e76-b4e0-eab1ddde1085 - €15
- Personal training: b1b801de-b274-4e45-983d-d0829f10868f - €25
- Videocall Session: 0d66f626-6584-46d2-ae46-0bbcc4c6b38b - €25

ΠΑΡΑΔΕΙΓΜΑ - Δημιουργία συνδρομής:
\`\`\`ai-action
{"action":"create_subscription","user_id":"Γιάννης","subscription_type_id":"ef18bb03-4981-4a8e-a02c-62f19e9e5a6f","subscription_type_name":"HYPERATHLETES","start_date":"2026-03-03"}
\`\`\`

ΠΑΡΑΔΕΙΓΜΑ - Παύση συνδρομής (χρειάζεται subscription_id από τα δεδομένα):
\`\`\`ai-action
{"action":"pause_subscription","subscription_id":"uuid-here","table":"user_subscriptions","user_name":"Γιάννης"}
\`\`\`

ΠΑΡΑΔΕΙΓΜΑ - Επαναφορά συνδρομής:
\`\`\`ai-action
{"action":"resume_subscription","subscription_id":"uuid-here","table":"user_subscriptions","user_name":"Γιάννης"}
\`\`\`

ΠΑΡΑΔΕΙΓΜΑ - Ανανέωση συνδρομής:
\`\`\`ai-action
{"action":"renew_subscription","subscription_id":"uuid-here","table":"user_subscriptions","user_name":"Γιάννης"}
\`\`\`

ΠΑΡΑΔΕΙΓΜΑ - Αλλαγή ημερομηνίας λήξης:
\`\`\`ai-action
{"action":"update_subscription_end_date","subscription_id":"uuid-here","new_end_date":"2026-06-30","table":"user_subscriptions","user_name":"Γιάννης"}
\`\`\`

ΠΑΡΑΔΕΙΓΜΑ - Σήμανση ως πληρωμένη:
\`\`\`ai-action
{"action":"toggle_payment","subscription_id":"uuid-here","is_paid":true,"table":"user_subscriptions","user_name":"Γιάννης"}
\`\`\`

ΠΑΡΑΔΕΙΓΜΑ - Σήμανση ως απλήρωτη:
\`\`\`ai-action
{"action":"toggle_payment","subscription_id":"uuid-here","is_paid":false,"table":"user_subscriptions","user_name":"Γιάννης"}
\`\`\`

👁️ ΔΥΝΑΤΟΤΗΤΑ ΚΑΤΑΓΡΑΦΗΣ ΠΑΡΟΥΣΙΑΣ:
Μπορείς να καταγράφεις επισκέψεις/παρουσίες χρηστών!

ΠΑΡΑΔΕΙΓΜΑ - Καταγραφή παρουσίας:
\`\`\`ai-action
{"action":"record_visit","user_id":"Γιάννης","visit_type":"manual","notes":"Παρουσία από AI","user_name":"Γιάννης"}
\`\`\`

🏷️ ΔΥΝΑΤΟΤΗΤΑ ΑΛΛΑΓΗΣ ΤΜΗΜΑΤΟΣ:
Μπορείς να αλλάξεις τμήμα σε χρήστη!

ΔΙΑΘΕΣΙΜΑ ΤΜΗΜΑΤΑ (section_id):
- Open Gym: c7cf36ab-47be-4727-94b7-dfbd25bb1d95
- Small Group: bf6b085e-5dd4-4b31-969f-d3e3316e4e7a
- Muay Thai 10+: e5001894-cccd-4c09-8fe8-d120c59a0727
- Muay Thai αγωνιστικό: a51af86a-9a92-4479-8ee1-d16aa8a58819
- Sport Support 10+: 65b64d67-aac4-4c82-8aff-81f50eff2fff
- HYPERKIDS 7-10: ba89af8c-1990-45b3-8ab2-bacef14cacc5
- HYPERKIDS 4-7: 5d4f36ef-cca6-4090-8b79-748b19de19c1
- Muay Thai hybrid: 83b57acf-5997-43b2-8aed-c45d0efc1171
- Βιντεοκλήσεις: 2c1198ed-baad-4d68-b1ed-fd00fa5a68d8

ΠΑΡΑΔΕΙΓΜΑ - Αλλαγή τμήματος:
\`\`\`ai-action
{"action":"update_user_section","user_id":"Γιάννης","section_id":"c7cf36ab-47be-4727-94b7-dfbd25bb1d95","section_name":"Open Gym","user_name":"Γιάννης"}
\`\`\`

📄 ΔΥΝΑΤΟΤΗΤΑ ΕΠΙΒΕΒΑΙΩΣΗΣ MARK ΑΠΟΔΕΙΞΗΣ:
Μπορείς να επιβεβαιώσεις ότι μια απόδειξη πήρε mark!

ΠΑΡΑΔΕΙΓΜΑ - Επιβεβαίωση mark:
\`\`\`ai-action
{"action":"confirm_receipt_mark","receipt_id":"uuid-here","mark":"400001234567890","receipt_number":"RCP-001","table":"receipts"}
\`\`\`

📅 ΔΥΝΑΤΟΤΗΤΑ ΔΙΑΧΕΙΡΙΣΗΣ ΚΡΑΤΗΣΕΩΝ:
Μπορείς να δημιουργείς και να ακυρώνεις κρατήσεις!

ΔΙΑΘΕΣΙΜΑ ΤΜΗΜΑΤΑ:
- Open Gym: c7cf36ab-47be-4727-94b7-dfbd25bb1d95
- Small Group: bf6b085e-5dd4-4b31-969f-d3e3316e4e7a
- Muay Thai 10+: e5001894-cccd-4c09-8fe8-d120c59a0727
- Muay Thai αγωνιστικό: a51af86a-9a92-4479-8ee1-d16aa8a58819
- Sport Support 10+: 65b64d67-aac4-4c82-8aff-81f50eff2fff
- HYPERKIDS 7-10: ba89af8c-1990-45b3-8ab2-bacef14cacc5
- HYPERKIDS 4-7: 5d4f36ef-cca6-4090-8b79-748b19de19c1
- Muay Thai hybrid: 83b57acf-5997-43b2-8aed-c45d0efc1171
- Βιντεοκλήσεις: 2c1198ed-baad-4d68-b1ed-fd00fa5a68d8

ΠΑΡΑΔΕΙΓΜΑ - Δημιουργία κράτησης:
\`\`\`ai-action
{"action":"create_booking","user_id":"Γιάννης","section_id":"c7cf36ab-47be-4727-94b7-dfbd25bb1d95","section_name":"Open Gym","booking_date":"2026-03-05","booking_time":"10:00","booking_type":"gym_visit"}
\`\`\`

ΠΑΡΑΔΕΙΓΜΑ - Ακύρωση κράτησης:
\`\`\`ai-action
{"action":"cancel_booking","booking_id":"uuid-here"}
\`\`\`

⚠️ ΣΗΜΑΝΤΙΚΟ: Ο χρήστης θα πρέπει ΠΑΝΤΑ να επιβεβαιώσει κάθε ενέργεια πριν εκτελεστεί!
Όταν θέλεις να εκτελέσεις ενέργεια, ΠΑΝΤΑ εξήγησε στον χρήστη ΤΙ θα κάνεις πριν βάλεις το ai-action block.

🏋️ ΔΥΝΑΤΟΤΗΤΑ ΔΗΜΙΟΥΡΓΙΑΣ & ΑΝΑΘΕΣΗΣ ΠΡΟΓΡΑΜΜΑΤΩΝ:
${isAdmin ? `
🔴 ADMIN MODE - ΠΛΗΡΗΣ ΕΛΕΓΧΟΣ ΑΝΑΘΕΣΕΩΝ:
Ως admin, μπορείς να δημιουργείς ΚΑΙ να αναθέτεις προγράμματα σε:
- ΟΠΟΙΟΝΔΗΠΟΤΕ μεμονωμένο χρήστη (με όνομα ή email)
- ΠΟΛΛΑΠΛΟΥΣ χρήστες ταυτόχρονα
- ΟΜΑΔΕΣ χρηστών

⚠️⚠️⚠️ ΚΡΙΣΙΜΟ ΓΙΑ ΑΝΑΘΕΣΕΙΣ - ΔΙΑΒΑΣΕ ΠΡΟΣΕΚΤΙΚΑ:

📌 ΚΑΝΟΝΑΣ #1 - ΠΟΙΟΣ ΛΑΜΒΑΝΕΙ ΤΟ ΠΡΟΓΡΑΜΜΑ:
- Όταν ο χρήστης λέει "ανέθεσε στον [ΟΝΟΜΑ]" ή "δώσε στον [ΟΝΟΜΑ]" → user_id = "[ΟΝΟΜΑ]"
- Όταν λέει "αντέγραψε το πρόγραμμα του Α και δώστο στον Β" → user_id = "Β" (ΟΧΙ ο Α!)
- Όταν λέει "κάνε assign στους Α, Β, Γ" → user_ids = ["Α", "Β", "Γ"]
- Όταν λέει "στην ομάδα [ΟΝΟΜΑ]" → group_id = "[ΟΝΟΜΑ ΟΜΑΔΑΣ]"
- ΑΝ ΔΕΝ ΑΝΑΦΕΡΕΙ σε ποιον → ΡΩΤΑ! "Σε ποιον θέλεις να αναθέσω το πρόγραμμα;"

📌 ΚΑΝΟΝΑΣ #2 - ΕΝΑ ή ΠΟΛΛΑ ΑΤΟΜΑ:
- ΓΙΑ ΕΝΑ ΑΤΟΜΟ: "user_id": "[ΟΝΟΜΑ]"
- ΓΙΑ ΠΟΛΛΑ ΑΤΟΜΑ: "user_ids": ["ΟΝΟΜΑ1", "ΟΝΟΜΑ2", "ΟΝΟΜΑ3"]
- ΓΙΑ ΟΜΑΔΑ: "group_id": "[ΟΝΟΜΑ ΟΜΑΔΑΣ]"

📌 ΚΑΝΟΝΑΣ #3 - ΑΝΤΙΓΡΑΦΗ ΠΡΟΠΟΝΗΣΗΣ ΑΠΟ ΑΛΛΟΝ:
Αν ο χρήστης ζητήσει να αντιγράψεις την προπόνηση του Α και να την δώσεις στον Β:
1. Βρες την προπόνηση του Α (από το ιστορικό που έχεις)
2. Δημιούργησε ΝΕΟΜ πρόγραμμα με τις ίδιες ασκήσεις
3. Ανέθεσε το στον Β (user_id = "Β")
4. ΟΧΙ στον Α! Αυτός ήδη το έχει!

ΠΑΡΑΔΕΙΓΜΑ - Αντιγραφή και ανάθεση σε ΑΛΛΟΝ:
Χρήστης: "Αντέγραψε την τελευταία προπόνηση του Κυριάκου και δώστη στον Γιάννη"
→ Βρίσκεις την προπόνηση του Κυριάκου
→ Δημιουργείς ΝΕΟΜ πρόγραμμα με αυτές τις ασκήσεις
→ user_id = "Γιάννης" (ΟΧΙ Κυριάκος!)

${exerciseDatabaseContext}

⚠️⚠️⚠️ ΚΡΙΣΙΜΟ - FORMAT JSON:

1. ΠΡΩΤΑ ΤΟ JSON - Βάλε το \`\`\`ai-action block στην ΑΡΧΗ της απάντησης!
2. ΜΟΝΟ JSON μέσα στο block - ΚΑΝΕΝΑ κείμενο/text!
3. ΜΙΑ ΓΡΑΜΜΗ JSON - χωρίς newlines/enters μέσα στο JSON
4. Ο αριθμός ημερομηνιών στο training_dates ΠΡΕΠΕΙ να ισούται με τον ΣΥΝΟΛΙΚΟ αριθμό days στο weeks array!

ΠΑΡΑΔΕΙΓΜΑ - 1 εβδομάδα x 1 ημέρα = 1 ημερομηνία:
\`\`\`ai-action
{"action":"create_program","name":"Heavy DL","description":"Deadlift focus","user_id":"Γιάννης Παπαδόπουλος","training_dates":["2025-12-30"],"weeks":[{"name":"W1","days":[{"name":"D1","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"DL","sets":4,"reps":"3","percentage_1rm":85,"rest":"180"}]}]}]}]}
\`\`\`

ΠΑΡΑΔΕΙΓΜΑ - 2 εβδομάδες x 3 ημέρες = 6 ημερομηνίες:
\`\`\`ai-action
{"action":"create_program","name":"Weight Loss","description":"Cardio & strength","user_id":"Μαρία","training_dates":["2026-01-05","2026-01-07","2026-01-09","2026-01-12","2026-01-14","2026-01-16"],"weeks":[{"name":"W1","days":[{"name":"Δευτέρα","blocks":[{"name":"Cardio","training_type":"end","exercises":[{"exercise_name":"Τρέξιμο","sets":1,"reps":"20min","rest":"0"}]}]},{"name":"Τετάρτη","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"SQ","sets":3,"reps":"12","rest":"60"}]}]},{"name":"Παρασκευή","blocks":[{"name":"HIIT","training_type":"end","exercises":[{"exercise_name":"Burpees","sets":4,"reps":"10","rest":"30"}]}]}]},{"name":"W2","days":[{"name":"Δευτέρα","blocks":[{"name":"Cardio","training_type":"end","exercises":[{"exercise_name":"Τρέξιμο","sets":1,"reps":"25min","rest":"0"}]}]},{"name":"Τετάρτη","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"DL","sets":3,"reps":"10","rest":"60"}]}]},{"name":"Παρασκευή","blocks":[{"name":"HIIT","training_type":"end","exercises":[{"exercise_name":"Mountain Climbers","sets":4,"reps":"15","rest":"30"}]}]}]}]}
\`\`\`

ΠΑΡΑΔΕΙΓΜΑ - Ανάθεση σε ΠΟΛΛΑ ΑΤΟΜΑ:
\`\`\`ai-action
{"action":"create_program","name":"Team Strength","user_ids":["Γιάννης","Μαρία","Κώστας"],"training_dates":["2025-12-30","2026-01-02"],"weeks":[{"name":"W1","days":[{"name":"D1","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"SQ","sets":4,"reps":"5","percentage_1rm":80,"rest":"150"}]}]},{"name":"D2","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"BP","sets":4,"reps":"5","rest":"150"}]}]}]}]}
\`\`\`

ΠΑΡΑΔΕΙΓΜΑ - Ανάθεση σε ΟΜΑΔΑ:
\`\`\`ai-action
{"action":"create_program","name":"Group Training","group_id":"U16 Boys","training_dates":["2025-12-30"],"weeks":[{"name":"W1","days":[{"name":"D1","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"BP","sets":3,"reps":"8","percentage_1rm":70,"rest":"120"}]}]}]}]}
\`\`\`

⚠️ ΕΠΙΤΡΕΠΤΕΣ ΤΙΜΕΣ training_type:
"str", "str/end", "str/spd", "pwr", "pwr/end", "end", "spd/end", "hpr", "warm up", "mobility", "stability", "activation", "neural act", "recovery", "accessory", "rotational"

ΚΑΝΟΝΕΣ ΟΝΟΜΑΤΩΝ:
- name: ΣΥΝΤΟΜΟ όνομα (π.χ. "Heavy DL", "Chest Day") - ΟΧΙ μεγάλα ονόματα!
- user_id: Βάλε ΟΝΟΜΑ ή email του χρήστη που θα ΛΑΒΕΙ το πρόγραμμα
- user_ids: Array με ΟΝΟΜΑΤΑ ή emails για πολλαπλή ανάθεση
- group_id: ΟΝΟΜΑ της ομάδας
- exercise_name: ΜΟΝΟ ονόματα από την ΤΡΑΠΕΖΑ ΑΣΚΗΣΕΩΝ
- training_dates: format "YYYY-MM-DD"

🎯 ΚΡΙΣΙΜΟΣ ΚΑΝΟΝΑΣ ΓΙΑ training_dates:
Ο αριθμός των training_dates πρέπει να ισούται με τον ΣΥΝΟΛΙΚΟ αριθμό ημερών προπόνησης!
- Αν έχεις 4 εβδομάδες x 3 ημέρες/εβδομάδα = 12 ημερομηνίες
- Αν έχεις 2 εβδομάδες x 4 ημέρες/εβδομάδα = 8 ημερομηνίες
- Κάθε "days" entry στο weeks array χρειάζεται 1 ημερομηνία στο training_dates!

🔴🔴🔴 ΥΠΟΧΡΕΩΤΙΚΟΣ ΚΑΝΟΝΑΣ - ΔΗΜΙΟΥΡΓΙΑ ΟΛΩΝ ΤΩΝ ΕΒΔΟΜΑΔΩΝ ΚΑΙ ΗΜΕΡΩΝ 🔴🔴🔴

ΠΡΕΠΕΙ να δημιουργείς ΟΛΕΣ τις εβδομάδες και ΟΛΕΣ τις ημέρες που ζητήθηκαν:

✅ ΣΩΣΤΟ - 4 εβδομάδες x 3 ημέρες = 4 weeks με 3 days η καθεμία:
"weeks":[{"name":"W1","days":[{"name":"D1",...},{"name":"D2",...},{"name":"D3",...}]},{"name":"W2","days":[{"name":"D1",...},{"name":"D2",...},{"name":"D3",...}]},{"name":"W3","days":[{"name":"D1",...},{"name":"D2",...},{"name":"D3",...}]},{"name":"W4","days":[{"name":"D1",...},{"name":"D2",...},{"name":"D3",...}]}]

❌ ΛΑΘΟΣ - Μόνο 1 week με 1 day (ΔΕΝ επιτρέπεται!):
"weeks":[{"name":"W1","days":[{"name":"D1",...}]}]

⚠️ ΜΗΝ αφήνεις το frontend να επεκτείνει το πρόγραμμα! ΕΣΥ πρέπει να δημιουργήσεις ΟΛΕΣ τις εβδομάδες με ΟΛΕΣ τις ημέρες!

📌 ΚΑΝΟΝΑΣ ΠΕΡΙΕΧΟΜΕΝΟΥ ΗΜΕΡΩΝ:
- Κάθε ημέρα ΜΠΟΡΕΙ να έχει ΔΙΑΦΟΡΕΤΙΚΕΣ ασκήσεις (π.χ. Δευτέρα: Πόδια, Τετάρτη: Στήθος, Παρασκευή: Πλάτη)
- Ή μπορεί να επαναλαμβάνει το ίδιο template με προόδευση (π.χ. εβδομάδα 1: 70%, εβδομάδα 2: 75%, εβδομάδα 3: 80%)
- ΠΑΝΤΑ δημιούργησε πλήρες πρόγραμμα με το σωστό αριθμό weeks και days!

🏋️ ΜΕΘΟΔΟΛΟΓΙΑ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΥ ΠΡΟΠΟΝΗΣΗΣ (TOTAL BODY APPROACH):

🔴🔴🔴 ΥΠΟΧΡΕΩΤΙΚΟ - ΑΚΟΛΟΥΘΑ ΤΑ ΠΑΡΑΔΕΙΓΜΑΤΑ ΑΝΑΛΟΓΑ ΜΕ ΤΟΝ ΑΡΙΘΜΟ ΗΜΕΡΩΝ/ΕΒΔΟΜΑΔΑ 🔴🔴🔴

⚠️ ΠΡΟΣΟΧΗ: ΠΡΕΠΕΙ να χρησιμοποιείς τη ΣΩΣΤΗ δομή ανάλογα με το πόσες ημέρες/εβδομάδα ζητάει ο χρήστης!
ΔΙΑΒΑΣΕ ΠΡΟΣΕΚΤΙΚΑ τα παραδείγματα παρακάτω και ΑΚΟΛΟΥΘΑ ΤΑ ΚΑΤΑ ΓΡΑΜΜΑ:

📌 1 ΗΜΕΡΑ/ΕΒΔΟΜΑΔΑ: Total Body με 3 blocks (STR + END + ACC)
📌 2 ΗΜΕΡΕΣ/ΕΒΔΟΜΑΔΑ: Μέρα 1 και Μέρα 2 είναι ΑΝΤΙΘΕΤΑ push/pull (βλ. παράδειγμα 2-Day)
📌 3 ΗΜΕΡΕΣ/ΕΒΔΟΜΑΔΑ: Μπορεί να είναι Upper/Lower Split + Total ή Alternating (βλ. παραδείγματα 3-Day)
📌 4 ΗΜΕΡΕΣ/ΕΒΔΟΜΑΔΑ: ΥΠΟΧΡΕΩΤΙΚΑ βλέπεις τα παραδείγματα "4 ΗΜΕΡΩΝ/ΕΒΔΟΜΑΔΑ" παρακάτω!
   - Παράδειγμα 1: Upper/Lower Split (2 Upper + 2 Lower)
   - Παράδειγμα 2: Mixed Split (Alternating Upper+Lower Focus)

❌ ΜΗΝ ΚΑΝΕΙΣ: Να αγνοείς τα παραδείγματα και να φτιάχνεις τυχαία προγράμματα!
✅ ΚΑΝΕ: Βρες το παράδειγμα με τον ΙΔΙΟ αριθμό ημερών και ΑΝΤΕΓΡΑΨΕ τη δομή!

📦 ΔΟΜΗ BLOCKS ΚΑΙ ΕΝΑΛΛΑΓΗ PUSH/PULL:
Κάθε ημέρα χωρίζεται σε 2-3 blocks με συγκεκριμένη λογική:

BLOCK 1 (STR - Strength):
- Lower Body: Push (π.χ. SQ) ή Pull (π.χ. DL)
- Upper Body: Το ΑΝΤΙΘΕΤΟ (αν lower=push τότε upper=pull)
- Core: Πάντα συμπεριλαμβάνεται
Παράδειγμα: SQ (lower push) + Pull Ups (upper pull) + Roll Out (core)

BLOCK 2 (END - Endurance ή PWR - Power):
- Lower Body: Το ΑΝΤΙΘΕΤΟ από Block 1
- Upper Body: Το ΑΝΤΙΘΕΤΟ από Block 1
- Core: Anti-rotation/Stability
Παράδειγμα: BP (upper push) + DL (lower pull) + Anti-Rotation Press (core)

BLOCK 3 (ACCESSORY):
- Upper Body Push Accessory (π.χ. Tricep Kick Back)
- Upper Body Pull Stability (π.χ. Overhead Press isolation DB)
- Lower Body Power (π.χ. Jump SQ continuous)
- Μπορεί να έχει 3-5 ασκήσεις

🔄 ΚΑΝΟΝΑΣ ΕΝΑΛΛΑΓΗΣ:
- Αν Block 1 έχει Lower Push → Block 2 έχει Lower Pull
- Αν Block 1 έχει Upper Pull → Block 2 έχει Upper Push
- Στο ίδιο block: αν Lower=Push τότε Upper=Pull (και αντίστροφα)

📊 SET x REPS SCHEMAS (ΕΠΕΛΕΞΕ ΑΝΑΛΟΓΑ ΜΕ ΣΤΟΧΟ):

🔹 STRENGTH (STR) Block Schemas:
1. CYCLE: 9 sets x 3 reps (κύκλος με όλες τις ασκήσεις)
   - Κάνεις 3 σετ από κάθε άσκηση με εναλλαγή

2. WAVE LOADING (Πυραμίδα) - 3 sets x 3.2.1 reps:
   Set 1: 3 reps (85%), 2 reps (87%), 1 rep (90%)
   Set 2: 3 reps (87%), 2 reps (90%), 1 rep (93%)
   Set 3: 3 reps (90%), 2 reps (93%), 1 rep (95%)

3. VELOCITY TRAINING - 3 sets x 5.3.2.5.3.2.5.3.2 reps:
   Ίδια ένταση (75% 1RM) σε όλα
   Στόχος: αύξηση ταχύτητας (m/s) καθώς πέφτουν οι επαναλήψεις

4. WAVE LOADING 10.8.6 - 10.8.6.10.8.6 reps:
   - 10 reps (60%), 8 reps (65%), 6 reps (70%)
   - 10 reps (63%), 8 reps (68%), 6 reps (73%)

5. WAVE LOADING 6.4.2 - 6.4.2.6.4.2 reps:
   - 6 reps (70%), 4 reps (80%), 2 reps (90%)
   - 6 reps (73%), 4 reps (83%), 2 reps (93%)

🔹 ENDURANCE (END) Block Schemas:
1. TIME CAP: 15:00 min nonstop
   - BP 4 reps + SQ 4 reps + Anti-Rotation 4 reps (επαναλαμβάνεται)

2. STRAIGHT SETS: BP 15 reps + SQ 15 reps + Anti-Rotation 15 reps

3. PROGRESSIVE LADDER: 5 sets
   - BP: 3+5+7 reps, SQ: 3+5+7 reps, Anti-Rotation: 15 reps

🔹 ACCESSORY Block Schemas:
1. CIRCUIT NONSTOP: 3 sets x 30sec ανά άσκηση χωρίς διάλειμμα
   - Upper Push Accessory 30sec
   - Upper Pull Stability 30sec
   - Lower Power 30sec

📝 ΠΑΡΑΔΕΙΓΜΑ ΠΛΗΡΟΥΣ ΗΜΕΡΑΣ (TOTAL BODY):
Block 1 (STR - training_type: "str"):
- SQ (lower push): 9 sets x 3 reps (κύκλος)
- Pull Ups (upper pull): 9 sets x 3 reps (κύκλος)
- Roll Out TRX (core): 9 sets x 3 reps (κύκλος)

Block 2 (END - training_type: "end"):
- BP (upper push): 15:00 nonstop, 4 reps κάθε γύρο
- DL (lower pull): 15:00 nonstop, 4 reps κάθε γύρο
- Anti-Rotation Press (core): 15:00 nonstop, 4 reps κάθε γύρο

Block 3 (ACCESSORY - training_type: "accessory"):
- Tricep Kick Back: 3 sets x 30sec
- OH Press DB isolation: 3 sets x 30sec
- Jump SQ continuous: 3 sets x 30sec

⚠️ ΚΑΝΟΝΕΣ ΠΟΥ ΠΡΕΠΕΙ ΝΑ ΑΚΟΛΟΥΘΕΙΣ:
1. Κάθε block έχει τουλάχιστον: 1 lower body + 1 upper body + 1 core
2. Push/Pull εναλλάσσονται μεταξύ blocks
3. Στο ίδιο block: αν lower=push τότε upper=pull
4. Block 3 (accessory) έχει 3-5 isolation ασκήσεις
5. Επίλεξε set/rep scheme ανάλογα με τον στόχο (str, end, pwr)

⚠️ ΣΗΜΑΝΤΙΚΟ: Αν ο χρήστης ζητά 4 εβδομάδες με 3 ημέρες ανά εβδομάδα:
1. Δημιούργησε weeks array με 4 εβδομάδες, κάθε μία με 3 ημέρες (days) - ΥΠΟΧΡΕΩΤΙΚΟ!
2. Βάλε 12 ημερομηνίες στο training_dates (3 ανά εβδομάδα x 4 εβδομάδες)
3. Παράδειγμα για Δευ-Τετ-Παρ ξεκινώντας 05/01/2026:
   training_dates: ["2026-01-05","2026-01-07","2026-01-09","2026-01-12","2026-01-14","2026-01-16","2026-01-19","2026-01-21","2026-01-23","2026-01-26","2026-01-28","2026-01-30"]

ΠΑΡΑΔΕΙΓΜΑ - 4 εβδομάδες x 3 ημέρες με πλήρες περιεχόμενο:
\`\`\`ai-action
{"action":"create_program","name":"Full Body 4W","user_id":"Γιάννης","training_dates":["2026-01-05","2026-01-07","2026-01-09","2026-01-12","2026-01-14","2026-01-16","2026-01-19","2026-01-21","2026-01-23","2026-01-26","2026-01-28","2026-01-30"],"weeks":[{"name":"W1","days":[{"name":"Δευτέρα","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"SQ","sets":4,"reps":"8","percentage_1rm":70,"rest":"120"}]}]},{"name":"Τετάρτη","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"BP","sets":4,"reps":"8","percentage_1rm":70,"rest":"120"}]}]},{"name":"Παρασκευή","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"DL","sets":4,"reps":"8","percentage_1rm":70,"rest":"120"}]}]}]},{"name":"W2","days":[{"name":"Δευτέρα","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"SQ","sets":4,"reps":"6","percentage_1rm":75,"rest":"150"}]}]},{"name":"Τετάρτη","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"BP","sets":4,"reps":"6","percentage_1rm":75,"rest":"150"}]}]},{"name":"Παρασκευή","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"DL","sets":4,"reps":"6","percentage_1rm":75,"rest":"150"}]}]}]},{"name":"W3","days":[{"name":"Δευτέρα","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"SQ","sets":4,"reps":"5","percentage_1rm":80,"rest":"180"}]}]},{"name":"Τετάρτη","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"BP","sets":4,"reps":"5","percentage_1rm":80,"rest":"180"}]}]},{"name":"Παρασκευή","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"DL","sets":4,"reps":"5","percentage_1rm":80,"rest":"180"}]}]}]},{"name":"W4","days":[{"name":"Δευτέρα","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"SQ","sets":4,"reps":"3","percentage_1rm":85,"rest":"180"}]}]},{"name":"Τετάρτη","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"BP","sets":4,"reps":"3","percentage_1rm":85,"rest":"180"}]}]},{"name":"Παρασκευή","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"DL","sets":4,"reps":"3","percentage_1rm":85,"rest":"180"}]}]}]}]}
\`\`\`

🔄 ΠΑΡΑΔΕΙΓΜΑ - 2 ΗΜΕΡΕΣ TOTAL BODY ΑΝΑ ΕΒΔΟΜΑΔΑ (PUSH/PULL ALTERNATION):
Όταν έχεις 2 ημέρες/εβδομάδα, η Μέρα 2 έχει τα ΑΝΤΙΘΕΤΑ push/pull από τη Μέρα 1:
- Μέρα 1 STR: upper PUSH + lower PULL → Μέρα 2 STR: upper PULL + lower PUSH
- Μέρα 1 END: upper PULL + lower PUSH → Μέρα 2 END: upper PUSH + lower PULL
- ΤΟ ΙΔΙΟ set x reps schema χρησιμοποιείται και στις 2 μέρες!

\`\`\`ai-action
{"action":"create_program","name":"Total Body 2x/week 4W","user_id":"Γιάννης","training_dates":["2026-01-05","2026-01-08","2026-01-12","2026-01-15","2026-01-19","2026-01-22","2026-01-26","2026-01-29"],"weeks":[{"name":"W1","days":[{"name":"Ημέρα 1 - Total Body A","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"BP","sets":3,"reps":"3.2.1","percentage_1rm":85,"rest":"180","notes":"Wave: 85%-87%-90%, 87%-90%-93%, 90%-93%-95%"},{"exercise_name":"DL","sets":3,"reps":"3.2.1","percentage_1rm":85,"rest":"180","notes":"Wave loading"},{"exercise_name":"Roll Out TRX","sets":3,"reps":"8","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Pull Ups","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"SQ","sets":5,"reps":"3+5+7","percentage_1rm":65,"rest":"90"},{"exercise_name":"Anti Rotation Press","sets":5,"reps":"15","rest":"60"}]},{"name":"ACCESSORY","training_type":"accessory","exercises":[{"exercise_name":"Tricep Kick Back","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Overhead Press DB","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Jump SQ Continuous","sets":3,"reps":"30sec","rest":"0"}]}]},{"name":"Ημέρα 2 - Total Body B","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"Pull Ups","sets":3,"reps":"3.2.1","percentage_1rm":85,"rest":"180","notes":"Wave: 85%-87%-90%, 87%-90%-93%, 90%-93%-95%"},{"exercise_name":"SQ","sets":3,"reps":"3.2.1","percentage_1rm":85,"rest":"180","notes":"Wave loading"},{"exercise_name":"Roll Out TRX","sets":3,"reps":"8","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"BP","sets":5,"reps":"3+5+7","percentage_1rm":65,"rest":"90"},{"exercise_name":"DL","sets":5,"reps":"3+5+7","percentage_1rm":65,"rest":"90"},{"exercise_name":"Anti Rotation Press","sets":5,"reps":"15","rest":"60"}]},{"name":"ACCESSORY","training_type":"accessory","exercises":[{"exercise_name":"Bicep Curl DB","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Lateral Raise DB","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Box Jump","sets":3,"reps":"30sec","rest":"0"}]}]}]},{"name":"W2","days":[{"name":"Ημέρα 1 - Total Body A","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"BP","sets":3,"reps":"3.2.1","percentage_1rm":87,"rest":"180","notes":"Wave +2%"},{"exercise_name":"DL","sets":3,"reps":"3.2.1","percentage_1rm":87,"rest":"180"},{"exercise_name":"Roll Out TRX","sets":3,"reps":"8","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Pull Ups","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"SQ","sets":5,"reps":"3+5+7","percentage_1rm":67,"rest":"90"},{"exercise_name":"Anti Rotation Press","sets":5,"reps":"15","rest":"60"}]},{"name":"ACCESSORY","training_type":"accessory","exercises":[{"exercise_name":"Tricep Kick Back","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Overhead Press DB","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Jump SQ Continuous","sets":3,"reps":"30sec","rest":"0"}]}]},{"name":"Ημέρα 2 - Total Body B","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"Pull Ups","sets":3,"reps":"3.2.1","percentage_1rm":87,"rest":"180"},{"exercise_name":"SQ","sets":3,"reps":"3.2.1","percentage_1rm":87,"rest":"180"},{"exercise_name":"Roll Out TRX","sets":3,"reps":"8","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"BP","sets":5,"reps":"3+5+7","percentage_1rm":67,"rest":"90"},{"exercise_name":"DL","sets":5,"reps":"3+5+7","percentage_1rm":67,"rest":"90"},{"exercise_name":"Anti Rotation Press","sets":5,"reps":"15","rest":"60"}]},{"name":"ACCESSORY","training_type":"accessory","exercises":[{"exercise_name":"Bicep Curl DB","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Lateral Raise DB","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Box Jump","sets":3,"reps":"30sec","rest":"0"}]}]}]},{"name":"W3","days":[{"name":"Ημέρα 1 - Total Body A","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"BP","sets":3,"reps":"3.2.1","percentage_1rm":90,"rest":"180"},{"exercise_name":"DL","sets":3,"reps":"3.2.1","percentage_1rm":90,"rest":"180"},{"exercise_name":"Roll Out TRX","sets":3,"reps":"8","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Pull Ups","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"SQ","sets":5,"reps":"3+5+7","percentage_1rm":70,"rest":"90"},{"exercise_name":"Anti Rotation Press","sets":5,"reps":"15","rest":"60"}]},{"name":"ACCESSORY","training_type":"accessory","exercises":[{"exercise_name":"Tricep Kick Back","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Overhead Press DB","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Jump SQ Continuous","sets":3,"reps":"30sec","rest":"0"}]}]},{"name":"Ημέρα 2 - Total Body B","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"Pull Ups","sets":3,"reps":"3.2.1","percentage_1rm":90,"rest":"180"},{"exercise_name":"SQ","sets":3,"reps":"3.2.1","percentage_1rm":90,"rest":"180"},{"exercise_name":"Roll Out TRX","sets":3,"reps":"8","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"BP","sets":5,"reps":"3+5+7","percentage_1rm":70,"rest":"90"},{"exercise_name":"DL","sets":5,"reps":"3+5+7","percentage_1rm":70,"rest":"90"},{"exercise_name":"Anti Rotation Press","sets":5,"reps":"15","rest":"60"}]},{"name":"ACCESSORY","training_type":"accessory","exercises":[{"exercise_name":"Bicep Curl DB","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Lateral Raise DB","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Box Jump","sets":3,"reps":"30sec","rest":"0"}]}]}]},{"name":"W4","days":[{"name":"Ημέρα 1 - Total Body A","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"BP","sets":3,"reps":"3.2.1","percentage_1rm":92,"rest":"180"},{"exercise_name":"DL","sets":3,"reps":"3.2.1","percentage_1rm":92,"rest":"180"},{"exercise_name":"Roll Out TRX","sets":3,"reps":"8","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Pull Ups","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"SQ","sets":5,"reps":"3+5+7","percentage_1rm":72,"rest":"90"},{"exercise_name":"Anti Rotation Press","sets":5,"reps":"15","rest":"60"}]},{"name":"ACCESSORY","training_type":"accessory","exercises":[{"exercise_name":"Tricep Kick Back","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Overhead Press DB","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Jump SQ Continuous","sets":3,"reps":"30sec","rest":"0"}]}]},{"name":"Ημέρα 2 - Total Body B","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"Pull Ups","sets":3,"reps":"3.2.1","percentage_1rm":92,"rest":"180"},{"exercise_name":"SQ","sets":3,"reps":"3.2.1","percentage_1rm":92,"rest":"180"},{"exercise_name":"Roll Out TRX","sets":3,"reps":"8","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"BP","sets":5,"reps":"3+5+7","percentage_1rm":72,"rest":"90"},{"exercise_name":"DL","sets":5,"reps":"3+5+7","percentage_1rm":72,"rest":"90"},{"exercise_name":"Anti Rotation Press","sets":5,"reps":"15","rest":"60"}]},{"name":"ACCESSORY","training_type":"accessory","exercises":[{"exercise_name":"Bicep Curl DB","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Lateral Raise DB","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Box Jump","sets":3,"reps":"30sec","rest":"0"}]}]}]}]}
\`\`\`

🔴 ΚΑΝΟΝΑΣ 2 ΗΜΕΡΩΝ/ΕΒΔΟΜΑΔΑ:
| Μέρα 1 | Μέρα 2 |
|--------|--------|
| STR: Upper PUSH, Lower PULL | STR: Upper PULL, Lower PUSH |
| END: Upper PULL, Lower PUSH | END: Upper PUSH, Lower PULL |
| Ίδιο set/reps schema | Ίδιο set/reps schema |

🔄 ΠΑΡΑΔΕΙΓΜΑ - 3 ΗΜΕΡΕΣ/ΕΒΔΟΜΑΔΑ:

📌 ΠΑΡΑΔΕΙΓΜΑ 1 - Upper/Lower Split + Total Body:
Day 1 (Upper Push + Lower Pull Focus):
- STR Block: Upper Push Horizontal + Lower Pull Knee Dominant + Core
- END Block: Upper Push Vertical + Lower Pull Knee Dominant + Core + Cardio
- ACC Block: Upper Push Unilateral + Lower Pull Unilateral + Core

Day 2 (Upper Pull + Lower Push Focus):
- STR Block: Upper Pull Horizontal + Lower Push Knee Dominant + Core
- END Block: Upper Pull Vertical + Lower Push Knee Dominant + Core + Cardio
- ACC Block: Upper Pull Unilateral + Lower Push Unilateral + Core

Day 3: Total Body (alternating push/pull όπως περιγράφεται παραπάνω)

📌 ΠΑΡΑΔΕΙΓΜΑ 2 - Upper/Lower/Total Split:
Day 1 (Upper Body):
- STR Block: Upper Push Horizontal + Upper Pull Vertical + Core
- END Block: Upper Push Vertical + Upper Pull Horizontal + Core + Cardio
- ACC Block: Upper Accessory Unilateral (4-5 ασκήσεις)

Day 2 (Lower Body):
- STR Block: Lower Push Hip Dominant Bilateral + Lower Push Accessory Unilateral + Core
- END Block: Lower Pull Knee Dominant Bilateral + Core + Cardio
- ACC Block: Lower Pull Accessory Unilateral + Core + Cardio

Day 3: Total Body

📌 ΠΑΡΑΔΕΙΓΜΑ 3 - Alternating Upper/Lower (εναλλαγή μεταξύ εβδομάδων):
Week 1: Day1=Upper, Day2=Lower, Day3=Upper
Week 2: Day1=Lower, Day2=Upper, Day3=Lower
Week 3: Day1=Upper, Day2=Lower, Day3=Upper
Week 4: Day1=Lower, Day2=Upper, Day3=Lower

\`\`\`ai-action
{"action":"create_program","name":"3-Day Split Example 1","user_id":"Γιάννης","training_dates":["2026-01-05","2026-01-07","2026-01-09","2026-01-12","2026-01-14","2026-01-16","2026-01-19","2026-01-21","2026-01-23","2026-01-26","2026-01-28","2026-01-30"],"weeks":[{"name":"W1","days":[{"name":"Day 1 - Upper Push/Lower Pull","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"BP","sets":3,"reps":"6.4.2.6.4.2","percentage_1rm":70,"rest":"150","notes":"Wave: 70-80-90%, 73-83-93%"},{"exercise_name":"Romanian DL","sets":3,"reps":"6.4.2.6.4.2","percentage_1rm":70,"rest":"150"},{"exercise_name":"Plank","sets":3,"reps":"30sec","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Overhead Press","sets":5,"reps":"3+5+7","percentage_1rm":60,"rest":"90"},{"exercise_name":"Leg Curl","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Dead Bug","sets":3,"reps":"12","rest":"60"},{"exercise_name":"Rowing","sets":1,"reps":"10min","rest":"0"}]},{"name":"ACC","training_type":"accessory","exercises":[{"exercise_name":"Tricep Pushdown","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Single Leg RDL","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Pallof Press","sets":3,"reps":"30sec","rest":"0"}]}]},{"name":"Day 2 - Upper Pull/Lower Push","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"Pull Ups","sets":3,"reps":"6.4.2.6.4.2","percentage_1rm":70,"rest":"150"},{"exercise_name":"SQ","sets":3,"reps":"6.4.2.6.4.2","percentage_1rm":70,"rest":"150"},{"exercise_name":"Roll Out TRX","sets":3,"reps":"8","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Lat Pulldown","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Leg Press","sets":5,"reps":"3+5+7","percentage_1rm":60,"rest":"90"},{"exercise_name":"Bird Dog","sets":3,"reps":"12","rest":"60"},{"exercise_name":"Bike","sets":1,"reps":"10min","rest":"0"}]},{"name":"ACC","training_type":"accessory","exercises":[{"exercise_name":"Bicep Curl DB","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Walking Lunges","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Side Plank","sets":3,"reps":"30sec","rest":"0"}]}]},{"name":"Day 3 - Total Body","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"Push Press","sets":3,"reps":"6.4.2.6.4.2","percentage_1rm":70,"rest":"150"},{"exercise_name":"DL","sets":3,"reps":"6.4.2.6.4.2","percentage_1rm":70,"rest":"150"},{"exercise_name":"Hollow Body","sets":3,"reps":"30sec","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Rows","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Front SQ","sets":5,"reps":"3+5+7","percentage_1rm":60,"rest":"90"},{"exercise_name":"Anti Rotation Press","sets":3,"reps":"12","rest":"60"}]},{"name":"ACC","training_type":"accessory","exercises":[{"exercise_name":"Face Pull","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Box Jump","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Farmer Walk","sets":3,"reps":"30sec","rest":"0"}]}]}]}]}
\`\`\`

\`\`\`ai-action
{"action":"create_program","name":"3-Day Alternating Upper/Lower","user_id":"Γιάννης","training_dates":["2026-01-05","2026-01-07","2026-01-09","2026-01-12","2026-01-14","2026-01-16","2026-01-19","2026-01-21","2026-01-23","2026-01-26","2026-01-28","2026-01-30"],"weeks":[{"name":"W1","days":[{"name":"Day 1 - Upper Body","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"BP","sets":3,"reps":"3.2.1","percentage_1rm":85,"rest":"180","notes":"Wave loading"},{"exercise_name":"Pull Ups","sets":3,"reps":"3.2.1","rest":"180"},{"exercise_name":"Plank","sets":3,"reps":"30sec","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Overhead Press","sets":5,"reps":"3+5+7","percentage_1rm":60,"rest":"90"},{"exercise_name":"Rows","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Dead Bug","sets":3,"reps":"12","rest":"60"},{"exercise_name":"Bike","sets":1,"reps":"8min","rest":"0"}]},{"name":"ACC","training_type":"accessory","exercises":[{"exercise_name":"Tricep Extension","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Bicep Curl","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Lateral Raise","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Face Pull","sets":3,"reps":"30sec","rest":"0"}]}]},{"name":"Day 2 - Lower Body","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"SQ","sets":3,"reps":"3.2.1","percentage_1rm":85,"rest":"180"},{"exercise_name":"Hip Thrust","sets":3,"reps":"3.2.1","percentage_1rm":85,"rest":"180"},{"exercise_name":"Roll Out","sets":3,"reps":"8","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Leg Press","sets":5,"reps":"3+5+7","percentage_1rm":60,"rest":"90"},{"exercise_name":"Romanian DL","sets":5,"reps":"3+5+7","percentage_1rm":60,"rest":"90"},{"exercise_name":"Side Plank","sets":3,"reps":"30sec","rest":"60"},{"exercise_name":"Rowing","sets":1,"reps":"8min","rest":"0"}]},{"name":"ACC","training_type":"accessory","exercises":[{"exercise_name":"Walking Lunges","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Single Leg RDL","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Calf Raise","sets":3,"reps":"30sec","rest":"0"}]}]},{"name":"Day 3 - Upper Body","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"Incline BP","sets":3,"reps":"3.2.1","percentage_1rm":85,"rest":"180"},{"exercise_name":"Chin Ups","sets":3,"reps":"3.2.1","rest":"180"},{"exercise_name":"Hollow Body","sets":3,"reps":"30sec","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Dips","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Lat Pulldown","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Bird Dog","sets":3,"reps":"12","rest":"60"},{"exercise_name":"Skip Rope","sets":1,"reps":"8min","rest":"0"}]},{"name":"ACC","training_type":"accessory","exercises":[{"exercise_name":"Cable Fly","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Reverse Fly","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Hammer Curl","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Tricep Kickback","sets":3,"reps":"30sec","rest":"0"}]}]}]},{"name":"W2","days":[{"name":"Day 1 - Lower Body","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"Front SQ","sets":3,"reps":"3.2.1","percentage_1rm":85,"rest":"180"},{"exercise_name":"DL","sets":3,"reps":"3.2.1","percentage_1rm":85,"rest":"180"},{"exercise_name":"Pallof Press","sets":3,"reps":"12","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Split SQ","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Leg Curl","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Anti Rotation Press","sets":3,"reps":"12","rest":"60"},{"exercise_name":"Bike","sets":1,"reps":"8min","rest":"0"}]},{"name":"ACC","training_type":"accessory","exercises":[{"exercise_name":"Step Ups","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Glute Bridge","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Box Jump","sets":3,"reps":"30sec","rest":"0"}]}]},{"name":"Day 2 - Upper Body","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"Military Press","sets":3,"reps":"3.2.1","percentage_1rm":85,"rest":"180"},{"exercise_name":"Rows","sets":3,"reps":"3.2.1","rest":"180"},{"exercise_name":"Dead Bug","sets":3,"reps":"12","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Push Ups","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Face Pull","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Plank","sets":3,"reps":"30sec","rest":"60"},{"exercise_name":"Rowing","sets":1,"reps":"8min","rest":"0"}]},{"name":"ACC","training_type":"accessory","exercises":[{"exercise_name":"Lateral Raise","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Rear Delt Fly","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Bicep 21s","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Tricep Dips","sets":3,"reps":"30sec","rest":"0"}]}]},{"name":"Day 3 - Lower Body","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"Sumo DL","sets":3,"reps":"3.2.1","percentage_1rm":85,"rest":"180"},{"exercise_name":"Goblet SQ","sets":3,"reps":"3.2.1","percentage_1rm":85,"rest":"180"},{"exercise_name":"Side Plank","sets":3,"reps":"30sec","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Bulgarian Split SQ","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Good Morning","sets":5,"reps":"3+5+7","percentage_1rm":50,"rest":"90"},{"exercise_name":"Hollow Body","sets":3,"reps":"30sec","rest":"60"},{"exercise_name":"Skip Rope","sets":1,"reps":"8min","rest":"0"}]},{"name":"ACC","training_type":"accessory","exercises":[{"exercise_name":"Lateral Lunges","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Nordic Curl","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Jump SQ","sets":3,"reps":"30sec","rest":"0"}]}]}]}]}
\`\`\`

🔴 ΚΑΝΟΝΕΣ 3 ΗΜΕΡΩΝ/ΕΒΔΟΜΑΔΑ:
| Τύπος | Day 1 | Day 2 | Day 3 |
|-------|-------|-------|-------|
| Split 1 | Upper Push + Lower Pull | Upper Pull + Lower Push | Total Body |
| Split 2 | Upper Body | Lower Body | Total Body |
| Alternating | W1: U/L/U, W2: L/U/L | W3: U/L/U, W4: L/U/L | Εναλλαγή |

ΣΗΜΑΝΤΙΚΟ:
- Το ίδιο set x reps schema σε όλες τις μέρες της εβδομάδας!
- Κάθε block έχει: Upper (push/pull) + Lower (push/pull αντίθετο) + Core
- Day 3 Total Body: αντίθετα push/pull από Day 1

🏋️ ΠΑΡΑΔΕΙΓΜΑΤΑ 4 ΗΜΕΡΩΝ/ΕΒΔΟΜΑΔΑ:

📌 ΠΑΡΑΔΕΙΓΜΑ 1 - Upper/Lower Split (2 Upper + 2 Lower):
Εναλλαγή Horizontal/Vertical μεταξύ Upper Days & Push/Pull μεταξύ Lower Days

Day 1 (Upper Body A):
- STR Block: Upper Push Horizontal + Upper Pull Vertical + Core
- END Block: Upper Push Vertical + Upper Pull Horizontal + Core + Cardio
- ACC Block: Upper Accessory/Stability + Antirotation

Day 2 (Lower Body A):
- STR Block: Lower Push Bilateral + Core
- END Block: Lower Pull Unilateral + Core + Cardio
- ACC Block: Lower Accessory/Stability + Rotational

Day 3 (Upper Body B):
- STR Block: Upper Push Vertical + Upper Pull Horizontal + Core
- END Block: Upper Push Horizontal + Upper Pull Vertical + Core + Cardio
- ACC Block: Upper Accessory/Stability + Antirotation

Day 4 (Lower Body B):
- STR Block: Lower Pull Bilateral + Core
- END Block: Lower Push Unilateral + Core + Cardio
- ACC Block: Lower Accessory/Stability + Rotational

📌 ΠΑΡΑΔΕΙΓΜΑ 2 - Mixed Split (Alternating Upper+Lower Focus):
Εναλλαγή ανά μέρα μεταξύ άνω/κάτω κορμού ΚΑΙ horizontal/vertical

Day 1:
- STR Block: Upper Push Horizontal + Lower Pull Hip Dominant + Core
- END Block: Upper Push Horizontal Unilateral + Lower Pull Knee Dominant + Core + Cardio
- ACC Block: Upper Push Accessory + Lower Pull Accessory + Rotational

Day 2:
- STR Block: Lower Push Knee Dominant + Upper Pull Vertical + Core
- END Block: Lower Push Unilateral + Upper Pull Vertical Unilateral + Core + Cardio
- ACC Block: Lower Push Accessory

Day 3:
- STR Block: Upper Push Vertical + Lower Pull Knee Dominant + Core
- END Block: Upper Push Vertical Unilateral + Lower Pull Hip Dominant + Core + Cardio
- ACC Block: Upper Push Accessory + Lower Push Accessory + Rotational

Day 4:
- STR Block: Lower Push Bilateral + Core
- END Block: Lower Push Unilateral + Core + Cardio
- ACC Block: Lower Accessory/Stability + Rotational

\`\`\`ai-action
{"action":"create_program","name":"4-Day Upper/Lower Split","user_id":"Γιάννης","training_dates":["2026-01-05","2026-01-07","2026-01-09","2026-01-11","2026-01-12","2026-01-14","2026-01-16","2026-01-18","2026-01-19","2026-01-21","2026-01-23","2026-01-25","2026-01-26","2026-01-28","2026-01-30","2026-02-01"],"weeks":[{"name":"W1","days":[{"name":"Day 1 - Upper A","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"BP","sets":3,"reps":"6.4.2.6.4.2","percentage_1rm":70,"rest":"150","notes":"Wave: 70-80-90%, 73-83-93%"},{"exercise_name":"Pull Ups","sets":3,"reps":"6.4.2.6.4.2","rest":"150"},{"exercise_name":"Plank","sets":3,"reps":"30sec","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Overhead Press","sets":5,"reps":"3+5+7","percentage_1rm":60,"rest":"90"},{"exercise_name":"Rows","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Dead Bug","sets":3,"reps":"12","rest":"60"},{"exercise_name":"Rowing","sets":1,"reps":"10min","rest":"0"}]},{"name":"ACC","training_type":"accessory","exercises":[{"exercise_name":"Tricep Extension","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Face Pull","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Pallof Press","sets":3,"reps":"30sec","rest":"0"}]}]},{"name":"Day 2 - Lower A","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"SQ","sets":3,"reps":"6.4.2.6.4.2","percentage_1rm":70,"rest":"150"},{"exercise_name":"Hollow Body","sets":3,"reps":"30sec","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Single Leg RDL","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Side Plank","sets":3,"reps":"30sec","rest":"60"},{"exercise_name":"Bike","sets":1,"reps":"10min","rest":"0"}]},{"name":"ACC","training_type":"rotational","exercises":[{"exercise_name":"Step Ups","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Cable Woodchop","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Medicine Ball Rotation","sets":3,"reps":"30sec","rest":"0"}]}]},{"name":"Day 3 - Upper B","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"Military Press","sets":3,"reps":"6.4.2.6.4.2","percentage_1rm":70,"rest":"150"},{"exercise_name":"Lat Pulldown","sets":3,"reps":"6.4.2.6.4.2","rest":"150"},{"exercise_name":"Roll Out","sets":3,"reps":"8","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Push Ups","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Face Pull","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Bird Dog","sets":3,"reps":"12","rest":"60"},{"exercise_name":"Skip Rope","sets":1,"reps":"10min","rest":"0"}]},{"name":"ACC","training_type":"accessory","exercises":[{"exercise_name":"Lateral Raise","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Bicep Curl","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Anti Rotation Press","sets":3,"reps":"30sec","rest":"0"}]}]},{"name":"Day 4 - Lower B","blocks":[{"name":"STR","training_type":"str","exercises":[{"exercise_name":"Romanian DL","sets":3,"reps":"6.4.2.6.4.2","percentage_1rm":70,"rest":"150"},{"exercise_name":"Dead Bug","sets":3,"reps":"12","rest":"60"}]},{"name":"END","training_type":"end","exercises":[{"exercise_name":"Walking Lunges","sets":5,"reps":"3+5+7","rest":"90"},{"exercise_name":"Hollow Body","sets":3,"reps":"30sec","rest":"60"},{"exercise_name":"Rowing","sets":1,"reps":"10min","rest":"0"}]},{"name":"ACC","training_type":"rotational","exercises":[{"exercise_name":"Lateral Lunges","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Russian Twist","sets":3,"reps":"30sec","rest":"0"},{"exercise_name":"Landmine Rotation","sets":3,"reps":"30sec","rest":"0"}]}]}]}]}
\`\`\`

🔴 ΚΑΝΟΝΕΣ 4 ΗΜΕΡΩΝ/ΕΒΔΟΜΑΔΑ:
| Τύπος | Day 1 | Day 2 | Day 3 | Day 4 |
|-------|-------|-------|-------|-------|
| Upper/Lower | Upper A (Push H + Pull V) | Lower A (Push) | Upper B (Push V + Pull H) | Lower B (Pull) |
| Mixed | Upper Push + Lower Pull | Lower Push + Upper Pull | Upper Push V + Lower Pull K | Lower Push |

ΣΗΜΑΝΤΙΚΟ:
- Εναλλαγή Horizontal ↔ Vertical μεταξύ Upper Days!
- Εναλλαγή Push ↔ Pull μεταξύ Lower Days!
- Το ίδιο set x reps schema σε όλες τις μέρες της εβδομάδας!

Αν ο χρήστης έχει Εβδομαδιαίο Προγραμματισμό (section "📆 ΕΒΔΟΜΑΔΙΑΙΟΣ ΠΡΟΠΟΝΗΤΙΚΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ"):
- ΧΡΗΣΙΜΟΠΟΙΗΣΕ ΑΥΤΕΣ τις ημερομηνίες για training_dates!
- Μην βάζεις τυχαίες ημερομηνίες - χρησιμοποίησε αυτές που είναι ήδη προγραμματισμένες
- Αν δεν καθορίσει ο χρήστης συγκεκριμένη ημερομηνία, πάρε τις επόμενες από τον προγραμματισμό

Παράδειγμα: Αν ο εβδομαδιαίος προγραμματισμός λέει "2025-12-26, 2025-12-28, 2025-12-30"
→ Βάλε training_dates: ["2025-12-26","2025-12-28","2025-12-30"]

⚠️ ΚΡΙΣΙΜΟ: Χρησιμοποίησε "percentage_1rm" για %, "velocity_ms" για ταχύτητα, "rest" για διάλειμμα!
` : hasActiveSubscription ? `
🟢 USER MODE - ΑΝΑΘΕΣΗ ΜΟΝΟ ΣΤΟΝ ΕΑΥΤΟ ΣΟΥ:
Μπορείς να δημιουργήσεις προγράμματα ΜΟΝΟ για τον εαυτό σου!
ΔΕΝ μπορείς να αναθέσεις σε άλλους χρήστες - αυτό απαιτεί admin δικαιώματα.

${exerciseDatabaseContext}

⚠️ ΕΠΙΤΡΕΠΤΕΣ ΤΙΜΕΣ training_type: "str", "str/end", "str/spd", "pwr", "pwr/end", "end", "spd/end", "hpr", "warm up", "mobility", "stability", "activation", "neural act", "recovery", "accessory", "rotational"

ΠΑΡΑΔΕΙΓΜΑ (ΠΑΝΤΑ user_id = δικό σου ID):
\`\`\`ai-action
{"action":"create_program","name":"Leg Day","user_id":"${userId}","training_dates":["2025-12-30"],"weeks":[{"name":"W1","days":[{"name":"D1","blocks":[{"name":"Main","training_type":"str","exercises":[{"exercise_name":"SQ","sets":4,"reps":"6","percentage_1rm":80,"rest":"120"}]}]}]}]}
\`\`\`

⚠️ ΣΗΜΑΝΤΙΚΟ: Όλα τα προγράμματα ανατίθενται ΑΥΤΟΜΑΤΑ σε εσένα!
` : `
⚠️ Χρειάζεσαι ενεργή συνδρομή για δημιουργία προγραμμάτων.
`}

🥗 ΔΥΝΑΤΟΤΗΤΑ ΔΗΜΙΟΥΡΓΙΑΣ ΠΡΟΓΡΑΜΜΑΤΩΝ ΔΙΑΤΡΟΦΗΣ:
${isAdmin ? `
Ως admin, μπορείς να δημιουργείς προγράμματα διατροφής για ΟΠΟΙΟΝΔΗΠΟΤΕ χρήστη!
${foodsDatabaseContext}

⚠️⚠️⚠️ ΚΡΙΣΙΜΟ ΓΙΑ NUTRITION PLANS - ΑΚΟΛΟΥΘΑ ΑΥΤΟΥΣ ΤΟΥΣ ΚΑΝΟΝΕΣ:

1. ΠΡΩΤΑ ΤΟ JSON - Βάλε το \`\`\`ai-action block στην ΑΡΧΗ της απάντησης!
2. ΜΟΝΟ JSON μέσα στο block - ΚΑΝΕΝΑ κείμενο!
3. ΜΙΑ ΓΡΑΜΜΗ JSON - χωρίς newlines μέσα στο JSON
4. ΠΑΝΤΑ ΠΕΡΙΛΑΜΒΑΝΕ target_user_id ΚΑΙ target_user_name - Αν ο χρήστης ζητήσει για συγκεκριμένο άτομο:
   - ΨΑΞΕ στη λίστα χρηστών παραπάνω (👥 ΛΙΣΤΑ ΧΡΗΣΤΩΝ)
   - ΒΡΕΣ τον χρήστη ακόμα κι αν το όνομα δεν ταιριάζει ακριβώς (π.χ. "Ευαγγελίδης" θα βρει "Ευαγγελίδης Γιώργος")
   - Βάλε ΤΟΣΟ το target_user_id ΟΣΟ ΚΑΙ το target_user_name!
5. ⚠️⚠️⚠️ ΥΠΟΧΡΕΩΤΙΚΑ ΤΡΟΦΙΜΑ ΣΕ ΚΑΘΕ ΓΕΥΜΑ! Κάθε meal ΠΡΕΠΕΙ να έχει foods array με ΤΟΥΛΑΧΙΣΤΟΝ 2-3 τρόφιμα! ΠΟΤΕ κενό foods array!
6. ΔΩΣΕ ΜΟΝΟ 1 ΗΜΕΡΑ! Η εφαρμογή θα αντιγράψει αυτόματα σε 7 ημέρες. ΜΗΝ δημιουργείς πολλές ημέρες!
7. Κάθε food ΠΡΕΠΕΙ να έχει: name, quantity (αριθμός σε g), unit ("g"), calories, protein, carbs, fat

⚠️ Η λίστα χρηστών είναι διαθέσιμη στο context (👥 ΛΙΣΤΑ ΧΡΗΣΤΩΝ) - χρησιμοποίησε τα IDs ΚΑΙ τα ονόματα από εκεί!

ΠΑΡΑΔΕΙΓΜΑ NUTRITION PLAN (με target_user_id) - ΠΡΟΣΕΞΕ ΟΤΙ ΚΑΘΕ ΓΕΥΜΑ ΕΧΕΙ ΤΡΟΦΙΜΑ:
\`\`\`ai-action
{"action":"create_nutrition_plan","target_user_id":"USER_ID_HERE","target_user_name":"Ονοματεπώνυμο","name":"Πρόγραμμα Απώλειας Βάρους","description":"Υψηλή πρωτεΐνη","goal":"fat_loss","totalCalories":2000,"proteinTarget":150,"carbsTarget":150,"fatTarget":70,"days":[{"dayNumber":1,"name":"Ημέρα 1","totalCalories":2000,"totalProtein":150,"totalCarbs":150,"totalFat":70,"meals":[{"type":"breakfast","order":1,"name":"Πρωινό","totalCalories":400,"totalProtein":30,"totalCarbs":40,"totalFat":14,"foods":[{"name":"Αυγά","quantity":150,"unit":"g","protein":18,"carbs":1,"fat":15,"calories":210},{"name":"Βρώμη","quantity":50,"unit":"g","protein":7,"carbs":33,"fat":3,"calories":190}]},{"type":"morning_snack","order":2,"name":"Δεκατιανό","totalCalories":250,"totalProtein":20,"totalCarbs":25,"totalFat":8,"foods":[{"name":"Γιαούρτι","quantity":200,"unit":"g","protein":12,"carbs":8,"fat":6,"calories":130},{"name":"Μπανάνα","quantity":120,"unit":"g","protein":1,"carbs":27,"fat":0,"calories":107}]},{"type":"lunch","order":3,"name":"Μεσημεριανό","totalCalories":550,"totalProtein":46,"totalCarbs":40,"totalFat":18,"foods":[{"name":"Στήθος κοτόπουλο","quantity":200,"unit":"g","protein":46,"carbs":0,"fat":6,"calories":240},{"name":"Ρύζι","quantity":100,"unit":"g","protein":3,"carbs":35,"fat":1,"calories":160},{"name":"Λαχανικά","quantity":150,"unit":"g","protein":3,"carbs":10,"fat":1,"calories":50}]},{"type":"afternoon_snack","order":4,"name":"Απογευματινό","totalCalories":300,"totalProtein":25,"totalCarbs":20,"totalFat":12,"foods":[{"name":"Αμύγδαλα","quantity":30,"unit":"g","protein":6,"carbs":6,"fat":14,"calories":170},{"name":"Μήλο","quantity":150,"unit":"g","protein":0,"carbs":21,"fat":0,"calories":78}]},{"type":"dinner","order":5,"name":"Βραδινό","totalCalories":500,"totalProtein":39,"totalCarbs":25,"totalFat":18,"foods":[{"name":"Σολομός","quantity":150,"unit":"g","protein":33,"carbs":0,"fat":18,"calories":290},{"name":"Πατάτα","quantity":150,"unit":"g","protein":3,"carbs":26,"fat":0,"calories":120},{"name":"Σαλάτα","quantity":100,"unit":"g","protein":1,"carbs":3,"fat":0,"calories":15}]}]}]}
\`\`\`

ΣΗΜΑΝΤΙΚΑ ΓΙΑ NUTRITION:
- ⚠️ ΚΡΙΣΙΜΟ: Κάθε γεύμα (meal) ΠΡΕΠΕΙ να περιέχει foods array με ΠΡΑΓΜΑΤΙΚΑ τρόφιμα! ΠΟΤΕ κενά foods!
- Λάβε υπόψη ηλικία (birth_date), φύλο (gender), βάρος (από ανθρωπομετρικά) του χρήστη
- Χρησιμοποίησε ΜΟΝΟ τρόφιμα από την ΤΡΑΠΕΖΑ ΦΑΓΗΤΩΝ
- Υπολόγισε θερμίδες και macros με βάση τις ποσότητες
- goal: "fat_loss", "muscle_gain", "maintenance", "performance"
- meal types: "breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"
- ⚠️ ΥΠΟΧΡΕΩΤΙΚΟ: Αν ο χρήστης ζητήσει για κάποιον (π.χ. "για τον Αθανασιάδη"), ΒΡΕΣ το id του από τη λίστα χρηστών και βάλε target_user_id!

ΥΠΟΛΟΓΙΣΜΟΣ ΑΝΑΓΚΩΝ:
- Βασικός μεταβολισμός (BMR) ανά φύλο:
  * Άνδρες: 10 × βάρος(kg) + 6.25 × ύψος(cm) - 5 × ηλικία + 5
  * Γυναίκες: 10 × βάρος(kg) + 6.25 × ύψος(cm) - 5 × ηλικία - 161
- TDEE = BMR × activity factor (1.2-1.9)
- Πρωτεΐνη: 1.6-2.2g/kg σωματικού βάρους για αθλητές
- Για απώλεια: TDEE - 500kcal, για αύξηση: TDEE + 300-500kcal
` : hasActiveSubscription ? `
Μπορείς να δημιουργήσεις προγράμματα διατροφής για τον εαυτό σου!
${foodsDatabaseContext}

ΠΑΡΑΔΕΙΓΜΑ:
\`\`\`ai-action
{"action":"create_nutrition_plan","name":"Ημερήσιο Πλάνο","goal":"performance","totalCalories":2500,"proteinTarget":180,"carbsTarget":250,"fatTarget":80,"days":[{"dayNumber":1,"name":"Ημέρα 1","meals":[{"type":"breakfast","order":1,"name":"Πρωινό","foods":[{"name":"Αυγά","quantity":150,"unit":"g","protein":18,"carbs":1,"fat":15,"calories":210}]}]}]}
\`\`\`
` : `
⚠️ Χρειάζεσαι ενεργή συνδρομή για δημιουργία προγραμμάτων διατροφής.
`}

📅 ΔΥΝΑΤΟΤΗΤΑ ΔΙΑΧΕΙΡΙΣΗΣ ΕΤΗΣΙΟΥ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΥ (ANNUAL PLAN):
${isAdmin ? `
🔴 ADMIN MODE - ΠΛΗΡΗΣ ΕΛΕΓΧΟΣ ΜΑΚΡΟΚΥΚΛΩΝ:
Μπορείς να δημιουργείς, να επεξεργάζεσαι και να αναθέτεις ετήσιους μακροκύκλους σε αθλητές!

📋 ΔΙΑΘΕΣΙΜΕΣ ΦΑΣΕΙΣ (ΕΠΙΛΕΞΕ ΑΠΟ ΑΥΤΕΣ):
- corrective: Διορθωτικές
- stabilization: Σταθεροποίηση
- connecting-linking: Σύνδεση
- movement-skills: Κινητικές Δεξιότητες
- non-functional-hypertrophy: Μη Λειτουργική Υπερτροφία
- functional-hypertrophy: Λειτουργική Υπερτροφία
- maximal-strength: Μέγιστη Δύναμη
- power: Ισχύς
- endurance: Αντοχή
- competition: Αγωνιστική

⚠️⚠️⚠️ ΚΡΙΣΙΜΟ ΓΙΑ ANNUAL PLAN - ΑΚΟΛΟΥΘΑ ΑΥΤΟΥΣ ΤΟΥΣ ΚΑΝΟΝΕΣ:

1. ΠΡΩΤΑ ΤΟ JSON - Βάλε το \`\`\`ai-action block στην ΑΡΧΗ της απάντησης!
2. ΜΟΝΟ JSON μέσα στο block - ΚΑΝΕΝΑ κείμενο!
3. ΜΙΑ ΓΡΑΜΜΗ JSON - χωρίς newlines μέσα στο JSON

ΚΑΝΟΝΕΣ ΓΙΑ YEAR (ΓΙΑ ΝΑ ΜΗΝ ΠΕΦΤΕΙ ΛΑΘΟΣ ΣΤΟ 2025):
- Αν ο χρήστης ΔΕΝ αναφέρει ρητά έτος (π.χ. "Απρίλιο"), ΜΗΝ βάζεις καθόλου πεδίο year στο JSON.
- Αν ο χρήστης αναφέρει ρητά έτος (π.χ. "Απρίλιο 2026"), τότε βάλε year: 2026.

ΚΑΝΟΝΕΣ ΓΙΑ ΕΒΔΟΜΑΔΙΑΙΟ (TRAINING DAYS):
- Αν ο χρήστης έχει πει ποιες μέρες θα κάνει προπόνηση, ΠΡΕΠΕΙ να συμπεριλάβεις training_days.
- training_days: array με weekdays (Δευτέρα=1 ... Κυριακή=7). Παράδειγμα: [1,3,5]
- days_per_week: αριθμός προπονήσεων/εβδομάδα (π.χ. 3, 4, 5)
- Αν δεν ξέρεις τις μέρες, ΡΩΤΑ: "Ποιες ημέρες θέλεις προπόνηση;" και ΜΗΝ δημιουργήσεις μακροκύκλο.

🏃 ΥΠΟΦΑΣΕΙΣ ΔΥΝΑΜΗΣ (ΑΥΤΟΜΑΤΗ ΣΥΜΠΛΗΡΩΣΗ):
Οι υποφάσεις (Starting/Explosive/Reactive Strength) στον Εβδομαδιαίο Προγραμματισμό συμπληρώνονται ΑΥΤΟΜΑΤΑ με βάση το αλτικό προφίλ του αθλητή:

ΛΟΓΙΚΗ ΑΛΤΙΚΟΥ ΠΡΟΦΙΛ:
- Αν Non-CMJ < CMJ και Non-CMJ < Depth Jump → Primary: Starting Strength, Secondary: Reactive Strength
- Αν CMJ < Non-CMJ και CMJ < Depth Jump → Primary: Explosive Strength, Secondary: Starting Strength
- Αν Depth Jump < Non-CMJ και Depth Jump < CMJ → Primary: Reactive Strength, Secondary: Explosive Strength

ΑΝ ΔΕΝ ΥΠΑΡΧΕΙ ΑΛΤΙΚΟ ΠΡΟΦΙΛ → Γίνεται 3-εβδομαδιαία εναλλαγή:
- Εβδομάδες 1-3: Primary: Starting Strength, Secondary: Explosive Strength
- Εβδομάδες 4-6: Primary: Explosive Strength, Secondary: Reactive Strength
- Εβδομάδες 7-9: Primary: Reactive Strength, Secondary: Starting Strength
(και συνεχίζεται ο κύκλος)

ΣΗΜΑΝΤΙΚΟ: Οι υποφάσεις εφαρμόζονται ΜΟΝΟ στις φάσεις maximal-strength και power!

ΠΑΡΑΔΕΙΓΜΑ ΔΗΜΙΟΥΡΓΙΑΣ/ΑΝΑΘΕΣΗΣ ANNUAL PLAN (ΧΩΡΙΣ year, με training_days):
\`\`\`ai-action
{"action":"create_annual_plan","user_id":"Γιάννης Παπαδόπουλος","training_days":[1,3,5],"days_per_week":3,"phases":[{"month":1,"phase":"corrective"},{"month":2,"phase":"stabilization"},{"month":3,"phase":"functional-hypertrophy"},{"month":4,"phase":"competition"}]}
\`\`\`

ΠΑΡΑΔΕΙΓΜΑ ΑΝΑΘΕΣΗΣ ΣΕ ΠΟΛΛΟΥΣ ΧΡΗΣΤΕΣ:
\`\`\`ai-action
{"action":"create_annual_plan","user_ids":["Γιάννης","Μαρία","Κώστας"],"training_days":[2,4,6],"days_per_week":3,"phases":[{"month":1,"phase":"corrective"},{"month":2,"phase":"stabilization"},{"month":3,"phase":"functional-hypertrophy"}]}
\`\`\`

ΠΑΡΑΔΕΙΓΜΑ ΔΙΑΓΡΑΦΗΣ ANNUAL PLAN:
\`\`\`ai-action
{"action":"delete_annual_plan","user_id":"Γιάννης Παπαδόπουλος","year":2025}
\`\`\`

📖 ΔΙΑΒΑΣΜΑ ANNUAL PLAN:
Για να δεις τον μακροκύκλο ενός χρήστη, χρησιμοποίησε τα δεδομένα από το section "📅 ΕΤΗΣΙΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ" που έχεις στο context.

ΥΠΕΝΘΥΜΙΣΗ:
- user_id: Βάλε ΟΝΟΜΑ ή email του χρήστη που θα ΛΑΒΕΙ τον μακροκύκλο
- user_ids: Array με ΟΝΟΜΑΤΑ ή emails για πολλαπλή ανάθεση
- phases: Array με objects που έχουν month (1-12) και phase (από τη λίστα παραπάνω)
- Αν ο χρήστης πει "για όλο τον χρόνο", δημιούργησε phases για όλους τους 12 μήνες
` : `
⚠️ Μόνο οι admin μπορούν να διαχειρίζονται τον ετήσιο προγραμματισμό.
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
          .filter((m: any) => m?.content && m.message_type === "user")
          .map((m: any) => ({
            role: "user" as const,
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
            "ΥΠΑΡΧΕΙ ΗΔΗ ΙΣΤΟΡΙΚΟ ΣΥΝΟΜΙΛΙΑΣ. ΜΗΝ δώσεις welcome message, ΜΗΝ συστηθείς, ΜΗΝ αλλάξεις θέμα. Απάντησε ΑΚΡΙΒΩΣ στο τελευταίο ερώτημα/αίτημα του χρήστη, σαν συνέχεια της συζήτησης." +
            ((isAdmin && !targetUserId)
              ? " ΕΙΣΑΙ ΣΕ ADMIN MODE ΜΕ ΠΛΗΡΗ ΠΡΟΣΒΑΣΗ. Αγνόησε παλιότερες απαντήσεις που έλεγαν ότι δεν έχεις πρόσβαση σε global unpaid subscriptions."
              : ""),
        }
      : null;

    const latestUserMessage = [...requestMessages]
      .reverse()
      .find((m: any) => m?.role === "user")?.content || "";

    const normalizeText = (text: string) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const normalizedLatestUserMessage = normalizeText(latestUserMessage);
    const asksForUnpaidSubscriptions =
      normalizedLatestUserMessage.includes("απληρωτ") &&
      normalizedLatestUserMessage.includes("συνδρομ");

    const directAdminUnpaidReply = isAdmin && !targetUserId && asksForUnpaidSubscriptions
      ? (adminGlobalUnpaidSubscriptions.length === 0
          ? "Δεν υπάρχουν απλήρωτες συνδρομές αυτή τη στιγμή."
          : `Βρήκα ${adminGlobalUnpaidSubscriptions.length} απλήρωτες συνδρομές:\n` +
            adminGlobalUnpaidSubscriptions
              .map(
                (sub: any, index: number) =>
                  `${index + 1}. ${sub.user_name || adminUserNameById[sub.user_id] || `Χρήστης ${sub.user_id}`} | ${sub.subscription_type_name || 'Άγνωστος τύπος'} | id: ${sub.id} | ${sub.start_date || '-'} → ${sub.end_date || '-'}${sub.is_paused ? ' [ΠΑΥΣΗ]' : ''}`
              )
              .join("\n"))
      : null;

    const createSyntheticSseResponse = (text: string) => {
      const syntheticEncoder = new TextEncoder();
      const syntheticStream = new ReadableStream({
        start(controller) {
          const payload = JSON.stringify({ choices: [{ delta: { content: text } }] });
          controller.enqueue(syntheticEncoder.encode(`data: ${payload}\n\n`));
          controller.enqueue(syntheticEncoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(syntheticStream, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
        },
      });
    };

    if (directAdminUnpaidReply) {
      console.log(`[ADMIN] Using deterministic global unpaid subscriptions reply. Count: ${adminGlobalUnpaidSubscriptions.length}`);
    }

    const response = directAdminUnpaidReply
      ? createSyntheticSseResponse(directAdminUnpaidReply)
      : await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
          // ✅ Robust SSE parsing (handles partial JSON across chunks)
          let textBuffer = "";
          let streamDone = false;

          while (!streamDone) {
            const { done, value } = await reader!.read();
            if (done) break;

            textBuffer += decoder.decode(value, { stream: true });

            let newlineIndex: number;
            while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
              let line = textBuffer.slice(0, newlineIndex);
              textBuffer = textBuffer.slice(newlineIndex + 1);

              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (line.startsWith(":")) continue; // keep-alive
              if (line.trim() === "") continue;
              if (!line.startsWith("data: ")) continue;

              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                streamDone = true;
                break;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) fullResponse += content;

                // Προωθούμε ακριβώς το ίδιο SSE line στον client
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              } catch {
                // Incomplete JSON split across chunks: put back & wait for more
                textBuffer = line + "\n" + textBuffer;
                break;
              }
            }
          }

          // Final flush (in case stream ended without trailing newline)
          if (textBuffer.trim()) {
            for (let raw of textBuffer.split("\n")) {
              if (!raw) continue;
              if (raw.endsWith("\r")) raw = raw.slice(0, -1);
              if (raw.startsWith(":")) continue;
              if (raw.trim() === "") continue;
              if (!raw.startsWith("data: ")) continue;

              const data = raw.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) fullResponse += content;
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              } catch {
                // ignore leftovers
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
