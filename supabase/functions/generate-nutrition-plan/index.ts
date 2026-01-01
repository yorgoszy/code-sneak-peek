import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

type FoodItem = {
  id: string;
  name: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  portion_size: number;
  portion_unit: string;
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

    // Initialize Supabase client to fetch foods from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all foods from database
    const { data: foods, error: foodsError } = await supabase
      .from("foods")
      .select("id, name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, portion_size, portion_unit")
      .order("category")
      .order("name");

    if (foodsError) {
      console.error("Error fetching foods:", foodsError);
    }

    const foodsList = (foods as FoodItem[]) || [];
    console.log(`Fetched ${foodsList.length} foods from database`);

    // Group foods by category for better AI understanding
    const foodsByCategory: Record<string, FoodItem[]> = {};
    for (const food of foodsList) {
      const cat = food.category || "other";
      if (!foodsByCategory[cat]) foodsByCategory[cat] = [];
      foodsByCategory[cat].push(food);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ plan: fallbackPlan(payload), warning: "LOVABLE_API_KEY missing" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a compact food list for the prompt (keep it small to stay fast)
    const MAX_PER_CATEGORY = 12;
    const MAX_TOTAL = 80;
    let totalIncluded = 0;

    const foodSummary = Object.entries(foodsByCategory)
      .map(([cat, items]) => {
        if (totalIncluded >= MAX_TOTAL) return null;
        const slice = items.slice(0, Math.max(0, Math.min(MAX_PER_CATEGORY, MAX_TOTAL - totalIncluded)));
        totalIncluded += slice.length;

        // ultra-compact: name|kcal|P|C|F (per 100g)
        const itemStr = slice
          .map((f) => `${f.name}|${f.calories_per_100g}kcal|P${f.protein_per_100g}|C${f.carbs_per_100g}|F${f.fat_per_100g}`)
          .join(", ");

        return `${cat}: ${itemStr}`;
      })
      .filter(Boolean)
      .join("\n");

    console.log(`Food summary items included: ${totalIncluded}`);


    const system =
      `Είσαι έμπειρος κλινικός διατροφολόγος. Θα δημιουργήσεις εβδομαδιαίο πλάνο διατροφής ΧΡΗΣΙΜΟΠΟΙΩΝΤΑΣ ΜΟΝΟ τα παρακάτω τρόφιμα από τη βάση δεδομένων. ΕΠΙΣΤΡΕΦΕΙΣ ΜΟΝΟ ΕΓΚΥΡΟ JSON, χωρίς markdown.`;

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
      `ΔΙΑΘΕΣΙΜΑ ΤΡΟΦΙΜΑ (ΧΡΗΣΙΜΟΠΟΙΗΣΕ ΜΟΝΟ ΑΥΤΑ):\n${foodSummary}\n\n` +
      `Απάντηση σε αυστηρό JSON με αυτό το σχήμα:\n` +
      `{"name":string,"description":string,"goal":string,"totalCalories":number,"proteinTarget":number,"carbsTarget":number,"fatTarget":number,"days":[{"dayNumber":1-7,"name":string,"totalCalories":number,"totalProtein":number,"totalCarbs":number,"totalFat":number,"meals":[{"type":string,"order":number,"name":string,"description":string,"totalCalories":number,"totalProtein":number,"totalCarbs":number,"totalFat":number,"foods":[{"name":string,"quantity":number,"unit":string,"calories":number,"protein":number,"carbs":number,"fat":number,"notes"?:string}]}]}]}\n\n` +
      `Κανόνες:\n- 7 ημέρες, dayNumber 1..7\n- meal order ξεκινά από 1\n- mealsPerDay=${user.mealsPerDay}\n- Χρησιμοποίησε ΑΚΡΙΒΩΣ τα ονόματα των τροφίμων από τη λίστα\n- Υπολόγισε τις θρεπτικές αξίες με βάση την ποσότητα\n- Τα αθροίσματα ημέρας/γεύματος να είναι περίπου στα totals.`;

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
       }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
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
      console.log("No content from AI, using fallback");
      return new Response(JSON.stringify({ plan: fallbackPlan(payload) }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractJson = (text: string) => {
      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fenced?.[1]) return fenced[1].trim();

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
      console.log("Successfully parsed AI plan with", plan.days?.length, "days");
      return new Response(JSON.stringify({ plan }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Failed to parse AI JSON:", e, "raw:", content.substring(0, 500));
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
