import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
};

async function buildCompetitionsContext(competitionId?: string): Promise<string> {
  const todayStr = new Date().toISOString().split("T")[0];
  let ctx = `📅 Σήμερα: ${todayStr}\n\n`;

  // Φόρτωση διοργανώσεων (όλων ή της συγκεκριμένης)
  const filter = competitionId ? `id=eq.${competitionId}` : `competition_date=gte.${new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]}`;
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
    ctx += `\n${tag} ${comp.name} — ${fedName}\n`;
    ctx += `  📍 ${comp.location || "-"} | ${comp.competition_date}${comp.end_date ? ` → ${comp.end_date}` : ""} | Status: ${comp.status}\n`;

    // Matches
    const mRes = await fetch(
      `${SUPABASE_URL}/rest/v1/competition_matches?competition_id=eq.${comp.id}&select=id,match_order,match_number,status,winner_id,scheduled_time,ring_number,is_bye,athlete1_id,athlete2_id,athlete1:app_users!competition_matches_athlete1_id_fkey(name),athlete2:app_users!competition_matches_athlete2_id_fkey(name),athlete1_club:app_users!competition_matches_athlete1_club_id_fkey(name),athlete2_club:app_users!competition_matches_athlete2_club_id_fkey(name),category:federation_competition_categories!competition_matches_category_id_fkey(name)&order=match_order.asc.nullslast&limit=500`,
      { headers: sbHeaders }
    );
    const matches = await mRes.json();
    const validMatches = Array.isArray(matches) ? matches.filter((m: any) => !m.is_bye) : [];

    // Rings
    const rRes = await fetch(
      `${SUPABASE_URL}/rest/v1/competition_rings?competition_id=eq.${comp.id}&select=*&order=ring_number.asc`,
      { headers: sbHeaders }
    );
    const rings = await rRes.json();
    if (Array.isArray(rings) && rings.length > 0) {
      ctx += `  📺 RINGS:\n`;
      for (const r of rings) {
        const liveLink = r.youtube_live_url ? ` 🎥 LIVE: ${r.youtube_live_url}` : "";
        const live = r.is_active ? "🔴 LIVE" : "⚪";
        ctx += `    Ring ${r.ring_number} (${r.ring_name || "-"}) ${live}${liveLink}\n`;
        const cur = r.current_match_id ? validMatches.find((m: any) => m.id === r.current_match_id) : null;
        if (cur) {
          ctx += `      🥊 Τώρα: #${cur.match_order || cur.match_number} ${cur.athlete1?.name || "TBD"} vs ${cur.athlete2?.name || "TBD"} [${cur.category?.name || ""}] (Round ${r.timer_current_round || 1}${r.timer_is_break ? " BREAK" : ""})\n`;
        }
        if (r.match_range_start && r.match_range_end) {
          const upcoming = validMatches
            .filter((m: any) => m.match_order && m.match_order >= r.match_range_start && m.match_order <= r.match_range_end && m.status !== "completed" && m.id !== r.current_match_id)
            .sort((a: any, b: any) => (a.match_order || 0) - (b.match_order || 0));
          upcoming.forEach((m: any) => {
            ctx += `      ⏭️ #${m.match_order}: ${m.athlete1?.name || "TBD"} vs ${m.athlete2?.name || "TBD"} [${m.category?.name || ""}]\n`;
          });
        }
      }
    }

    // Όλοι οι αγώνες
    if (validMatches.length > 0) {
      ctx += `  🥊 ΑΓΩΝΕΣ (${validMatches.length}):\n`;
      validMatches.forEach((m: any) => {
        const status = m.status === "completed" ? "✅" : m.status === "in_progress" ? "🔴" : "⏳";
        const winner = m.winner_id ? (m.winner_id === m.athlete1_id ? m.athlete1?.name : m.athlete2?.name) : null;
        const ring = m.ring_number ? ` Ring${m.ring_number}` : "";
        const time = m.scheduled_time ? ` ${new Date(m.scheduled_time).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}` : "";
        const c1 = m.athlete1_club?.name ? ` [${m.athlete1_club.name}]` : "";
        const c2 = m.athlete2_club?.name ? ` [${m.athlete2_club.name}]` : "";
        ctx += `    ${status} #${m.match_order || m.match_number}${ring}${time}: ${m.athlete1?.name || "TBD"}${c1} vs ${m.athlete2?.name || "TBD"}${c2}${winner ? ` → 🏆 ${winner}` : ""} [${m.category?.name || ""}]\n`;
      });
    }

    // Weigh-ins
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages = [], competitionId } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const compsContext = await buildCompetitionsContext(competitionId);

    const systemPrompt = `Είσαι ο "Hyper AI" — ψηφιακός βοηθός για τις διοργανώσεις της πλατφόρμας HYPERKIDS / RID ATHLETICS.

🎯 Ρόλος σου:
Απαντάς σε όσους είναι στις διοργανώσεις (αθλητές, προπονητές, γονείς, θεατές) για:
- Πότε/πού παίζει κάποιος (σειρά αγώνα, ώρα, ρινγκ)
- Ποιος αντιμετωπίζει ποιον, από ποια ομάδα
- Ζυγίσεις (κιλά, πέρασε/απέτυχε)
- Live YouTube links ανά ρινγκ (είναι δημόσια — μοιράσου τα ελεύθερα)
- Τρέχων αγώνας σε κάθε ρινγκ + επόμενοι
- Κατηγορίες, νικητές, αποτελέσματα

📊 ΖΩΝΤΑΝΑ ΔΕΔΟΜΕΝΑ ΔΙΟΡΓΑΝΩΣΕΩΝ:
${compsContext}

🗣️ ΚΑΝΟΝΕΣ:
- Απαντάς ΠΑΝΤΑ στα ελληνικά (εκτός αν γράψουν αγγλικά).
- Σύντομες, καθαρές απαντήσεις.
- Χρησιμοποιείς ΜΟΝΟ τα δεδομένα παραπάνω — ΜΗΝ επινοείς.
- Αν δεν υπάρχει η πληροφορία, πες "Δεν έχω αυτή τη στιγμή αυτή την πληροφορία".
- Όταν ζητούν live link, δώσε το YouTube URL απευθείας.`;

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
