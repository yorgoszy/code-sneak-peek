import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProgramExercise {
  exercise_name: string;
  exercise_id?: string;
  sets: number;
  reps: string;
  reps_mode?: string; // 'reps' | 'time' | 'meter'
  kg?: string;
  kg_mode?: string;
  percentage_1rm?: number;
  velocity_ms?: string;
  tempo?: string;
  rest?: string;
  notes?: string;
}

interface ProgramBlock {
  name: string;
  training_type?: string;
  exercises: ProgramExercise[];
}

interface ProgramDay {
  name: string;
  blocks: ProgramBlock[];
}

interface ProgramWeek {
  name: string;
  days: ProgramDay[];
}

interface CreateProgramRequest {
  action: "create_program";
  name: string;
  description?: string;
  weeks: ProgramWeek[];
  // recipients
  user_id?: string; // uuid ή όνομα
  user_ids?: string[]; // uuids
  group_id?: string; // uuid
  training_dates?: string[];
}

interface AssignProgramRequest {
  action: "assign_program";
  program_id: string;
  user_id: string;
  training_dates: string[];
}

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const normalizeText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // αφαιρεί τόνους/διακριτικά

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    console.log("🤖 AI Program Action:", action, body);

    // Helper: Βρίσκει user_id από uuid/όνομα/email (και χωρίς τόνους)
    const resolveUserId = async (userIdOrName: string | undefined): Promise<string | undefined> => {
      if (!userIdOrName) return undefined;
      if (isUuid(userIdOrName)) return userIdOrName;

      const queryRaw = userIdOrName.trim();
      const queryNorm = normalizeText(queryRaw);

      // 1) Γρήγορο attempt μέσω ilike (όταν υπάρχει ακριβής αντιστοίχιση χαρακτήρων)
      {
        const { data: users, error } = await supabase
          .from("app_users")
          .select("id,name,email")
          .or(`name.ilike.%${queryRaw}%,email.ilike.%${queryRaw}%`)
          .limit(5);

        if (!error && users && users.length > 0) {
          // Προτιμάμε το πιο «σφιχτό» match με normalized σύγκριση
          const best = users
            .map((u) => ({
              u,
              score: Math.max(
                normalizeText(u.name || "").includes(queryNorm) ? 2 : 0,
                normalizeText(u.email || "").includes(queryNorm) ? 3 : 0
              ),
            }))
            .sort((a, b) => b.score - a.score)[0]?.u;

          if (best?.id) return best.id;
          return users[0].id;
        }
      }

      // 2) Fallback: fetch sample χρηστών και κάνε matching σε code (για περιπτώσεις χωρίς τόνους)
      {
        const { data: users, error } = await supabase
          .from("app_users")
          .select("id,name,email")
          .limit(1000);

        if (error || !users) return undefined;

        const matched = users.filter((u) => {
          const name = normalizeText(u.name || "");
          const email = normalizeText(u.email || "");
          return name.includes(queryNorm) || email.includes(queryNorm);
        });

        if (matched.length === 1) return matched[0].id;
        if (matched.length > 1) {
          // αν υπάρχουν πολλοί, πάρε τον πρώτο αλλά κάνε log για να το βλέπουμε
          console.log("⚠️ Multiple users matched query:", queryRaw, matched.map((m) => ({ id: m.id, name: m.name, email: m.email })));
          return matched[0].id;
        }
      }

      return undefined;
    };

    if (action === "create_program") {
      const {
        name,
        description,
        weeks,
        user_id: rawUserId,
        user_ids: rawUserIds,
        group_id: rawGroupId,
        training_dates,
      } = body as CreateProgramRequest;

      // 1) Create program
      const { data: program, error: programError } = await supabase
        .from("programs")
        .insert({
          name,
          description: description || "",
          status: "draft",
          type: "strength",
          duration: weeks?.length || 1,
          training_days: weeks?.[0]?.days?.length || 1,
        })
        .select("*")
        .single();

      if (programError || !program) {
        console.error("❌ Error creating program:", programError);
        throw new Error("Σφάλμα δημιουργίας προγράμματος");
      }

      console.log("✅ Program created:", program.id);

      // 2) Build structure (weeks/days/blocks/exercises)
      if (weeks && weeks.length > 0) {
        for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
          const week = weeks[weekIndex];

          const { data: savedWeek, error: weekError } = await supabase
            .from("program_weeks")
            .insert({
              program_id: program.id,
              name: week.name || `Εβδομάδα ${weekIndex + 1}`,
              week_number: weekIndex + 1,
            })
            .select("*")
            .single();

          if (weekError || !savedWeek) {
            console.error("❌ Error creating week:", weekError);
            continue;
          }

          if (week.days && week.days.length > 0) {
            for (let dayIndex = 0; dayIndex < week.days.length; dayIndex++) {
              const day = week.days[dayIndex];

              const { data: savedDay, error: dayError } = await supabase
                .from("program_days")
                .insert({
                  week_id: savedWeek.id,
                  name: day.name || `Ημέρα ${dayIndex + 1}`,
                  day_number: dayIndex + 1,
                  estimated_duration_minutes: 60,
                })
                .select("*")
                .single();

              if (dayError || !savedDay) {
                console.error("❌ Error creating day:", dayError);
                continue;
              }

              if (day.blocks && day.blocks.length > 0) {
                for (let blockIndex = 0; blockIndex < day.blocks.length; blockIndex++) {
                  const block = day.blocks[blockIndex];

                  const { data: savedBlock, error: blockError } = await supabase
                    .from("program_blocks")
                    .insert({
                      day_id: savedDay.id,
                      name: block.name || `Block ${blockIndex + 1}`,
                      block_order: blockIndex + 1,
                      training_type: block.training_type || null,
                    })
                    .select("*")
                    .single();

                  if (blockError || !savedBlock) {
                    console.error("❌ Error creating block:", blockError);
                    continue;
                  }

                  if (block.exercises && block.exercises.length > 0) {
                    for (let exIndex = 0; exIndex < block.exercises.length; exIndex++) {
                      const exercise = block.exercises[exIndex];

                      // resolve exercise_id - προτίμηση σε ΑΚΡΙΒΕΣ match
                      let exerciseId = exercise.exercise_id;
                      if (!exerciseId && exercise.exercise_name) {
                        const searchName = exercise.exercise_name.trim();
                        const searchNorm = normalizeText(searchName);

                        // 1) Πρώτα δοκίμασε ΑΚΡΙΒΕΣ match (case-insensitive)
                        const { data: exactMatch } = await supabase
                          .from("exercises")
                          .select("id,name")
                          .ilike("name", searchName)
                          .limit(1);

                        if (exactMatch && exactMatch.length > 0) {
                          exerciseId = exactMatch[0].id;
                          console.log(`✅ Exact match: "${searchName}" -> "${exactMatch[0].name}"`);
                        } else {
                          // 2) Αν δεν βρεθεί, δοκίμασε partial match αλλά με scoring
                          const { data: partialMatches } = await supabase
                            .from("exercises")
                            .select("id,name")
                            .ilike("name", `%${searchName}%`)
                            .limit(20);

                          if (partialMatches && partialMatches.length > 0) {
                            // Βρες το καλύτερο match με βάση similarity
                            const scored = partialMatches.map((ex) => {
                              const exNorm = normalizeText(ex.name);
                              // Προτίμησε όσο πιο κοντά είναι το μήκος στο search term
                              const lengthDiff = Math.abs(exNorm.length - searchNorm.length);
                              // Bonus αν ξεκινά με το search term
                              const startsBonus = exNorm.startsWith(searchNorm) ? 100 : 0;
                              // Bonus αν είναι ακριβώς ίδιο (normalized)
                              const exactBonus = exNorm === searchNorm ? 200 : 0;
                              return { ex, score: exactBonus + startsBonus - lengthDiff };
                            });
                            scored.sort((a, b) => b.score - a.score);
                            exerciseId = scored[0].ex.id;
                            console.log(`🔍 Partial match: "${searchName}" -> "${scored[0].ex.name}" (score: ${scored[0].score})`);
                          } else {
                            console.log(`⚠️ Exercise "${exercise.exercise_name}" not found, skipping`);
                            continue;
                          }
                        }
                      }

                      if (!exerciseId) continue;

                      const { error: peError } = await supabase.from("program_exercises").insert({
                        block_id: savedBlock.id,
                        exercise_id: exerciseId,
                        sets: exercise.sets || 3,
                        reps: exercise.reps || "10",
                        reps_mode: exercise.reps_mode || "reps",
                        kg: exercise.kg || "",
                        kg_mode: exercise.kg_mode || "kg",
                        percentage_1rm: exercise.percentage_1rm || null,
                        velocity_ms: exercise.velocity_ms || null,
                        tempo: exercise.tempo || "",
                        rest: exercise.rest || "60",
                        notes: exercise.notes || "",
                        exercise_order: exIndex + 1,
                      });

                      if (peError) {
                        console.error("❌ Error creating program_exercise:", peError);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      // 3) Assign (supports user_id, user_ids, group_id)
      const sortedDates = (training_dates && training_dates.length > 0)
        ? [...training_dates].sort()
        : null;

      const assignmentBase = sortedDates
        ? {
            program_id: program.id,
            training_dates,
            status: "active",
            start_date: sortedDates[0],
            end_date: sortedDates[sortedDates.length - 1],
          }
        : null;

      let assignment: any = null;
      let assignments: any[] | null = null;

      if (assignmentBase && rawGroupId) {
        // Group assignment
        const { data: groupAssignment, error: gaError } = await supabase
          .from("program_assignments")
          .insert({
            ...assignmentBase,
            assignment_type: "group",
            is_group_assignment: true,
            group_id: rawGroupId,
            user_id: null,
          })
          .select("*")
          .single();

        if (gaError || !groupAssignment) {
          console.error("❌ Error creating group assignment:", gaError);
          throw new Error("Σφάλμα ανάθεσης σε ομάδα");
        }

        // Create mapping rows
        const { data: members, error: membersError } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", rawGroupId);

        if (membersError) {
          console.error("❌ Error fetching group members:", membersError);
        } else if (members && members.length > 0) {
          const rows = members
            .map((m) => m.user_id)
            .filter(Boolean)
            .map((uid) => ({
              group_assignment_id: groupAssignment.id,
              user_id: uid,
            }));

          if (rows.length > 0) {
            const { error: gauError } = await supabase.from("group_assignment_users").insert(rows);
            if (gauError) console.error("❌ Error inserting group_assignment_users:", gauError);
          }
        }

        assignment = groupAssignment;
      } else if (assignmentBase && Array.isArray(rawUserIds) && rawUserIds.length > 0) {
        // Multi user assignments
        const resolvedIds = rawUserIds.filter(Boolean);

        const rows = resolvedIds.map((uid) => ({
          ...assignmentBase,
          assignment_type: "individual",
          is_group_assignment: false,
          group_id: null,
          user_id: uid,
        }));

        const { data: created, error: aError } = await supabase
          .from("program_assignments")
          .insert(rows)
          .select("*");

        if (aError) {
          console.error("❌ Error creating multi assignments:", aError);
          throw new Error("Σφάλμα ανάθεσης σε χρήστες");
        }

        assignments = created || [];
      } else if (assignmentBase) {
        // Single user assignment (uuid or name/email)
        const resolvedUserId = await resolveUserId(rawUserId);

        if (resolvedUserId) {
          const { data: created, error: aError } = await supabase
            .from("program_assignments")
            .insert({
              ...assignmentBase,
              assignment_type: "individual",
              is_group_assignment: false,
              group_id: null,
              user_id: resolvedUserId,
            })
            .select("*")
            .single();

          if (aError || !created) {
            console.error("❌ Error creating assignment:", aError);
            throw new Error("Σφάλμα ανάθεσης προγράμματος");
          }

          assignment = created;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          program,
          assignment,
          assignments,
          message:
            assignment || (assignments && assignments.length > 0)
              ? `Το πρόγραμμα "${name}" δημιουργήθηκε και ανατέθηκε επιτυχώς!`
              : `Το πρόγραμμα "${name}" δημιουργήθηκε επιτυχώς!`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "assign_program") {
      const { program_id, user_id, training_dates } = body as AssignProgramRequest;

      if (!program_id || !user_id || !training_dates || training_dates.length === 0) {
        throw new Error("Λείπουν απαραίτητα πεδία για την ανάθεση");
      }

      const resolvedUserId = await resolveUserId(user_id);
      if (!resolvedUserId) throw new Error("Δεν βρέθηκε ο χρήστης για ανάθεση");

      const sortedDates = [...training_dates].sort();

      const { data: assignment, error } = await supabase
        .from("program_assignments")
        .insert({
          program_id,
          user_id: resolvedUserId,
          training_dates,
          status: "active",
          assignment_type: "individual",
          is_group_assignment: false,
          start_date: sortedDates[0],
          end_date: sortedDates[sortedDates.length - 1],
        })
        .select("*")
        .single();

      if (error || !assignment) {
        console.error("❌ Error assigning program:", error);
        throw new Error("Σφάλμα ανάθεσης προγράμματος");
      }

      return new Response(
        JSON.stringify({
          success: true,
          assignment,
          message: "Το πρόγραμμα ανατέθηκε επιτυχώς!",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ===================== SUBSCRIPTION MANAGEMENT =====================
    if (action === "create_subscription") {
      const { user_id: rawUserId, subscription_type_id, start_date, notes } = body;
      
      if (!rawUserId || !subscription_type_id) {
        throw new Error("Λείπουν απαραίτητα πεδία (user_id, subscription_type_id)");
      }

      const resolvedUserId = await resolveUserId(rawUserId);
      if (!resolvedUserId) throw new Error(`Δεν βρέθηκε χρήστης: ${rawUserId}`);

      // Get subscription type to calculate end_date
      const { data: subType, error: stError } = await supabase
        .from("subscription_types")
        .select("*")
        .eq("id", subscription_type_id)
        .single();
      
      if (stError || !subType) throw new Error("Δεν βρέθηκε ο τύπος συνδρομής");

      const startDate = start_date || new Date().toISOString().split('T')[0];
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(startDateObj);
      endDateObj.setMonth(endDateObj.getMonth() + (subType.duration_months || 1));
      endDateObj.setDate(endDateObj.getDate() - 1);
      const endDate = endDateObj.toISOString().split('T')[0];

      // Check user's coach_id to determine which table to use
      const { data: userData } = await supabase
        .from("app_users")
        .select("id, name, coach_id, role")
        .eq("id", resolvedUserId)
        .single();

      // Check if the coach is a 'coach' role user
      let useCoachSubscriptions = false;
      if (userData?.coach_id) {
        const { data: coachData } = await supabase
          .from("app_users")
          .select("role")
          .eq("id", userData.coach_id)
          .single();
        useCoachSubscriptions = coachData?.role === 'coach';
      }

      let subscription;
      if (useCoachSubscriptions) {
        // Find the coach_user record
        const { data: coachUser } = await supabase
          .from("coach_users")
          .select("id")
          .eq("coach_id", userData!.coach_id!)
          .eq("email", (await supabase.from("app_users").select("email").eq("id", resolvedUserId).single()).data?.email || '')
          .maybeSingle();

        const { data: sub, error: subError } = await supabase
          .from("coach_subscriptions")
          .insert({
            coach_id: userData!.coach_id!,
            coach_user_id: coachUser?.id || null,
            user_id: resolvedUserId,
            subscription_type_id,
            start_date: startDate,
            end_date: endDate,
            status: "active",
            is_paid: false,
            notes: notes || "Δημιουργήθηκε από AI βοηθό",
          })
          .select("*")
          .single();
        
        if (subError) throw new Error(`Σφάλμα δημιουργίας συνδρομής: ${subError.message}`);
        subscription = sub;
      } else {
        const { data: sub, error: subError } = await supabase
          .from("user_subscriptions")
          .insert({
            user_id: resolvedUserId,
            subscription_type_id,
            start_date: startDate,
            end_date: endDate,
            status: "active",
            notes: notes || "Δημιουργήθηκε από AI βοηθό",
          })
          .select("*")
          .single();
        
        if (subError) throw new Error(`Σφάλμα δημιουργίας συνδρομής: ${subError.message}`);
        subscription = sub;
      }

      // Update user subscription status
      await supabase
        .from("app_users")
        .update({ subscription_status: "active" })
        .eq("id", resolvedUserId);

      return new Response(
        JSON.stringify({
          success: true,
          subscription,
          message: `Η συνδρομή "${subType.name}" δημιουργήθηκε για τον ${userData?.name || rawUserId}! (${startDate} - ${endDate})`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "pause_subscription") {
      const { subscription_id, table } = body;
      if (!subscription_id) throw new Error("Λείπει το subscription_id");

      const tableName = table === 'coach_subscriptions' ? 'coach_subscriptions' : 'user_subscriptions';
      
      const { data: sub } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", subscription_id)
        .single();
      
      if (!sub) throw new Error("Δεν βρέθηκε η συνδρομή");

      const daysRemaining = Math.max(0, Math.ceil((new Date(sub.end_date).getTime() - Date.now()) / (1000 * 3600 * 24)));

      const { error } = await supabase
        .from(tableName)
        .update({
          is_paused: true,
          paused_at: new Date().toISOString(),
          paused_days_remaining: daysRemaining,
        })
        .eq("id", subscription_id);

      if (error) throw new Error(`Σφάλμα παύσης: ${error.message}`);

      // Update user status
      await supabase
        .from("app_users")
        .update({ subscription_status: "inactive" })
        .eq("id", sub.user_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Η συνδρομή τέθηκε σε παύση! (${daysRemaining} ημέρες υπόλοιπο)`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "resume_subscription") {
      const { subscription_id, table } = body;
      if (!subscription_id) throw new Error("Λείπει το subscription_id");

      const tableName = table === 'coach_subscriptions' ? 'coach_subscriptions' : 'user_subscriptions';
      
      const { data: sub } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", subscription_id)
        .single();
      
      if (!sub) throw new Error("Δεν βρέθηκε η συνδρομή");

      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + (sub.paused_days_remaining || 0));

      const { error } = await supabase
        .from(tableName)
        .update({
          is_paused: false,
          paused_at: null,
          end_date: newEndDate.toISOString().split('T')[0],
          paused_days_remaining: null,
        })
        .eq("id", subscription_id);

      if (error) throw new Error(`Σφάλμα επαναφοράς: ${error.message}`);

      await supabase
        .from("app_users")
        .update({ subscription_status: "active" })
        .eq("id", sub.user_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Η συνδρομή επαναφέρθηκε! Νέα λήξη: ${newEndDate.toISOString().split('T')[0]}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "renew_subscription") {
      const { subscription_id, table } = body;
      if (!subscription_id) throw new Error("Λείπει το subscription_id");

      const tableName = table === 'coach_subscriptions' ? 'coach_subscriptions' : 'user_subscriptions';
      
      const { data: sub } = await supabase
        .from(tableName)
        .select("*, subscription_types(*)")
        .eq("id", subscription_id)
        .single();
      
      if (!sub) throw new Error("Δεν βρέθηκε η συνδρομή");

      const newStartDate = new Date(sub.end_date);
      newStartDate.setDate(newStartDate.getDate() + 1);
      const newEndDate = new Date(newStartDate);
      newEndDate.setMonth(newEndDate.getMonth() + (sub.subscription_types?.duration_months || 1));
      newEndDate.setDate(newEndDate.getDate() - 1);

      const insertData: any = {
        user_id: sub.user_id,
        subscription_type_id: sub.subscription_type_id,
        start_date: newStartDate.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0],
        status: "active",
        is_paid: false,
      };

      if (tableName === 'coach_subscriptions') {
        insertData.coach_id = sub.coach_id;
        insertData.coach_user_id = sub.coach_user_id;
      }

      const { data: newSub, error } = await supabase
        .from(tableName)
        .insert(insertData)
        .select("*")
        .single();

      if (error) throw new Error(`Σφάλμα ανανέωσης: ${error.message}`);

      await supabase
        .from("app_users")
        .update({ subscription_status: "active" })
        .eq("id", sub.user_id);

      return new Response(
        JSON.stringify({
          success: true,
          subscription: newSub,
          message: `Η συνδρομή ανανεώθηκε! (${newStartDate.toISOString().split('T')[0]} - ${newEndDate.toISOString().split('T')[0]})`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ===================== BOOKING MANAGEMENT =====================
    if (action === "create_booking") {
      const { user_id: rawUserId, section_id, booking_date, booking_time, booking_type, notes } = body;
      
      if (!rawUserId || !section_id || !booking_date || !booking_time) {
        throw new Error("Λείπουν απαραίτητα πεδία (user_id, section_id, booking_date, booking_time)");
      }

      const resolvedUserId = await resolveUserId(rawUserId);
      if (!resolvedUserId) throw new Error(`Δεν βρέθηκε χρήστης: ${rawUserId}`);

      // Check capacity
      const { data: section } = await supabase
        .from("booking_sections")
        .select("max_capacity, name")
        .eq("id", section_id)
        .single();

      const { count: existingBookings } = await supabase
        .from("booking_sessions")
        .select("*", { count: "exact", head: true })
        .eq("section_id", section_id)
        .eq("booking_date", booking_date)
        .eq("booking_time", booking_time)
        .neq("status", "cancelled");

      if (section && existingBookings !== null && existingBookings >= section.max_capacity) {
        throw new Error(`Η ώρα ${booking_time} στο ${section.name} είναι πλήρης (${existingBookings}/${section.max_capacity})`);
      }

      const { data: booking, error: bookError } = await supabase
        .from("booking_sessions")
        .insert({
          user_id: resolvedUserId,
          section_id,
          booking_date,
          booking_time,
          booking_type: booking_type || "gym_visit",
          status: "confirmed",
          notes: notes || "Κράτηση από AI βοηθό",
        })
        .select("*")
        .single();

      if (bookError) throw new Error(`Σφάλμα κράτησης: ${bookError.message}`);

      return new Response(
        JSON.stringify({
          success: true,
          booking,
          message: `Η κράτηση δημιουργήθηκε! ${section?.name || ''} - ${booking_date} ${booking_time}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "cancel_booking") {
      const { booking_id } = body;
      if (!booking_id) throw new Error("Λείπει το booking_id");

      const { error } = await supabase
        .from("booking_sessions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", booking_id);

      if (error) throw new Error(`Σφάλμα ακύρωσης: ${error.message}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Η κράτηση ακυρώθηκε!",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    throw new Error(`Άγνωστη ενέργεια: ${action}`);
  } catch (error) {
    console.error("AI Program Action error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
