import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAY_LABELS_EL: Record<string, string> = {
  monday: "Δευτέρα",
  tuesday: "Τρίτη",
  wednesday: "Τετάρτη",
  thursday: "Πέμπτη",
  friday: "Παρασκευή",
  saturday: "Σάββατο",
  sunday: "Κυριακή",
};

const DAY_LABELS_EN: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function formatRoundGuide(language: "el" | "en") {
  return language === "en"
    ? "R32=Round of 32 | R16=Round of 16 | R8=Quarterfinals | R4=Semifinals | R2=Final | R1=Winner"
    : "R32=Φάση των 32 | R16=Φάση των 16 | R8=Προημιτελικά | R4=Ημιτελικά | R2=Τελικός | R1=Νικητής";
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ς/g, "σ")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeLike(value: string) {
  return value.replace(/[%_]/g, "");
}

function parseAthleteClubLookup(message: string) {
  const match = message.match(/([^\[\]\n]+?)\s*\[([^\]]+)\]/);
  if (!match) return null;

  const athleteName = match[1].trim();
  const clubName = match[2].trim();
  if (!athleteName || !clubName) return null;

  return { athleteName, clubName };
}

function isCompetitionLookupIntent(message: string) {
  const normalized = normalizeSearchText(message);
  const keywords = ["κληρωση", "αγωνα", "αγωνα", "παιζω", "παιζει", "αντιπαλο", "bracket", "draw", "match"];
  return keywords.some((keyword) => normalized.includes(keyword));
}

function sseFromText(content: string) {
  const payload = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
  return `${payload}data: [DONE]\n\n`;
}

async function lookupAthleteCompetitionAnswer(
  supabase: any,
  lastUserMessage: string,
  language: "el" | "en"
) {
  if (!isCompetitionLookupIntent(lastUserMessage)) return null;

  const parsed = parseAthleteClubLookup(lastUserMessage);
  if (!parsed) return null;

  const athleteLike = `%${escapeLike(parsed.athleteName)}%`;
  const clubLike = `%${escapeLike(parsed.clubName)}%`;

  const { data: rows } = await supabase
    .from("competition_matches")
    .select("id, match_order, match_number, status, scheduled_time, ring_number, athlete1:app_users!competition_matches_athlete1_id_fkey(name), athlete2:app_users!competition_matches_athlete2_id_fkey(name), athlete1_club:app_users!competition_matches_athlete1_club_id_fkey(name), athlete2_club:app_users!competition_matches_athlete2_club_id_fkey(name), category:federation_competition_categories!competition_matches_category_id_fkey(name), competition:federation_competitions!competition_matches_competition_id_fkey(id,name,competition_date)")
    .or(`athlete1.name.ilike.${athleteLike},athlete2.name.ilike.${athleteLike}`)
    .order("match_order", { ascending: true, nullsFirst: false })
    .limit(100);

  if (!Array.isArray(rows) || rows.length === 0) return null;

  const athleteNeedle = normalizeSearchText(parsed.athleteName);
  const clubNeedle = normalizeSearchText(parsed.clubName);

  const matches = rows.filter((row: any) => {
    const athlete1 = normalizeSearchText(row.athlete1?.name || "");
    const athlete2 = normalizeSearchText(row.athlete2?.name || "");
    const club1 = normalizeSearchText(row.athlete1_club?.name || "");
    const club2 = normalizeSearchText(row.athlete2_club?.name || "");

    const athleteMatched = athlete1.includes(athleteNeedle) || athlete2.includes(athleteNeedle);
    const clubMatched = club1.includes(clubNeedle) || club2.includes(clubNeedle);

    return athleteMatched && clubMatched;
  });

  if (matches.length === 0) return null;

  const lines = matches.slice(0, 3).map((row: any) => {
    const athlete1 = row.athlete1?.name || "TBD";
    const athlete2 = row.athlete2?.name || "TBD";
    const competitionName = row.competition?.name || "τη διοργάνωση";
    const competitionDate = row.competition?.competition_date || "-";
    const order = row.match_order || row.match_number || "-";
    const ring = row.ring_number ? `, ring ${row.ring_number}` : "";
    const time = row.scheduled_time
      ? `, ${new Date(row.scheduled_time).toLocaleTimeString(language === "en" ? "en-GB" : "el-GR", { hour: "2-digit", minute: "2-digit" })}`
      : "";
    const category = row.category?.name ? ` [${row.category.name}]` : "";
    return language === "en"
      ? `- ${competitionName} (${competitionDate}): match #${order}${ring}${time} — ${athlete1} vs ${athlete2}${category}`
      : `- ${competitionName} (${competitionDate}): αγώνας #${order}${ring}${time} — ${athlete1} vs ${athlete2}${category}`;
  });

  const intro = language === "en"
    ? `Yes, the draw is out. I found ${matches.length === 1 ? "this match" : `${matches.length} matches`} for ${parsed.athleteName} [${parsed.clubName}]:`
    : `Ναι, η κλήρωση έχει βγει. Βρήκα ${matches.length === 1 ? "τον εξής αγώνα" : `τους εξής ${matches.length} αγώνες`} για ${parsed.athleteName} [${parsed.clubName}]:`;

  return [intro, ...lines].join("\n");
}

async function buildCompetitionsContext(supabase: any, language: "el" | "en") {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const detailStart = new Date(today.getTime() - 7 * 86400000);
  const detailEnd = new Date(today.getTime() + 30 * 86400000);

  const { data: comps } = await supabase
    .from("federation_competitions")
    .select("id, name, location, competition_date, end_date, status, federation:app_users!federation_competitions_federation_id_fkey(name)")
    .order("competition_date", { ascending: true })
    .limit(40);

  if (!comps || comps.length === 0) return "";

  const lines: string[] = [
    language === "en"
      ? `🥊 LIVE COMPETITIONS ON THE PLATFORM (today: ${todayStr}):`
      : `🥊 ΑΓΩΝΕΣ ΣΤΗΝ ΠΛΑΤΦΟΡΜΑ (σήμερα: ${todayStr}):`,
    "",
  ];

  for (const comp of comps as any[]) {
    const fedName = comp.federation?.name || "-";
    const isToday = comp.competition_date === todayStr;
    const tag = isToday ? (language === "en" ? "🔴 TODAY" : "🔴 ΣΗΜΕΡΑ") : comp.competition_date > todayStr ? "📅" : "📜";
    lines.push(`${tag} ${comp.name} — ${fedName} (competition_id=${comp.id})`);
    lines.push(`   📍 ${comp.location || "-"} | ${comp.competition_date}${comp.end_date ? ` → ${comp.end_date}` : ""} | Status: ${comp.status}`);

    const compDate = new Date(comp.competition_date);
    const shouldIncludeDetails = !Number.isNaN(compDate.getTime()) && compDate >= detailStart && compDate <= detailEnd;
    if (!shouldIncludeDetails) {
      lines.push("");
      continue;
    }

    const [matchesResult, ringsResult, weighsResult] = await Promise.all([
      supabase
        .from("competition_matches")
        .select("id, match_order, match_number, status, winner_id, scheduled_time, ring_number, is_bye, athlete1_id, athlete2_id, athlete1:app_users!competition_matches_athlete1_id_fkey(name), athlete2:app_users!competition_matches_athlete2_id_fkey(name), athlete1_club:app_users!competition_matches_athlete1_club_id_fkey(name), athlete2_club:app_users!competition_matches_athlete2_club_id_fkey(name), category:federation_competition_categories!competition_matches_category_id_fkey(name)")
        .eq("competition_id", comp.id)
        .order("match_order", { ascending: true, nullsFirst: false })
        .limit(500),
      supabase
        .from("competition_rings")
        .select("ring_number, ring_name, youtube_live_url, is_active, current_match_id, timer_current_round, timer_is_break, match_range_start, match_range_end")
        .eq("competition_id", comp.id)
        .order("ring_number", { ascending: true }),
      supabase
        .from("federation_competition_registrations")
        .select("weigh_in_weight, weigh_in_status, athlete:app_users!federation_competition_registrations_athlete_id_fkey(name), club:app_users!federation_competition_registrations_club_id_fkey(name), category:federation_competition_categories(name,min_weight,max_weight)")
        .eq("competition_id", comp.id)
        .in("weigh_in_status", ["passed", "failed"])
        .limit(300),
    ]);

    const matches = (matchesResult as any)?.data;
    const rings = (ringsResult as any)?.data;
    const weighs = (weighsResult as any)?.data;

    const validMatches = Array.isArray(matches) ? matches.filter((m: any) => !m.is_bye) : [];

    if (Array.isArray(rings) && rings.length > 0) {
      lines.push(language === "en" ? "   📺 RINGS:" : "   📺 RINGS:");
      for (const ring of rings as any[]) {
        const live = ring.is_active ? "🔴 LIVE" : "⚪";
        const liveLink = ring.youtube_live_url ? ` 🎥 LIVE: ${ring.youtube_live_url}` : language === "en" ? " (no live link yet)" : " (χωρίς live link ακόμη)";
        lines.push(`      Ring ${ring.ring_number} (${ring.ring_name || "-"}) ${live}${liveLink}`);

        const currentMatch: any = ring.current_match_id
          ? validMatches.find((m: any) => m.id === ring.current_match_id)
          : null;

        if (currentMatch) {
          lines.push(
            `         🥊 ${language === "en" ? "Now" : "Τώρα"}: #${currentMatch.match_order || currentMatch.match_number} ${currentMatch.athlete1?.name || "TBD"} vs ${currentMatch.athlete2?.name || "TBD"} [${currentMatch.category?.name || ""}] (${language === "en" ? "Round" : "Γύρος"} ${ring.timer_current_round || 1}${ring.timer_is_break ? " BREAK" : ""})`
          );
        }

        if (ring.match_range_start && ring.match_range_end) {
          const upcoming = validMatches
            .filter(
              (m: any) =>
                m.match_order &&
                m.match_order >= ring.match_range_start &&
                m.match_order <= ring.match_range_end &&
                m.status !== "completed" &&
                m.id !== ring.current_match_id
            )
            .sort((a: any, b: any) => (a.match_order || 0) - (b.match_order || 0));

          upcoming.forEach((m: any) => {
            lines.push(`         ⏭️ #${m.match_order}: ${m.athlete1?.name || "TBD"} vs ${m.athlete2?.name || "TBD"} [${m.category?.name || ""}]`);
          });
        }
      }
    }

    if (validMatches.length > 0) {
      lines.push(
        language === "en"
          ? `   🥊 DRAW / MATCHES / BRACKETS (${validMatches.length} matches — THE DRAW IS OUT):`
          : `   🥊 ΚΛΗΡΩΣΗ / ΑΓΩΝΕΣ / BRACKETS (${validMatches.length} αγώνες — Η ΚΛΗΡΩΣΗ ΕΧΕΙ ΒΓΕΙ):`
      );
      lines.push(
        language === "en"
          ? `   ℹ️ ROUND GUIDE (prefer human-friendly names): ${formatRoundGuide(language)}`
          : `   ℹ️ ΕΠΕΞΗΓΗΣΗ ΓΥΡΩΝ (χρησιμοποίησε ανθρώπινους όρους): ${formatRoundGuide(language)}`
      );

      validMatches.forEach((m: any) => {
        const status = m.status === "completed" ? "✅" : m.status === "in_progress" ? "🔴" : "⏳";
        const winner = m.winner_id ? (m.winner_id === m.athlete1_id ? m.athlete1?.name : m.athlete2?.name) : null;
        const ring = m.ring_number ? ` Ring${m.ring_number}` : "";
        const time = m.scheduled_time
          ? ` ${new Date(m.scheduled_time).toLocaleTimeString(language === "en" ? "en-GB" : "el-GR", { hour: "2-digit", minute: "2-digit" })}`
          : "";
        const club1 = m.athlete1_club?.name ? ` [${m.athlete1_club.name}]` : "";
        const club2 = m.athlete2_club?.name ? ` [${m.athlete2_club.name}]` : "";
        lines.push(
          `      ${status} #${m.match_order || m.match_number}${ring}${time}: ${m.athlete1?.name || "TBD"}${club1} vs ${m.athlete2?.name || "TBD"}${club2}${winner ? ` → 🏆 ${winner}` : ""} [${m.category?.name || ""}]`
        );
      });
    } else {
      lines.push(
        language === "en"
          ? "   ⚠️ No draw / published matches found in the current data for this competition yet."
          : "   ⚠️ Δεν βρέθηκαν ακόμη δημοσιευμένοι αγώνες / κλήρωση στα τρέχοντα δεδομένα για αυτή τη διοργάνωση."
      );
    }

    if (Array.isArray(weighs) && weighs.length > 0) {
      lines.push(language === "en" ? `   ⚖️ WEIGH-INS (${weighs.length}):` : `   ⚖️ ΖΥΓΙΣΕΙΣ (${weighs.length}):`);
      weighs.forEach((w: any) => {
        const ok = w.weigh_in_status === "passed" ? "✅" : "❌";
        const club = w.club?.name ? ` [${w.club.name}]` : "";
        lines.push(`      ${ok} ${w.athlete?.name || "?"}${club}: ${w.weigh_in_weight || "?"}kg [${w.category?.name || "-"}]`);
      });
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

async function buildLoggedInUserContext(
  supabase: any,
  authHeader: string | null,
  language: "el" | "en"
): Promise<string> {
  if (!authHeader?.startsWith("Bearer ")) return "";
  try {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!anonKey) return "";
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) return "";

    const { data: profileRows } = await supabase
      .from("app_users")
      .select("id,name,email,phone,birth_date,gender,category,role,user_status,subscription_status,coach_id")
      .eq("auth_user_id", user.id)
      .limit(1);
    const profile = Array.isArray(profileRows) ? profileRows[0] : null;
    if (!profile?.id) return "";

    const role = (profile.role || "general").toLowerCase();
    const isAdmin = role === "admin";
    const isCoach = role === "coach" || role === "trainer";
    const isFederation = role === "federation";

    // Determine target athlete IDs based on role/mode
    let athleteIds: string[] = [profile.id];
    let scopeLabel = language === "en" ? "Personal data only" : "Μόνο προσωπικά δεδομένα";

    if (isAdmin) {
      scopeLabel = language === "en" ? "ADMIN MODE — full database access" : "ADMIN MODE — πλήρης πρόσβαση στη βάση";
      // For admin, we don't pre-load all athletes (too much). Fetch on demand by name in queries.
      athleteIds = [profile.id];
    } else if (isCoach) {
      const { data: coachAthletes } = await supabase
        .from("app_users")
        .select("id")
        .eq("coach_id", profile.id);
      athleteIds = [profile.id, ...(coachAthletes || []).map((a: any) => a.id)];
      scopeLabel = language === "en"
        ? `COACH MODE — ${athleteIds.length - 1} athletes`
        : `COACH MODE — ${athleteIds.length - 1} αθλητές`;
    } else if (isFederation) {
      const { data: fedAthletes } = await supabase
        .from("athlete_federations")
        .select("athlete_id")
        .eq("federation_id", profile.id)
        .eq("is_active", true);
      athleteIds = [profile.id, ...(fedAthletes || []).map((a: any) => a.athlete_id)];
      scopeLabel = language === "en"
        ? `FEDERATION MODE — ${athleteIds.length - 1} athletes`
        : `FEDERATION MODE — ${athleteIds.length - 1} αθλητές`;
    }

    // Fetch all tests for the user themselves (always)
    const myId = profile.id;
    const [anth, strength, endurance, jump, functional] = await Promise.all([
      supabase.from("anthropometric_test_data")
        .select("weight,body_fat_percentage,muscle_mass_percentage,height,anthropometric_test_sessions!inner(test_date,user_id)")
        .eq("anthropometric_test_sessions.user_id", myId)
        .order("created_at", { ascending: false }).limit(5),
      supabase.from("strength_test_attempts")
        .select("weight_kg,velocity_ms,is_1rm,exercises(name),strength_test_sessions!inner(test_date,user_id)")
        .eq("strength_test_sessions.user_id", myId)
        .order("created_at", { ascending: false }).limit(15),
      supabase.from("endurance_test_data")
        .select("vo2_max,mas_kmh,push_ups,pull_ups,crunches,endurance_test_sessions!inner(test_date,user_id)")
        .eq("endurance_test_sessions.user_id", myId)
        .order("created_at", { ascending: false }).limit(5),
      supabase.from("jump_test_data")
        .select("counter_movement_jump,non_counter_movement_jump,broad_jump,depth_jump,jump_test_sessions!inner(test_date,user_id)")
        .eq("jump_test_sessions.user_id", myId)
        .order("created_at", { ascending: false }).limit(5),
      supabase.from("functional_test_data")
        .select("fms_score,sit_and_reach,flamingo_balance,functional_test_sessions!inner(test_date,user_id)")
        .eq("functional_test_sessions.user_id", myId)
        .order("created_at", { ascending: false }).limit(5),
    ]);

    const lines: string[] = [];
    lines.push(language === "en"
      ? `👤 LOGGED-IN USER (private context — use only for them):`
      : `👤 ΣΥΝΔΕΔΕΜΕΝΟΣ ΧΡΗΣΤΗΣ (ιδιωτικό context — μόνο για τον ίδιο):`);
    lines.push(`- ${language === "en" ? "Name" : "Όνομα"}: ${profile.name || "—"}`);
    lines.push(`- Email: ${profile.email || "—"}`);
    if (profile.phone) lines.push(`- ${language === "en" ? "Phone" : "Τηλέφωνο"}: ${profile.phone}`);
    if (profile.birth_date) lines.push(`- ${language === "en" ? "Birth date" : "Ημ/νία γέννησης"}: ${profile.birth_date}`);
    if (profile.gender) lines.push(`- ${language === "en" ? "Gender" : "Φύλο"}: ${profile.gender}`);
    if (profile.role) lines.push(`- ${language === "en" ? "Role" : "Ρόλος"}: ${profile.role}`);
    lines.push(`- ${language === "en" ? "Access scope" : "Εύρος πρόσβασης"}: ${scopeLabel}`);

    const anthArr = (anth as any)?.data || [];
    const strArr = (strength as any)?.data || [];
    const endArr = (endurance as any)?.data || [];
    const jmpArr = (jump as any)?.data || [];
    const fncArr = (functional as any)?.data || [];

    if (anthArr.length || strArr.length || endArr.length || jmpArr.length || fncArr.length) {
      lines.push("");
      lines.push(language === "en" ? "📊 PERSONAL TEST HISTORY:" : "📊 ΙΣΤΟΡΙΚΟ ΠΡΟΣΩΠΙΚΩΝ ΤΕΣΤ:");

      if (anthArr.length) {
        lines.push(language === "en" ? "• Anthropometric:" : "• Σωματομετρικά:");
        anthArr.forEach((a: any) => {
          const d = a.anthropometric_test_sessions?.test_date || "?";
          const parts = [];
          if (a.weight) parts.push(`${a.weight}kg`);
          if (a.height) parts.push(`${a.height}cm`);
          if (a.body_fat_percentage) parts.push(`fat ${a.body_fat_percentage}%`);
          if (a.muscle_mass_percentage) parts.push(`muscle ${a.muscle_mass_percentage}%`);
          lines.push(`   - ${d}: ${parts.join(", ")}`);
        });
      }

      if (strArr.length) {
        lines.push(language === "en" ? "• Strength (1RM / Force-Velocity):" : "• Δύναμη (1RM / Force-Velocity):");
        strArr.forEach((s: any) => {
          const d = s.strength_test_sessions?.test_date || "?";
          const ex = s.exercises?.name || "?";
          const v = s.velocity_ms ? ` @ ${s.velocity_ms} m/s` : "";
          const rm = s.is_1rm ? " [1RM]" : "";
          lines.push(`   - ${d}: ${ex} ${s.weight_kg}kg${v}${rm}`);
        });
      }

      if (endArr.length) {
        lines.push(language === "en" ? "• Endurance:" : "• Αντοχή:");
        endArr.forEach((e: any) => {
          const d = e.endurance_test_sessions?.test_date || "?";
          const parts = [];
          if (e.vo2_max) parts.push(`VO2max ${e.vo2_max}`);
          if (e.mas_kmh) parts.push(`MAS ${e.mas_kmh} km/h`);
          if (e.push_ups) parts.push(`push-ups ${e.push_ups}`);
          if (e.pull_ups) parts.push(`pull-ups ${e.pull_ups}`);
          if (e.crunches) parts.push(`crunches ${e.crunches}`);
          if (parts.length) lines.push(`   - ${d}: ${parts.join(", ")}`);
        });
      }

      if (jmpArr.length) {
        lines.push(language === "en" ? "• Jumps:" : "• Άλματα:");
        jmpArr.forEach((j: any) => {
          const d = j.jump_test_sessions?.test_date || "?";
          const parts = [];
          if (j.counter_movement_jump) parts.push(`CMJ ${j.counter_movement_jump}cm`);
          if (j.non_counter_movement_jump) parts.push(`NCMJ ${j.non_counter_movement_jump}cm`);
          if (j.broad_jump) parts.push(`Broad ${j.broad_jump}cm`);
          if (j.depth_jump) parts.push(`Depth ${j.depth_jump}cm`);
          if (parts.length) lines.push(`   - ${d}: ${parts.join(", ")}`);
        });
      }

      if (fncArr.length) {
        lines.push(language === "en" ? "• Functional:" : "• Λειτουργικά:");
        fncArr.forEach((f: any) => {
          const d = f.functional_test_sessions?.test_date || "?";
          const parts = [];
          if (f.fms_score) parts.push(`FMS ${f.fms_score}`);
          if (f.sit_and_reach) parts.push(`Sit&Reach ${f.sit_and_reach}cm`);
          if (f.flamingo_balance) parts.push(`Flamingo ${f.flamingo_balance}`);
          if (parts.length) lines.push(`   - ${d}: ${parts.join(", ")}`);
        });
      }
    }

    // For admin/coach/federation, also fetch summary of their athletes' latest tests
    if ((isCoach || isFederation) && athleteIds.length > 1) {
      const otherIds = athleteIds.filter((id) => id !== myId);
      const { data: athletes } = await supabase
        .from("app_users")
        .select("id,name,birth_date,gender")
        .in("id", otherIds)
        .limit(200);

      if (athletes && athletes.length) {
        lines.push("");
        lines.push(language === "en"
          ? `👥 ATHLETES UNDER YOUR SCOPE (${athletes.length}) — you can answer questions about their tests:`
          : `👥 ΑΘΛΗΤΕΣ ΣΤΟ SCOPE ΣΟΥ (${athletes.length}) — μπορείς να απαντάς για τα τεστ τους:`);
        athletes.slice(0, 50).forEach((a: any) => {
          lines.push(`   - ${a.name}${a.birth_date ? ` (${a.birth_date})` : ""}${a.gender ? ` ${a.gender}` : ""}`);
        });
        if (athletes.length > 50) {
          lines.push(language === "en" ? `   ...and ${athletes.length - 50} more` : `   ...και ${athletes.length - 50} ακόμη`);
        }
        lines.push(language === "en"
          ? `   ℹ️ When asked about a specific athlete by name, search the athlete_federations / coach relationships.`
          : `   ℹ️ Όταν σε ρωτούν για συγκεκριμένο αθλητή με όνομα, ψάξε στις σχέσεις athlete_federations / coach.`);
      }
    } else if (isAdmin) {
      lines.push("");
      lines.push(language === "en"
        ? `🔓 ADMIN MODE: You can answer questions about ANY athlete in the database. Ask the user for the athlete name and infer from competition/match data above.`
        : `🔓 ADMIN MODE: Μπορείς να απαντάς για ΟΠΟΙΟΝΔΗΠΟΤΕ αθλητή στη βάση. Ζήτα το όνομα και χρησιμοποίησε τα δεδομένα αγώνων παραπάνω.`);
    }

    return lines.join("\n");
  } catch (e) {
    console.error("buildLoggedInUserContext (landing) failed:", e);
    return "";
  }
}

function buildSectionsContext(
  sections: Array<{ name: string; available_hours: any; max_capacity: number; description?: string | null }>,
  language: "el" | "en"
): string {
  const labels = language === "en" ? DAY_LABELS_EN : DAY_LABELS_EL;
  const header = language === "en"
    ? "📅 LIVE CLASS SCHEDULE (auto-fetched from booking system):"
    : "📅 ΖΩΝΤΑΝΟ ΠΡΟΓΡΑΜΜΑ ΤΜΗΜΑΤΩΝ (αυτόματα από το σύστημα κρατήσεων):";

  const lines: string[] = [header, ""];
  for (const s of sections) {
    const hours = s.available_hours || {};
    const dayParts: string[] = [];
    for (const d of DAY_ORDER) {
      const slots: string[] = Array.isArray(hours[d]) ? hours[d] : [];
      if (slots.length > 0) {
        dayParts.push(`${labels[d]}: ${slots.join(", ")}`);
      }
    }
    const hasDesc = s.description && s.description.trim().length > 0;
    if (dayParts.length === 0 && !hasDesc) continue;
    lines.push(`• **${s.name}** (max ${s.max_capacity})`);
    if (hasDesc) {
      lines.push(`   ${language === "en" ? "About" : "Περιγραφή"}: ${s.description!.trim()}`);
    }
    if (dayParts.length > 0) {
      lines.push(`   ${language === "en" ? "Schedule" : "Πρόγραμμα"}: ${dayParts.join(" | ")}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

const SYSTEM_PROMPT_EL = (sectionsBlock: string) => `Είσαι ο "Hyper AI" — ένας φιλικός, έμπειρος και επαγγελματίας ψηφιακός σύμβουλος της HYPERKIDS / RID ATHLETICS.

🎯 Στόχος σου:
1. Καλωσορίζεις τον επισκέπτη του site με ζεστό αλλά επαγγελματικό τόνο.
2. Απαντάς σε απορίες για τα προγράμματα, τις τιμές, την μεθοδολογία, τις εγκαταστάσεις και τους προπονητές.
3. Προτείνεις το κατάλληλο πρόγραμμα ανάλογα με την ηλικία, τους στόχους και τη φυσική κατάσταση του χρήστη.
4. Καθοδηγείς τον χρήστη να εγγραφεί ή να κλείσει επίσκεψη.
5. Δίνεις ΑΚΡΙΒΕΙΣ ώρες/μέρες τμημάτων από το ζωντανό πρόγραμμα παρακάτω.

📚 ΓΝΩΣΙΑΚΗ ΒΑΣΗ:

**HYPERKIDS** (παιδιά 4-12 ετών) — χωρίζεται σε ηλικιακές ομάδες (4-7, 7-10, 10+)
- Χτίζει αθλητικές βάσεις για όλα τα σπορ
- Συντονισμός, ισορροπία, ταχύτητα, ευκινησία, δύναμη
- Παιγνιώδης μορφή, χτίσιμο χαρακτήρα και αυτοπεποίθησης

**HYPERGYM / OPEN GYM** (έφηβοι & ενήλικες, γενικός πληθυσμός)
- Προπόνηση δύναμης & κάψιμο λίπους
- Εξατομικευμένα προγράμματα βάσει αρχικών τεστ
- Group ή personal training

**HYPERATHLETES / MUAY THAI** (αθλητές & επαγγελματίες) — υπάρχουν τμήματα Muay Thai 10+, hybrid και αγωνιστικό
- Εξειδικευμένη αθλητική προπόνηση
- Force/Velocity testing, FMS assessment
- Πρόληψη τραυματισμών, αποκατάσταση

**ELITE TRAINING**
- Ένα-προς-ένα προπόνηση, πλήρης παρακολούθηση από Head Coach

**LIVE PROGRAM / ΒΙΝΤΕΟΚΛΗΣΕΙΣ**
- Online live προπονήσεις με coach μέσω εφαρμογής

${sectionsBlock}

🗣️ ΚΑΝΟΝΕΣ:
- Απαντάς ΠΑΝΤΑ στα ελληνικά (εκτός αν ο χρήστης γράψει αγγλικά).
- Σύντομες, καθαρές απαντήσεις (max 4-5 προτάσεις).
- Όταν ρωτούν "ποιες μέρες/ώρες έχει το X" → απάντα με τις ΑΚΡΙΒΕΙΣ ώρες από το ζωντανό πρόγραμμα παραπάνω.
- Αν το τμήμα δεν εμφανίζεται στο πρόγραμμα παραπάνω, πες ότι θα ενημερωθούν από την ομάδα — ΜΗΝ επινοείς ώρες.
- Για τιμές που δεν ξέρεις → παραπέμπεις στην επικοινωνία.

🥊 ΥΠΟΧΡΕΩΤΙΚΗ ΜΟΡΦΗ ΓΙΑ LIVE ΑΓΩΝΕΣ (όταν αναφέρεις τι παίζει σε ένα ρινγκ):
Γράψε σε 4 ξεχωριστές γραμμές, ΑΚΡΙΒΩΣ έτσι (χωρίς bullet/αρίθμηση):
Ring X (Ring NAME)
Αγώνας #N — Γύρος R (ή Διάλειμμα) — [κατηγορία]
🔴 Όνομα Αθλητή Α  vs  🔵 Όνομα Αθλητή Β
Live: <full https URL>
- Άσε το URL γυμνό (https://...) — όχι markdown, όχι αγκύλες.
- Αν δεν υπάρχει live link, παρέλειψε εντελώς την 4η γραμμή.

📋 INLINE ΦΟΡΜΑ ΕΠΙΚΟΙΝΩΝΙΑΣ:
- Όταν ο χρήστης δείχνει ενδιαφέρον (ρωτά για δοκιμαστική, εγγραφή, πώς να ξεκινήσει, ή ζητάει να επικοινωνήσετε), πρόσθεσε στο ΤΕΛΟΣ της απάντησής σου σε ξεχωριστή γραμμή ΑΚΡΙΒΩΣ τον κωδικό: [SHOW_LEAD_FORM]
- Αυτός ο κωδικός θα εμφανίσει αυτόματα μια φόρμα μέσα στο chat (όνομα, τηλέφωνο, email, μήνυμα) χωρίς να χρειάζεται εγγραφή.
- ΜΗΝ ζητάς εσύ τα στοιχεία με κείμενο όταν βάζεις το [SHOW_LEAD_FORM] — η φόρμα τα ζητάει.
- ΜΗΝ προσθέτεις [SHOW_LEAD_FORM] σε γενικές πληροφοριακές απαντήσεις — μόνο όταν είναι ώρα να αφήσει στοιχεία.
`;

const SYSTEM_PROMPT_EN = (sectionsBlock: string) => `You are "Hyper AI" - a friendly, experienced and professional digital advisor for HYPERKIDS / RID ATHLETICS.

🎯 Your goals:
1. Warmly welcome website visitors with a professional tone.
2. Answer questions about programs, prices, methodology, facilities and coaches.
3. Recommend the right program based on age, goals and fitness level.
4. Give EXACT class days/times from the live schedule below.
5. Guide users to sign up or book a trial visit.

📚 KNOWLEDGE BASE:

**HYPERKIDS** (kids 4-12, split by age: 4-7, 7-10, 10+) — athletic foundations, coordination, agility.
**HYPERGYM / OPEN GYM** (teens & adults) — strength, fat loss, group or PT.
**HYPERATHLETES / MUAY THAI** (athletes) — Muay Thai 10+, hybrid, competitive squad.
**ELITE TRAINING** — 1-on-1 with Head Coach.
**LIVE PROGRAM** — online live sessions with coach.

${sectionsBlock}

🗣️ RULES:
- Reply in English (unless the user writes in Greek).
- Short, clear answers (max 4-5 sentences).
- When asked "what days/times for X" → use the EXACT hours from the live schedule above.
- If a class isn't in the schedule above, say the team will follow up — NEVER invent hours.
- For unknown prices → direct to contact form/phone.

🥊 REQUIRED FORMAT FOR LIVE FIGHTS (when reporting what's playing in a ring):
Reply on 4 separate lines, EXACTLY like this (no bullets/numbering):
Ring X (Ring NAME)
Match #N — Round R (or Break) — [category]
🔴 Athlete A Name  vs  🔵 Athlete B Name
Live: <full https URL>
- Keep the URL bare (https://...) — no markdown, no brackets.
- If there is no live link, omit the 4th line entirely.

📋 INLINE CONTACT FORM:
- When the user shows interest (asks for trial, signup, how to start, or to be contacted), add at the END of your reply on a separate line EXACTLY this code: [SHOW_LEAD_FORM]
- That code automatically shows an in-chat form (name, phone, email, message) — no signup required.
- Do NOT also ask for those details in text when including [SHOW_LEAD_FORM] — the form already asks for them.
- Do NOT add [SHOW_LEAD_FORM] to generic informational replies — only when it's time to collect details.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const {
      messages = [],
      sessionId,
      language = "el",
      userAgent,
      contactInfo,
    } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return new Response(JSON.stringify({ error: "sessionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastUserMessage = [...messages].reverse().find((message: any) => message?.role === "user")?.content;

    // Fetch live class schedule
    let sectionsBlock = "";
    try {
      const { data: sections } = await supabase
        .from("booking_sections")
        .select("name, description, max_capacity, available_hours")
        .eq("is_active", true)
        .order("name");
      if (sections && sections.length > 0) {
        sectionsBlock = buildSectionsContext(sections as any, language);
      }
    } catch (e) {
      console.error("Failed to fetch sections:", e);
    }

    // Fetch active/upcoming competitions, rings, brackets and weigh-ins across ALL federations
    let competitionsBlock = "";
    try {
      competitionsBlock = await buildCompetitionsContext(supabase, language);
    } catch (e) {
      console.error("Failed to fetch competitions:", e);
    }

    if (typeof lastUserMessage === "string") {
      try {
        const deterministicAnswer = await lookupAthleteCompetitionAnswer(supabase, lastUserMessage, language);
        if (deterministicAnswer) {
          return new Response(sseFromText(deterministicAnswer), {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        }
      } catch (e) {
        console.error("Deterministic competition lookup failed:", e);
      }
    }

    // Fetch logged-in user context (auth + role-based test access)
    let userContextBlock = "";
    try {
      userContextBlock = await buildLoggedInUserContext(supabase, req.headers.get("Authorization"), language);
    } catch (e) {
      console.error("Failed to build user context:", e);
    }

    const baseSystemPrompt =
      language === "en" ? SYSTEM_PROMPT_EN(sectionsBlock) : SYSTEM_PROMPT_EL(sectionsBlock);
    let systemPrompt = competitionsBlock
      ? `${baseSystemPrompt}\n\n${competitionsBlock}\n${
          language === "en"
            ? "When users ask about fights, brackets, opponents, schedules, weigh-ins or live streams, use the data above. If the context includes DRAW / MATCHES / BRACKETS, the draw is out — never say it hasn't been announced or that you don't have access. Share public YouTube live links freely."
            : "Όταν οι χρήστες ρωτούν για αγώνες, κλήρωση, αντιπάλους, ώρες, ζυγίσεις ή live μεταδόσεις, χρησιμοποίησε τα παραπάνω δεδομένα. Αν στο context υπάρχει ΚΛΗΡΩΣΗ / ΑΓΩΝΕΣ / BRACKETS, η κλήρωση έχει βγει — απαγορεύεται να πεις ότι δεν έχει ανακοινωθεί ή ότι δεν έχεις πρόσβαση. Δίνε ελεύθερα τα δημόσια YouTube live links."
        }`
      : baseSystemPrompt;

    if (userContextBlock) {
      systemPrompt += `\n\n${userContextBlock}\n\n${
        language === "en"
          ? "🔐 The user above is LOGGED IN. When they ask about themselves (e.g. \"do you know me?\", \"my 1RM\", \"my tests\"), use this private context. NEVER expose private data of other users unless the role scope above explicitly allows it (admin/coach/federation)."
          : "🔐 Ο χρήστης παραπάνω είναι ΣΥΝΔΕΔΕΜΕΝΟΣ. Όταν ρωτά για τον εαυτό του (\"με ξέρεις;\", \"το 1RM μου\", \"τα τεστ μου\"), χρησιμοποίησε αυτό το private context. ΠΟΤΕ μην αποκαλύπτεις δεδομένα άλλων χρηστών εκτός αν το role scope παραπάνω το επιτρέπει ρητά (admin/coach/federation)."
      }`;
    }

    // Persist session
    try {
      await supabase
        .from("landing_chat_leads")
        .upsert(
          {
            session_id: sessionId,
            messages,
            language,
            user_agent: userAgent || null,
            message_count: messages.length,
            ...(contactInfo?.name && { contact_name: contactInfo.name }),
            ...(contactInfo?.email && { contact_email: contactInfo.email }),
            ...(contactInfo?.phone && { contact_phone: contactInfo.phone }),
            ...(contactInfo?.interestedProgram && {
              interested_program: contactInfo.interestedProgram,
            }),
          },
          { onConflict: "session_id" }
        );
    } catch (e) {
      console.error("Failed to persist chat session:", e);
    }

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({
            error:
              language === "en"
                ? "Too many requests, please try again shortly."
                : "Πολλά αιτήματα, δοκιμάστε ξανά σε λίγο.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              language === "en"
                ? "AI credits exhausted. Please contact the admin."
                : "Τα credits του AI εξαντλήθηκαν. Επικοινωνήστε με τον διαχειριστή.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("landing-ai-sales error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
