import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const sbHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function fetchSbJson(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: sbHeaders });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase fetch failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function buildCompetitionsContext(competitionId?: string): Promise<string> {
  const todayStr = new Date().toISOString().split("T")[0];
  let ctx = `📅 Σήμερα: ${todayStr}\n\n`;

  const filter = competitionId
    ? `id=eq.${competitionId}`
    : `competition_date=gte.${new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]}`;
  const compsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/federation_competitions?${filter}&select=*,federation:app_users!federation_competitions_federation_id_fkey(name)&order=competition_date.asc&limit=20`,
    { headers: sbHeaders }
  );
  const comps = await compsRes.json();
  if (!Array.isArray(comps) || comps.length === 0) {
    return ctx + "Δεν υπάρχουν τρέχουσες διοργανώσεις.\n";
  }

  for (const comp of comps) {
    const fedName = comp.federation?.name || "—";
    const isToday = comp.competition_date === todayStr;
    const tag = isToday ? "🔴 ΣΗΜΕΡΑ" : comp.competition_date > todayStr ? "📅" : "📜";
    ctx += `\n${tag} ${comp.name} — ${fedName} (competition_id=${comp.id})\n`;
    ctx += `  📍 ${comp.location || "-"} | ${comp.competition_date}${comp.end_date ? ` → ${comp.end_date}` : ""} | Status: ${comp.status}\n`;

    const mRes = await fetch(
      `${SUPABASE_URL}/rest/v1/competition_matches?competition_id=eq.${comp.id}&select=id,match_order,match_number,status,winner_id,scheduled_time,ring_number,is_bye,athlete1_id,athlete2_id,athlete1:app_users!competition_matches_athlete1_id_fkey(name),athlete2:app_users!competition_matches_athlete2_id_fkey(name),athlete1_club:app_users!competition_matches_athlete1_club_id_fkey(name),athlete2_club:app_users!competition_matches_athlete2_club_id_fkey(name),category:federation_competition_categories!competition_matches_category_id_fkey(name)&order=match_order.asc.nullslast&limit=500`,
      { headers: sbHeaders }
    );
    const matches = await mRes.json();
    const validMatches = Array.isArray(matches) ? matches.filter((m: any) => !m.is_bye) : [];

    const rRes = await fetch(
      `${SUPABASE_URL}/rest/v1/competition_rings?competition_id=eq.${comp.id}&select=*&order=ring_number.asc`,
      { headers: sbHeaders }
    );
    const rings = await rRes.json();
    if (Array.isArray(rings) && rings.length > 0) {
      ctx += `  📺 RINGS:\n`;
      for (const r of rings) {
        const liveLink = r.youtube_live_url ? ` 🎥 LIVE: ${r.youtube_live_url}` : " (χωρίς live link ακόμη)";
        const live = r.is_active ? "🔴 LIVE" : "⚪";
        ctx += `    Ring ${r.ring_number} (${r.ring_name || "-"}) ${live}${liveLink}\n`;
        const cur = r.current_match_id ? validMatches.find((m: any) => m.id === r.current_match_id) : null;
        if (cur) {
          ctx += `      🥊 Τώρα: #${cur.match_order || cur.match_number} 🔴 ${cur.athlete1?.name || "TBD"}${cur.athlete1_club?.name ? ` [${cur.athlete1_club.name}]` : ""} vs 🔵 ${cur.athlete2?.name || "TBD"}${cur.athlete2_club?.name ? ` [${cur.athlete2_club.name}]` : ""} [${cur.category?.name || ""}] (Round ${r.timer_current_round || 1}${r.timer_is_break ? " BREAK" : ""})\n`;
        }
        if (r.match_range_start && r.match_range_end) {
          const upcoming = validMatches
            .filter((m: any) => m.match_order && m.match_order >= r.match_range_start && m.match_order <= r.match_range_end && m.status !== "completed" && m.id !== r.current_match_id)
            .sort((a: any, b: any) => (a.match_order || 0) - (b.match_order || 0));
          upcoming.forEach((m: any) => {
            ctx += `      ⏭️ #${m.match_order}: 🔴 ${m.athlete1?.name || "TBD"}${m.athlete1_club?.name ? ` [${m.athlete1_club.name}]` : ""} vs 🔵 ${m.athlete2?.name || "TBD"}${m.athlete2_club?.name ? ` [${m.athlete2_club.name}]` : ""} [${m.category?.name || ""}]\n`;
          });
        }
      }
    }

    if (validMatches.length > 0) {
      ctx += `  🥊 ΚΛΗΡΩΣΗ / ΑΓΩΝΕΣ / BRACKETS (${validMatches.length} αγώνες — Η ΚΛΗΡΩΣΗ ΕΧΕΙ ΒΓΕΙ):\n`;
      ctx += `  ℹ️ ΕΠΕΞΗΓΗΣΗ ΓΥΡΩΝ (χρησιμοποίησε ΠΑΝΤΑ τους ελληνικούς όρους όταν αναφέρεις γύρους, ΠΟΤΕ R8/R4/R2/R1):\n`;
      ctx += `     R32=Φάση των 32 | R16=Φάση των 16 | R8=Προημιτελικά | R4=Ημιτελικά | R2=Τελικός | R1=Νικητής\n`;
      validMatches.forEach((m: any) => {
        const status = m.status === "completed" ? "✅" : m.status === "in_progress" ? "🔴" : "⏳";
        const winner = m.winner_id ? (m.winner_id === m.athlete1_id ? m.athlete1?.name : m.athlete2?.name) : null;
        const ring = m.ring_number ? ` Ring${m.ring_number}` : "";
        const time = m.scheduled_time ? ` ${new Date(m.scheduled_time).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}` : "";
        const c1 = m.athlete1_club?.name ? ` [${m.athlete1_club.name}]` : "";
        const c2 = m.athlete2_club?.name ? ` [${m.athlete2_club.name}]` : "";
        ctx += `    ${status} #${m.match_order || m.match_number}${ring}${time}: 🔴 ${m.athlete1?.name || "TBD"}${c1} vs 🔵 ${m.athlete2?.name || "TBD"}${c2}${winner ? ` → 🏆 ${winner}` : ""} [${m.category?.name || ""}]\n`;
      });
    } else {
      ctx += `  ⚠️ Η κλήρωση ΔΕΝ έχει βγει ακόμη για αυτή τη διοργάνωση.\n`;
    }

    const wRes = await fetch(
      `${SUPABASE_URL}/rest/v1/federation_competition_registrations?competition_id=eq.${comp.id}&select=weigh_in_weight,weigh_in_status,athlete:app_users!federation_competition_registrations_athlete_id_fkey(name),club:app_users!federation_competition_registrations_club_id_fkey(name),category:federation_competition_categories(name,min_weight,max_weight)&weigh_in_status=in.(passed,failed)&limit=300`,
      { headers: sbHeaders }
    );
    const weighs = await wRes.json();
    if (Array.isArray(weighs) && weighs.length > 0) {
      ctx += `  ⚖️ ΖΥΓΙΣΕΙΣ (${weighs.length}):\n`;
      weighs.forEach((w: any) => {
        const ok = w.weigh_in_status === "passed" ? "✅" : "❌";
        const club = w.club?.name ? ` [${w.club.name}]` : "";
        ctx += `    ${ok} ${w.athlete?.name || "?"}${club}: ${w.weigh_in_weight || "?"}kg [${w.category?.name || "-"}]\n`;
      });
    }
  }

  return ctx;
}

async function buildLoggedInUserContext(authHeader: string | null): Promise<string> {
  if (!authHeader?.startsWith("Bearer ")) return "";

  try {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!anonKey) return "";

    const authClient = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error,
    } = await authClient.auth.getUser();

    if (error || !user) return "";

    const profileRows = await fetchSbJson(
      `app_users?auth_user_id=eq.${user.id}&select=id,name,email,phone,birth_date,gender,category,role,user_status,subscription_status&limit=1`
    ).catch(() => []);
    const profile = Array.isArray(profileRows) ? profileRows[0] : null;
    if (!profile?.id) return "";

    const userId = profile.id;
    const role = (profile.role || "general").toLowerCase();
    const isAdmin = role === "admin";
    const isCoach = role === "coach" || role === "trainer";
    const isFederation = role === "federation";

    // Determine scope (athletes accessible to the AI for this user)
    let scopeAthletes: any[] = [];
    let scopeLabel = "USER MODE — μόνο προσωπικά δεδομένα";
    if (isAdmin) {
      scopeLabel = "ADMIN MODE — πλήρης πρόσβαση σε όλη τη βάση";
    } else if (isCoach) {
      scopeAthletes = await fetchSbJson(
        `app_users?coach_id=eq.${userId}&select=id,name,birth_date,gender&limit=300`
      ).catch(() => []);
      scopeLabel = `COACH MODE — ${scopeAthletes.length} αθλητές υπό την εποπτεία σου`;
    } else if (isFederation) {
      const fedRows = await fetchSbJson(
        `athlete_federations?federation_id=eq.${userId}&is_active=eq.true&select=athlete_id,registration_number,athlete:app_users!athlete_federations_athlete_id_fkey(id,name,birth_date,gender)&limit=500`
      ).catch(() => []);
      scopeAthletes = (Array.isArray(fedRows) ? fedRows : []).map((r: any) => ({
        ...(r.athlete || {}),
        registration_number: r.registration_number,
      })).filter((a: any) => a.id);
      scopeLabel = `FEDERATION MODE — ${scopeAthletes.length} εγγεγραμμένοι αθλητές`;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [subscriptions, anthropometric, strength, endurance, jump, functional, registrations] = await Promise.all([
      fetchSbJson(
        `user_subscriptions?user_id=eq.${userId}&select=start_date,end_date,status,is_paid,is_paused,subscription_types(name,price,duration_months)&order=end_date.desc&limit=5`
      ).catch(() => []),
      fetchSbJson(
        `anthropometric_test_data?select=weight,body_fat_percentage,muscle_mass_percentage,height,anthropometric_test_sessions!inner(test_date)&anthropometric_test_sessions.user_id=eq.${userId}&order=created_at.desc&limit=5`
      ).catch(() => []),
      fetchSbJson(
        `strength_test_attempts?select=weight_kg,velocity_ms,is_1rm,exercises(name),strength_test_sessions!inner(test_date)&strength_test_sessions.user_id=eq.${userId}&order=strength_test_sessions.test_date.desc&limit=15`
      ).catch(() => []),
      fetchSbJson(
        `endurance_test_data?select=vo2_max,mas_kmh,push_ups,pull_ups,crunches,endurance_test_sessions!inner(test_date)&endurance_test_sessions.user_id=eq.${userId}&order=created_at.desc&limit=5`
      ).catch(() => []),
      fetchSbJson(
        `jump_test_data?select=counter_movement_jump,non_counter_movement_jump,broad_jump,depth_jump,jump_test_sessions!inner(test_date)&jump_test_sessions.user_id=eq.${userId}&order=created_at.desc&limit=5`
      ).catch(() => []),
      fetchSbJson(
        `functional_test_data?select=fms_score,sit_and_reach,flamingo_balance,functional_test_sessions!inner(test_date)&functional_test_sessions.user_id=eq.${userId}&order=created_at.desc&limit=5`
      ).catch(() => []),
      fetchSbJson(
        `federation_competition_registrations?athlete_id=eq.${userId}&select=competition_id,weigh_in_weight,weigh_in_status,created_at&order=created_at.desc&limit=8`
      ).catch(() => []),
    ]);

    let competitionMap = new Map<string, any>();
    if (Array.isArray(registrations) && registrations.length > 0) {
      const competitionIds = [...new Set(registrations.map((r: any) => r.competition_id).filter(Boolean))];
      if (competitionIds.length > 0) {
        const competitions = await fetchSbJson(
          `federation_competitions?id=in.(${competitionIds.join(",")})&select=id,name,competition_date,status&limit=20`
        ).catch(() => []);
        if (Array.isArray(competitions)) {
          competitionMap = new Map(competitions.map((c: any) => [c.id, c]));
        }
      }
    }

    let ctx = `👤 ΣΥΝΔΕΔΕΜΕΝΟΣ ΧΡΗΣΤΗΣ (ιδιωτικό context — μόνο για τον ίδιο):\n`;
    ctx += `- Όνομα: ${profile.name || "—"}\n`;
    ctx += `- Email: ${profile.email || "—"}\n`;
    if (profile.phone) ctx += `- Τηλέφωνο: ${profile.phone}\n`;
    if (profile.birth_date) ctx += `- Ημ/νία γέννησης: ${profile.birth_date}\n`;
    if (profile.gender) ctx += `- Φύλο: ${profile.gender}\n`;
    if (profile.category) ctx += `- Κατηγορία: ${profile.category}\n`;
    if (profile.role) ctx += `- Ρόλος: ${profile.role}\n`;
    if (profile.user_status) ctx += `- Κατάσταση λογαριασμού: ${profile.user_status}\n`;
    if (profile.subscription_status) ctx += `- Κατάσταση συνδρομής προφίλ: ${profile.subscription_status}\n`;

    if (Array.isArray(subscriptions) && subscriptions.length > 0) {
      const activeSub = subscriptions.find((sub: any) => {
        const endDate = new Date(sub.end_date);
        endDate.setHours(23, 59, 59, 999);
        return endDate >= today && sub.status === "active";
      }) || subscriptions[0];

      if (activeSub) {
        const endDate = activeSub.end_date ? new Date(activeSub.end_date) : null;
        const daysUntil = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / 86400000) : null;
        ctx += `\n💳 ΣΥΝΔΡΟΜΗ:\n`;
        ctx += `- Τύπος: ${activeSub.subscription_types?.name || "—"}\n`;
        if (activeSub.start_date) ctx += `- Έναρξη: ${activeSub.start_date}\n`;
        if (activeSub.end_date) ctx += `- Λήξη: ${activeSub.end_date}${daysUntil !== null ? ` (${daysUntil >= 0 ? `σε ${daysUntil} ημέρες` : `έληξε πριν ${Math.abs(daysUntil)} ημέρες`})` : ""}\n`;
        if (activeSub.status) ctx += `- Status: ${activeSub.status}\n`;
        if (activeSub.is_paid === false) ctx += `- Πληρωμή: Εκκρεμεί\n`;
        if (activeSub.is_paused) ctx += `- Παύση: Ναι\n`;
      }
    }

    const latestAnth = Array.isArray(anthropometric) ? anthropometric[0] : null;
    const latestStrength = Array.isArray(strength) ? strength[0] : null;
    const latestEndurance = Array.isArray(endurance) ? endurance[0] : null;
    const latestJump = Array.isArray(jump) ? jump[0] : null;

    if (latestAnth || latestStrength || latestEndurance || latestJump) {
      ctx += `\n📈 ΤΕΛΕΥΤΑΙΑ ΜΕΤΡΗΣΗ / ΤΕΣΤ:\n`;
      if (latestAnth) {
        const anthParts = [];
        if (latestAnth.weight) anthParts.push(`Βάρος ${latestAnth.weight}kg`);
        if (latestAnth.body_fat_percentage) anthParts.push(`Λίπος ${latestAnth.body_fat_percentage}%`);
        if (latestAnth.muscle_mass_percentage) anthParts.push(`Μυϊκή μάζα ${latestAnth.muscle_mass_percentage}%`);
        if (anthParts.length > 0) {
          ctx += `- Σωματομετρικά: ${anthParts.join(", ")}`;
          const anthDate = latestAnth.anthropometric_test_sessions?.[0]?.test_date;
          if (anthDate) ctx += ` (${anthDate})`;
          ctx += `\n`;
        }
      }
      if (latestStrength) {
        ctx += `- Δύναμη: ${latestStrength.exercises?.name || "Άσκηση"} ${latestStrength.weight_kg || "?"}kg`;
        if (latestStrength.velocity_ms) ctx += ` @ ${latestStrength.velocity_ms} m/s`;
        const strengthDate = latestStrength.strength_test_sessions?.[0]?.test_date;
        if (strengthDate) ctx += ` (${strengthDate})`;
        ctx += `\n`;
      }
      if (latestEndurance) {
        const enduranceParts = [];
        if (latestEndurance.vo2_max) enduranceParts.push(`VO2max ${latestEndurance.vo2_max}`);
        if (latestEndurance.mas_kmh) enduranceParts.push(`MAS ${latestEndurance.mas_kmh} km/h`);
        if (latestEndurance.push_ups) enduranceParts.push(`Push-ups ${latestEndurance.push_ups}`);
        if (latestEndurance.pull_ups) enduranceParts.push(`Pull-ups ${latestEndurance.pull_ups}`);
        if (enduranceParts.length > 0) {
          ctx += `- Αντοχή: ${enduranceParts.join(", ")}`;
          const enduranceDate = latestEndurance.endurance_test_sessions?.[0]?.test_date;
          if (enduranceDate) ctx += ` (${enduranceDate})`;
          ctx += `\n`;
        }
      }
      if (latestJump) {
        const jumpParts = [];
        if (latestJump.counter_movement_jump) jumpParts.push(`CMJ ${latestJump.counter_movement_jump}cm`);
        if (latestJump.broad_jump) jumpParts.push(`Broad ${latestJump.broad_jump}cm`);
        if (jumpParts.length > 0) {
          ctx += `- Άλματα: ${jumpParts.join(", ")}`;
          const jumpDate = latestJump.jump_test_sessions?.[0]?.test_date;
          if (jumpDate) ctx += ` (${jumpDate})`;
          ctx += `\n`;
        }
      }
    }

    if (Array.isArray(registrations) && registrations.length > 0) {
      ctx += `\n🥊 ΔΗΛΩΣΕΙΣ / ΔΙΟΡΓΑΝΩΣΕΙΣ ΧΡΗΣΤΗ:\n`;
      registrations.forEach((registration: any) => {
        const competition = competitionMap.get(registration.competition_id);
        const label = competition?.name || `Competition ${registration.competition_id}`;
        const date = competition?.competition_date ? ` (${competition.competition_date})` : "";
        const weighIn = registration.weigh_in_status
          ? ` | Ζύγιση: ${registration.weigh_in_status}${registration.weigh_in_weight ? ` (${registration.weigh_in_weight}kg)` : ""}`
          : "";
        ctx += `- ${label}${date}${competition?.status ? ` | Status: ${competition.status}` : ""}${weighIn}\n`;
      });
    }

    return ctx;
  } catch (e) {
    console.error("buildLoggedInUserContext error:", e);
    return "";
  }
}

async function saveLead(payload: any): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_competition_leads`, {
      method: "POST",
      headers: { ...sbHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({
        competition_id: payload.competition_id || null,
        name: payload.name || null,
        email: payload.email || null,
        phone: payload.phone || null,
        athlete_name: payload.athlete_name || null,
        club: payload.club || null,
        notify_youtube: payload.notify_youtube !== false,
        notify_bracket: payload.notify_bracket !== false,
        notify_schedule: payload.notify_schedule !== false,
        raw_message: payload.raw_message || null,
        source: "hyper_ai",
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: t };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "lead" && req.method === "POST") {
      const body = await req.json();
      const result = await saveLead(body);
      return new Response(JSON.stringify(result), {
        status: result.ok ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages = [], competitionId } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [compsContext, userProfileContext] = await Promise.all([
      buildCompetitionsContext(competitionId),
      buildLoggedInUserContext(req.headers.get("Authorization")),
    ]);

    const systemPrompt = `Είσαι ο "Hyper AI" — ψηφιακός βοηθός για τις διοργανώσεις της πλατφόρμας HYPERKIDS / RID ATHLETICS.

🎯 Ρόλος σου:
Απαντάς σε όσους είναι στις διοργανώσεις (αθλητές, προπονητές, γονείς, θεατές) για:
- Πότε/πού παίζει κάποιος (σειρά αγώνα, ώρα, ρινγκ)
- Ποιος αντιμετωπίζει ποιον, από ποια ομάδα
- Ζυγίσεις (κιλά, πέρασε/απέτυχε)
- Live YouTube links ανά ρινγκ (είναι δημόσια — μοιράσου τα ελεύθερα)
- Τρέχων αγώνας σε κάθε ρινγκ + επόμενοι
- Κατηγορίες, νικητές, αποτελέσματα
${userProfileContext ? "- Προσωποποιημένες πληροφορίες για τον συνδεδεμένο χρήστη, μόνο για το δικό του προφίλ" : ""}

📊 ΖΩΝΤΑΝΑ ΔΕΔΟΜΕΝΑ ΔΙΟΡΓΑΝΩΣΕΩΝ (πραγματικά, από τη βάση δεδομένων ΑΥΤΗ ΤΗ ΣΤΙΓΜΗ):
${compsContext}
${userProfileContext ? `
🔐 PRIVATE CONTEXT ΣΥΝΔΕΔΕΜΕΝΟΥ ΧΡΗΣΤΗ (χρησιμοποίησέ το ΜΟΝΟ για τον ίδιο χρήστη):
${userProfileContext}
` : ""}
🚨 ΑΠΟΛΥΤΟΙ ΚΑΝΟΝΕΣ:
1. ΑΝ στα δεδομένα παραπάνω εμφανίζεται "ΚΛΗΡΩΣΗ / ΑΓΩΝΕΣ / BRACKETS" με αγώνες, η κλήρωση ΕΧΕΙ ΒΓΕΙ. ΑΠΑΓΟΡΕΥΕΤΑΙ να πεις "δεν έχει βγει η κλήρωση" ή "δεν έχω πρόσβαση". Διάβασε τα δεδομένα και απάντησε.
2. ΑΝ ένα ρινγκ έχει "🎥 LIVE: <url>", το URL είναι ΔΗΜΟΣΙΟ — δώσ' το χωρίς δισταγμό όταν το ζητάνε.
3. Όταν ψάχνεις αθλητή με όνομα, ψάξε στους αγώνες ΚΑΙ στις ζυγίσεις παραπάνω.
4. Χρησιμοποιείς ΜΟΝΟ τα δεδομένα παραπάνω — ΜΗΝ επινοείς ονόματα/ώρες/links.
5. Αν κάτι όντως δεν υπάρχει στα δεδομένα (π.χ. δεν υπάρχει YouTube link, δεν υπάρχει ζύγιση), πες ότι "δεν έχει ανακοινωθεί ακόμη".
6. Όταν αναφέρεις γύρους πες ΠΑΝΤΑ Προημιτελικά/Ημιτελικά/Τελικός — ΠΟΤΕ R8/R4/R2/R1.
7. Σύντομες, καθαρές απαντήσεις στα ελληνικά.
8. Όταν υπάρχει private context συνδεδεμένου χρήστη και σε ρωτά για τον εαυτό του (π.χ. "εγώ", "το προφίλ μου", "η συνδρομή μου", "οι μετρήσεις μου", "σε ποιον αγώνα παίζω"), χρησιμοποίησε το private context για προσωποποιημένη απάντηση.
9. Μην αποκαλύπτεις private στοιχεία αν δεν αφορά τον ίδιο τον συνδεδεμένο χρήστη.
10. Όταν αναφέρεις matchup/ζευγάρι, προτίμησε format όπως: "🔴 Όνομα [Σύλλογος] vs 🔵 Όνομα [Σύλλογος]".

📩 LEAD CAPTURE (πολύ σημαντικό):
Αν ο χρήστης ζητήσει ΕΝΗΜΕΡΩΣΗ (π.χ. "ενημέρωσέ με όταν βγει το live link", "θέλω να μάθω όταν βγει η κλήρωση", "στείλτε μου ειδοποίηση"):
- Ζήτα ΕΥΓΕΝΙΚΑ τα στοιχεία επικοινωνίας: όνομα + email (και προαιρετικά τηλέφωνο, όνομα αθλητή, σύλλογο).
- ΜΟΛΙΣ σου δώσει email, στο ΤΕΛΟΣ της απάντησής σου (μετά το ευχαριστώ) πρόσθεσε ΑΥΣΤΗΡΩΣ μια γραμμή με αυτό το ακριβές format (μόνο 1 φορά, σε δικιά της γραμμή):

[LEAD_CAPTURE]{"name":"...","email":"...","phone":"...","athlete_name":"...","club":"...","notify_youtube":true,"notify_bracket":true,"notify_schedule":true}[/LEAD_CAPTURE]

Παράλειψε όποια πεδία δεν σου είπε (αλλά email είναι υποχρεωτικό). Το tag δεν θα εμφανιστεί στον χρήστη — το frontend το αφαιρεί. Μην το εξηγήσεις στον χρήστη, απλά πες του ότι θα τον ειδοποιήσουμε.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Πολλά αιτήματα, δοκιμάστε ξανά σε λίγο." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Εξαντλήθηκαν τα credits της πλατφόρμας." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      console.error("AI error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiRes.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("competition-public-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
