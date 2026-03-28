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
    const { sport, rounds, totalStrikes, strikeBreakdown, strikeTypes, matchInfo } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert ${(sport || 'muay_thai').replace('_', ' ')} analyst and judge.
Analyze the fight data and generate a comprehensive post-fight report.
Consider the 10-point must scoring system used in combat sports.
Evaluate strike volume, variety, effectiveness, and aggression.`;

    const userPrompt = `Fight Analysis Data:
Match: ${matchInfo.redName} (RED) vs ${matchInfo.blueName} (BLUE)
Total Rounds: ${matchInfo.totalRounds}

Total Strikes: RED ${totalStrikes.red} / BLUE ${totalStrikes.blue}

Strike Breakdown:
RED - Punches: ${strikeBreakdown.red.punches}, Kicks: ${strikeBreakdown.red.kicks}, Knees: ${strikeBreakdown.red.knees}, Elbows: ${strikeBreakdown.red.elbows}
BLUE - Punches: ${strikeBreakdown.blue.punches}, Kicks: ${strikeBreakdown.blue.kicks}, Knees: ${strikeBreakdown.blue.knees}, Elbows: ${strikeBreakdown.blue.elbows}

Strike Types:
RED: ${JSON.stringify(strikeTypes.red)}
BLUE: ${JSON.stringify(strikeTypes.blue)}

Round Scores:
${(rounds || []).map((r: any) => `R${r.roundNumber}: RED ${r.redScore}-${r.blueScore} BLUE (Strikes: ${r.redStrikes} vs ${r.blueStrikes})`).join('\n')}

Generate a detailed post-fight analysis.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_fight_report",
              description: "Generate a structured post-fight analysis report",
              parameters: {
                type: "object",
                properties: {
                  suggestedWinner: {
                    type: "string",
                    enum: ["red", "blue", "draw"],
                    description: "Who won the fight based on the data",
                  },
                  winMethod: {
                    type: "string",
                    description: "Method of victory (e.g. Unanimous Decision, Split Decision)",
                  },
                  summary: {
                    type: "string",
                    description: "Brief overall fight summary (2-3 sentences)",
                  },
                  technicalAnalysis: {
                    type: "string",
                    description: "Detailed technical analysis of both fighters' performance",
                  },
                  redHighlights: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key highlights for red corner (3-5 points)",
                  },
                  blueHighlights: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key highlights for blue corner (3-5 points)",
                  },
                },
                required: ["suggestedWinner", "winMethod", "summary", "technicalAnalysis", "redHighlights", "blueHighlights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_fight_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
