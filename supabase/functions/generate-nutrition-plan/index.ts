import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PlanPayload = {
  userId: string;
  userName?: string;
  goal?: string;
  preferences?: string[];
  allergies?: string[];
  totalCalories?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
  mealsPerDay?: number;
  additionalNotes?: string;
};

function fallbackPlan(p: PlanPayload) {
  const totalCalories = Number(p.totalCalories ?? 2000);
  const proteinTarget = Number(p.proteinTarget ?? 140);
  const carbsTarget = Number(p.carbsTarget ?? 220);
  const fatTarget = Number(p.fatTarget ?? 60);
  const mealsPerDay = Math.max(3, Math.min(6, Number(p.mealsPerDay ?? 5)));

  const dayNames = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
  const mealPresets = [
    { type: "breakfast", name: "Πρωινό" },
    { type: "morning_snack", name: "Δεκατιανό" },
    { type: "lunch", name: "Μεσημεριανό" },
    { type: "afternoon_snack", name: "Απογευματινό" },
    { type: "dinner", name: "Βραδινό" },
    { type: "extra", name: "Extra" },
  ].slice(0, mealsPerDay);

  const perMeal = (v: number) => Math.round(v / mealsPerDay);

  return {
    name: `AI Πρόγραμμα Διατροφής${p.userName ? ` - ${p.userName}` : ""}`,
    description: "Εβδομαδιαίο πρόγραμμα διατροφής (πρότυπο) που δημιουργήθηκε αυτόματα.",
    goal: p.goal ?? "maintenance",
    totalCalories,
    proteinTarget,
    carbsTarget,
    fatTarget,
    // coachId is set client-side by the caller (effectiveCoachId) in the builder.
    days: dayNames.map((name, idx) => ({
      dayNumber: idx + 1,
      name,
      totalCalories,
      totalProtein: proteinTarget,
      totalCarbs: carbsTarget,
      totalFat: fatTarget,
      meals: mealPresets.map((m, i) => ({
        type: m.type,
        order: i + 1,
        name: m.name,
        description: "",
        totalCalories: perMeal(totalCalories),
        totalProtein: perMeal(proteinTarget),
        totalCarbs: perMeal(carbsTarget),
        totalFat: perMeal(fatTarget),
        foods: [],
      })),
    })),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as PlanPayload;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Return a safe fallback instead of hard failing
      return new Response(JSON.stringify({ plan: fallbackPlan(payload), warning: "LOVABLE_API_KEY missing" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system =
      "Είσαι έμπειρος κλινικός διατροφολόγος. Θα δημιουργήσεις εβδομαδιαίο πλάνο διατροφής. ΕΠΙΣΤΡΕΦΕΙΣ ΜΟΝΟ ΕΓΚΥΡΟ JSON, χωρίς markdown.";

    const user = {
      userId: payload.userId,
      userName: payload.userName,
      goal: payload.goal,
      preferences: payload.preferences ?? [],
      allergies: payload.allergies ?? [],
      totalCalories: payload.totalCalories,
      proteinTarget: payload.proteinTarget,
      carbsTarget: payload.carbsTarget,
      fatTarget: payload.fatTarget,
      mealsPerDay: payload.mealsPerDay ?? 5,
      additionalNotes: payload.additionalNotes ?? "",
    };

    const prompt = `Δώσε εβδομαδιαίο πλάνο διατροφής για τα δεδομένα χρήστη: ${JSON.stringify(user)}\n\n` +
      `Απάντηση σε αυστηρό JSON με αυτό το σχήμα (χωρίς επιπλέον πεδία):\n` +
      `{"name":string,"description":string,"goal":string,"totalCalories":number,"proteinTarget":number,"carbsTarget":number,"fatTarget":number,"days":[{"dayNumber":1-7,"name":string,"totalCalories":number,"totalProtein":number,"totalCarbs":number,"totalFat":number,"meals":[{"type":string,"order":number,"name":string,"description":string,"totalCalories":number,"totalProtein":number,"totalCarbs":number,"totalFat":number,"foods":[{"name":string,"quantity":number,"unit":string,"calories":number,"protein":number,"carbs":number,"fat":number,"notes"?:string}]}]}]}\n\n` +
      `Κανόνες: \n- 7 ημέρες, dayNumber 1..7\n- meal order ξεκινά από 1\n- mealsPerDay=${user.mealsPerDay}\n- Τα αθροίσματα ημέρας/γεύματος να είναι περίπου στα totals.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      // 402/429 should be surfaced for UI to toast
      if (aiResp.status === 402 || aiResp.status === 429) {
        return new Response(JSON.stringify({ error: t || "AI gateway error" }), {
          status: aiResp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ plan: fallbackPlan(payload) }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiResp.json();
    const content = json?.choices?.[0]?.message?.content as string | undefined;

    if (!content) {
      return new Response(JSON.stringify({ plan: fallbackPlan(payload) }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractJson = (text: string) => {
      // 1) Strip markdown code fences if present
      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fenced?.[1]) return fenced[1].trim();

      // 2) Otherwise, try to slice from first "{" to last "}" (common when model adds prose)
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        return text.slice(start, end + 1).trim();
      }

      return text.trim();
    };

    try {
      const cleaned = extractJson(content);
      const plan = JSON.parse(cleaned);
      return new Response(JSON.stringify({ plan }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Failed to parse AI JSON:", e, "raw:", content);
      return new Response(JSON.stringify({ plan: fallbackPlan(payload) }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("generate-nutrition-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
