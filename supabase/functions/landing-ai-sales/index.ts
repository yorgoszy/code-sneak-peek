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
    if (dayParts.length === 0) continue;
    lines.push(`• **${s.name}** (${language === "en" ? "max" : "max"} ${s.max_capacity}) — ${dayParts.join(" | ")}`);
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
- Όταν εντοπίζεις ενδιαφέρον → πρότεινε δοκιμαστική επίσκεψη ή εγγραφή: "Μπορείς να δημιουργήσεις λογαριασμό κάνοντας κλικ στο 'Είσοδος' πάνω δεξιά."
- Στο τέλος ζήτα ευγενικά email/τηλέφωνο για follow-up.`;

const SYSTEM_PROMPT_EN = (sectionsBlock: string) => `You are "Hyper AI" — a friendly, experienced and professional digital advisor for HYPERKIDS / RID ATHLETICS.

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
- When you sense interest → suggest a trial visit: "You can create an account by clicking 'Sign in' at the top right."
- At the end, politely ask for email/phone for follow-up.`;

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

    const systemPrompt =
      language === "en" ? SYSTEM_PROMPT_EN(sectionsBlock) : SYSTEM_PROMPT_EL(sectionsBlock);

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
