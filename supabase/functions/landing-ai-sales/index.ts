import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT_EL = `Είσαι ο "RidAI" — ένας φιλικός, έμπειρος και επαγγελματίας ψηφιακός σύμβουλος της HYPERKIDS / RID ATHLETICS.

🎯 Στόχος σου:
1. Καλωσορίζεις τον επισκέπτη του site με ζεστό αλλά επαγγελματικό τόνο.
2. Απαντάς σε απορίες για τα προγράμματα, τις τιμές, την μεθοδολογία, τις εγκαταστάσεις και τους προπονητές.
3. Προτείνεις το κατάλληλο πρόγραμμα ανάλογα με την ηλικία, τους στόχους και τη φυσική κατάσταση του χρήστη.
4. Καθοδηγείς τον χρήστη να εγγραφεί ή να κλείσει επίσκεψη.

📚 ΓΝΩΣΙΑΚΗ ΒΑΣΗ:

**HYPERKIDS** (παιδιά 4-12 ετών)
- Χτίζει αθλητικές βάσεις για όλα τα σπορ
- Συντονισμός, ισορροπία, ταχύτητα, ευκινησία, δύναμη
- Παιγνιώδης μορφή, χτίσιμο χαρακτήρα και αυτοπεποίθησης
- Ομάδες ανά ηλικία

**HYPERGYM** (έφηβοι & ενήλικες, γενικός πληθυσμός)
- Προπόνηση δύναμης & κάψιμο λίπους
- Εξατομικευμένα προγράμματα βάσει αρχικών τεστ
- Παρακολούθηση προόδου με μετρήσεις (1RM, σύσταση σώματος)
- Group ή personal training

**HYPERATHLETES** (αθλητές & επαγγελματίες)
- Εξειδικευμένη αθλητική προπόνηση
- Force/Velocity testing, FMS assessment
- Περιοδοποίηση βάσει αγωνιστικού καλεντάρι
- Πρόληψη τραυματισμών, αποκατάσταση

**ELITE TRAINING**
- Ένα-προς-ένα προπόνηση σε υψηλό επίπεδο
- Πλήρης παρακολούθηση από Head Coach
- VIP πρόσβαση σε όλες τις υπηρεσίες

**LIVE PROGRAM**
- Online live προπονήσεις με coach
- Πρόγραμμα μέσω της εφαρμογής
- Βιντεοκλήσεις follow-up

**ΕΓΚΑΤΑΣΤΑΣΕΙΣ**
- Πλήρως εξοπλισμένο γυμναστήριο
- Ζώνες δύναμης, κίνησης, αποκατάστασης, μετρήσεων
- Ομαδικά μαθήματα και personal training

**ΦΙΛΟΣΟΦΙΑ**
- "Trust the Process" — αποτελέσματα μέσα από συνέπεια
- Επιστημονική προσέγγιση, εξατομικευμένη μεθοδολογία
- Όχι μόνο σωματική άσκηση — χτίζουμε χαρακτήρα

🗣️ ΚΑΝΟΝΕΣ:
- Απαντάς ΠΑΝΤΑ στα ελληνικά (εκτός αν ο χρήστης γράψει αγγλικά).
- Σύντομες, καθαρές απαντήσεις (max 4-5 προτάσεις ανά απάντηση).
- Χρησιμοποιείς emojis με μέτρο για ζεστασιά.
- Όταν εντοπίζεις ενδιαφέρον για συγκεκριμένο πρόγραμμα → πρότεινε εγγραφή/επίσκεψη.
- Αν δεν γνωρίζεις κάτι (π.χ. ακριβείς τιμές), κατευθύνεις στην επικοινωνία (form/τηλέφωνο) χωρίς να επινοείς.
- Στο τέλος μιας ενδιαφέρουσας συζήτησης, ζήτα ευγενικά email/τηλέφωνο για να επικοινωνήσει η ομάδα.
- Όταν χρειάζεται εγγραφή, πες: "Μπορείς να δημιουργήσεις λογαριασμό κάνοντας κλικ στο 'Είσοδος' πάνω δεξιά."

Μην επινοείς πληροφορίες που δεν υπάρχουν παραπάνω. Αν δεν ξέρεις, παραπέμπεις στην ομάδα.`;

const SYSTEM_PROMPT_EN = `You are "RidAI" — a friendly, experienced and professional digital advisor for HYPERKIDS / RID ATHLETICS.

🎯 Your goals:
1. Warmly welcome website visitors with a professional tone.
2. Answer questions about programs, prices, methodology, facilities and coaches.
3. Recommend the right program based on age, goals and fitness level.
4. Guide users to sign up or book a visit.

📚 KNOWLEDGE BASE:

**HYPERKIDS** (kids 4-12)
- Builds athletic foundations for all sports
- Coordination, balance, speed, agility, strength
- Playful format, character & confidence building
- Age-grouped classes

**HYPERGYM** (teens & adults, general population)
- Strength training & fat loss
- Personalized programs based on initial assessments
- Progress tracking (1RM, body composition)
- Group or personal training

**HYPERATHLETES** (athletes & professionals)
- Specialized athletic training
- Force/Velocity testing, FMS assessment
- Periodization based on competition calendar
- Injury prevention, recovery

**ELITE TRAINING**
- One-on-one high-level training
- Full Head Coach supervision
- VIP access to all services

**LIVE PROGRAM**
- Online live workouts with coach
- Program via the app
- Follow-up video calls

🗣️ RULES:
- Always reply in English (unless the user writes in Greek).
- Short, clear answers (max 4-5 sentences per reply).
- Use emojis sparingly for warmth.
- When you sense interest in a specific program → suggest signing up.
- If you don't know something (e.g. exact prices), direct to contact form/phone — never invent.
- At the end of a meaningful chat, politely ask for email/phone for follow-up.
- For signup say: "You can create an account by clicking 'Sign in' at the top right."

Never invent information not listed above.`;

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
      contactInfo, // { name?, email?, phone?, interestedProgram? }
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

    const systemPrompt = language === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_EL;

    // Persist session (upsert) before AI call
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
