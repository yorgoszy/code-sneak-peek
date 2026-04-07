import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LiveAnalysisRequest {
  frames: string[]; // base64 JPEG frames from cameras
  sport: string;
  roundNumber?: number;
  fighterNames?: { red: string; blue: string };
  cameraPositions?: string[];
  context?: string; // previous analysis for continuity
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const {
      frames,
      sport = "muay_thai",
      roundNumber,
      fighterNames,
      cameraPositions = [],
      context,
    } = (await req.json()) as LiveAnalysisRequest;

    if (!frames || frames.length === 0) {
      throw new Error("No frames provided");
    }

    const sportName = sport.replace(/_/g, " ").toUpperCase();

    const systemPrompt = `You are an elite ${sportName} live fight analyst watching a real-time camera feed from a competition ring.

You receive snapshot frames from ring cameras and must provide INSTANT analysis of what you see.

RULES:
- Be concise and direct — this is real-time commentary
- Focus on: current action, fighter positions, strikes happening NOW
- Identify which corner (Red/Blue) is being more active
- Note any significant strikes, clinches, or defensive actions
- If you can identify fighters, reference them by name
- Keep responses SHORT (2-4 sentences max)

Respond with ONLY valid JSON:
{
  "commentary": "Brief real-time commentary of what's happening",
  "red_activity": "attacking" | "defending" | "neutral" | "clinch",
  "blue_activity": "attacking" | "defending" | "neutral" | "clinch",
  "action_level": "high" | "medium" | "low",
  "strikes_visible": [{"type": "string", "corner": "red"|"blue", "landed": boolean}],
  "ring_control": "red" | "blue" | "even",
  "notable_technique": "string or null"
}`;

    let userPrompt = `Live ${sportName} fight analysis.`;
    if (roundNumber) userPrompt += ` Round ${roundNumber}.`;
    if (fighterNames) {
      userPrompt += ` Red corner: ${fighterNames.red}. Blue corner: ${fighterNames.blue}.`;
    }
    if (cameraPositions.length > 0) {
      userPrompt += ` Camera angles: ${cameraPositions.join(", ")}.`;
    }
    if (context) {
      userPrompt += `\n\nPrevious analysis context: ${context}`;
    }
    userPrompt += `\n\nAnalyze the current frame(s) and describe what is happening RIGHT NOW.`;

    // Build messages with inline images
    const content: any[] = [];

    // Add each frame as an image
    for (let i = 0; i < Math.min(frames.length, 4); i++) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${frames[i]}`,
        },
      });
    }

    content.push({
      type: "text",
      text: userPrompt,
    });

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "live_analysis",
                description: "Provide real-time fight analysis",
                parameters: {
                  type: "object",
                  properties: {
                    commentary: {
                      type: "string",
                      description: "Brief real-time commentary",
                    },
                    red_activity: {
                      type: "string",
                      enum: ["attacking", "defending", "neutral", "clinch"],
                    },
                    blue_activity: {
                      type: "string",
                      enum: ["attacking", "defending", "neutral", "clinch"],
                    },
                    action_level: {
                      type: "string",
                      enum: ["high", "medium", "low"],
                    },
                    strikes_visible: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string" },
                          corner: {
                            type: "string",
                            enum: ["red", "blue"],
                          },
                          landed: { type: "boolean" },
                        },
                        required: ["type", "corner", "landed"],
                      },
                    },
                    ring_control: {
                      type: "string",
                      enum: ["red", "blue", "even"],
                    },
                    notable_technique: {
                      type: "string",
                      description: "Notable technique observed or null",
                    },
                  },
                  required: [
                    "commentary",
                    "red_activity",
                    "blue_activity",
                    "action_level",
                    "ring_control",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "live_analysis" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Slowing down..." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add funds." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    let analysis = {
      commentary: "Ανάλυση σε εξέλιξη...",
      red_activity: "neutral",
      blue_activity: "neutral",
      action_level: "low",
      strikes_visible: [],
      ring_control: "even",
      notable_technique: null,
    };

    if (toolCall?.function?.arguments) {
      try {
        analysis = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Parse error:", e);
      }
    }

    return new Response(
      JSON.stringify({
        analysis,
        timestamp: Date.now(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Live analysis error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
