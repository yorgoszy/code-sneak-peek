import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FrameAnalysisRequest {
  imageData?: string;
  timestamp: number;
  detectedStrike: {
    type: string;
    category: string;
    side: string;
    confidence: number;
    trajectory: string;
  } | null;
}

interface VerificationResult {
  strikeId: string;
  isValid: boolean;
  suggestedType: string | null;
  confidence: number;
  technicalNotes: string;
  isCorrectTechnique: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { frames } = await req.json() as { frames: FrameAnalysisRequest[] };

    if (!frames || frames.length === 0) {
      throw new Error("No frames provided for analysis");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const verifications: VerificationResult[] = [];

    // Process each frame
    for (const frame of frames) {
      const systemPrompt = `You are an expert combat sports analyst specializing in Muay Thai, boxing, and MMA. 
Your task is to analyze strike detection data and verify the accuracy of the detection.

For each strike, evaluate:
1. Is the detected strike type correct?
2. Is the technique executed correctly?
3. What is your confidence in this assessment?
4. Any technical notes for improvement?

Strike Categories:
- PUNCH: jab, cross, hook, uppercut
- KICK: front_kick, roundhouse_kick, side_kick, back_kick
- KNEE: knee, flying_knee
- ELBOW: elbow, spinning_elbow
- CLINCH: clinch

Respond in JSON format only.`;

      const userPrompt = frame.detectedStrike 
        ? `Analyze this detected strike:
Type: ${frame.detectedStrike.type}
Category: ${frame.detectedStrike.category}
Side: ${frame.detectedStrike.side}
Detection Confidence: ${(frame.detectedStrike.confidence * 100).toFixed(1)}%
Trajectory: ${frame.detectedStrike.trajectory}
Timestamp: ${frame.timestamp.toFixed(2)}s

Based on typical movement patterns for this strike type, provide your verification.`
        : `No strike was detected at timestamp ${frame.timestamp.toFixed(2)}s. 
Analyze if this is correct or if a strike might have been missed.`;

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
            { role: "user", content: userPrompt }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "verify_strike",
                description: "Provide strike verification result",
                parameters: {
                  type: "object",
                  properties: {
                    isValid: {
                      type: "boolean",
                      description: "Whether the strike detection is valid"
                    },
                    suggestedType: {
                      type: "string",
                      enum: ["jab", "cross", "hook", "uppercut", "front_kick", "roundhouse_kick", "side_kick", "back_kick", "knee", "flying_knee", "elbow", "spinning_elbow", "clinch", null],
                      description: "Suggested correct strike type if different"
                    },
                    confidence: {
                      type: "number",
                      description: "Confidence score 0-1"
                    },
                    technicalNotes: {
                      type: "string",
                      description: "Technical notes about the technique"
                    },
                    isCorrectTechnique: {
                      type: "boolean",
                      description: "Whether the technique was executed correctly"
                    }
                  },
                  required: ["isValid", "confidence", "technicalNotes", "isCorrectTechnique"],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "verify_strike" } }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.error("Rate limit exceeded");
          continue;
        }
        if (response.status === 402) {
          throw new Error("Payment required for AI analysis");
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      
      if (toolCall?.function?.arguments) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          verifications.push({
            strikeId: crypto.randomUUID(),
            isValid: args.isValid ?? true,
            suggestedType: args.suggestedType ?? null,
            confidence: args.confidence ?? 0.5,
            technicalNotes: args.technicalNotes ?? "",
            isCorrectTechnique: args.isCorrectTechnique ?? true,
          });
        } catch (parseError) {
          console.error("Failed to parse AI response:", parseError);
        }
      }
    }

    return new Response(JSON.stringify({ verifications }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
