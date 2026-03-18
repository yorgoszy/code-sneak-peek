import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type CombatSport =
  | "muay_thai"
  | "boxing"
  | "kickboxing"
  | "mma"
  | "karate"
  | "taekwondo"
  | "judo";

type AnalysisMode =
  | "strike_counting"
  | "round_stats"
  | "technique_evaluation"
  | "fighter_comparison"
  | "full";

interface AnalysisRequest {
  videoUrl?: string; // Supabase Storage signed URL
  videoBase64?: string; // base64 video (for small clips)
  sport: CombatSport;
  mode: AnalysisMode;
  roundNumber?: number;
  fighterNames?: { red: string; blue: string };
  durationSeconds?: number;
  // Multi-camera support
  camerasUsed?: number;
  cameraPositions?: string[]; // ['front', 'back', 'left', 'right']
  additionalVideoUrls?: string[]; // Extra camera angle URLs
}

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const sportLabels: Record<CombatSport, string> = {
  muay_thai: "Muay Thai",
  boxing: "Boxing",
  kickboxing: "Kickboxing",
  mma: "MMA (Mixed Martial Arts)",
  karate: "Karate",
  taekwondo: "Taekwondo",
  judo: "Judo",
};

function buildSystemPrompt(sport: CombatSport, mode: AnalysisMode): string {
  const sportName = sportLabels[sport];

  const basePrompt = `You are an elite ${sportName} video analyst with decades of experience judging and coaching professional fighters. You analyze fight footage with extreme precision.

SPORT: ${sportName}
${sport === "muay_thai" ? 'WEAPONS: punches (jab, cross, hook, uppercut), kicks (teep, roundhouse, question mark, axe), knees (straight, diagonal, flying, clinch), elbows (horizontal, uppercut, spinning, slashing), clinch work' : ''}
${sport === "boxing" ? 'WEAPONS: jab, cross, lead hook, rear hook, lead uppercut, rear uppercut, overhand, body shots' : ''}
${sport === "kickboxing" ? 'WEAPONS: punches (jab, cross, hook, uppercut), kicks (front, roundhouse high/mid/low, side, back, spinning heel)' : ''}
${sport === "mma" ? 'WEAPONS: punches (jab, cross, hook, uppercut, hammer fist, backfist), kicks (front, roundhouse, side, oblique, calf), knees (straight, flying), elbows (all variations), clinch, ground and pound' : ''}
${sport === "karate" ? 'WEAPONS: oi-zuki, gyaku-zuki, uraken, mae geri, mawashi geri, yoko geri, ushiro geri' : ''}
${sport === "taekwondo" ? 'WEAPONS: front kick, dollyo chagi, yeop chagi, dwi chagi, spinning hook kick, axe kick, tornado kick, straight punches to body' : ''}
${sport === "judo" ? 'WEAPONS: atemi waza (open hand strikes, setup punches), focus on grip fighting and throw setups' : ''}`;

  const modeInstructions: Record<AnalysisMode, string> = {
    strike_counting: `
TASK: Count and classify every strike thrown by each fighter.

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "red_corner": {
    "total_strikes_thrown": number,
    "total_strikes_landed": number,
    "strikes": {
      "jab": { "thrown": number, "landed": number },
      "cross": { "thrown": number, "landed": number },
      "hook": { "thrown": number, "landed": number },
      "uppercut": { "thrown": number, "landed": number },
      "front_kick": { "thrown": number, "landed": number },
      "roundhouse_kick": { "thrown": number, "landed": number },
      "knee": { "thrown": number, "landed": number },
      "elbow": { "thrown": number, "landed": number },
      "other": { "thrown": number, "landed": number }
    },
    "accuracy_percentage": number
  },
  "blue_corner": {
    "total_strikes_thrown": number,
    "total_strikes_landed": number,
    "strikes": { ... },
    "accuracy_percentage": number
  }
}`,

    round_stats: `
TASK: Provide round-by-round statistics.

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "round_number": number,
  "duration_seconds": number,
  "red_corner": {
    "total_strikes": number,
    "significant_strikes": number,
    "strikes_landed": number,
    "accuracy_percentage": number,
    "offensive_time_seconds": number,
    "defensive_actions": number,
    "ring_control_percentage": number,
    "aggression_score": number,
    "clinch_time_seconds": number
  },
  "blue_corner": { ... },
  "round_winner_suggestion": "red" | "blue" | "even",
  "round_notes": "string"
}`,

    technique_evaluation: `
TASK: Evaluate each fighter's technique quality.

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "red_corner": {
    "overall_technique_score": number,
    "guard_quality": { "score": number, "notes": "string" },
    "footwork": { "score": number, "notes": "string" },
    "combinations": { "score": number, "notes": "string" },
    "defense": { "score": number, "notes": "string" },
    "timing": { "score": number, "notes": "string" },
    "power": { "score": number, "notes": "string" },
    "strengths": ["string"],
    "weaknesses": ["string"],
    "improvement_tips": ["string"]
  },
  "blue_corner": { ... }
}

Scores are 1-10. Be specific and actionable in notes.`,

    fighter_comparison: `
TASK: Compare two fighters head-to-head.

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "red_corner_name": "string",
  "blue_corner_name": "string",
  "categories": {
    "striking_volume": { "red": number, "blue": number, "advantage": "red" | "blue" | "even" },
    "striking_accuracy": { "red": number, "blue": number, "advantage": "red" | "blue" | "even" },
    "power": { "red": number, "blue": number, "advantage": "red" | "blue" | "even" },
    "defense": { "red": number, "blue": number, "advantage": "red" | "blue" | "even" },
    "ring_control": { "red": number, "blue": number, "advantage": "red" | "blue" | "even" },
    "aggression": { "red": number, "blue": number, "advantage": "red" | "blue" | "even" },
    "technique": { "red": number, "blue": number, "advantage": "red" | "blue" | "even" }
  },
  "overall_advantage": "red" | "blue" | "even",
  "summary": "string"
}

Scores are 1-10.`,

    full: `
TASK: Complete fight analysis including strike counting, technique evaluation, and fighter comparison.

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "strike_stats": {
    "red_corner": {
      "total_strikes_thrown": number,
      "total_strikes_landed": number,
      "strikes": {
        "jab": { "thrown": number, "landed": number },
        "cross": { "thrown": number, "landed": number },
        "hook": { "thrown": number, "landed": number },
        "uppercut": { "thrown": number, "landed": number },
        "front_kick": { "thrown": number, "landed": number },
        "roundhouse_kick": { "thrown": number, "landed": number },
        "knee": { "thrown": number, "landed": number },
        "elbow": { "thrown": number, "landed": number },
        "other": { "thrown": number, "landed": number }
      },
      "accuracy_percentage": number
    },
    "blue_corner": { ... }
  },
  "technique": {
    "red_corner": {
      "overall_score": number,
      "strengths": ["string"],
      "weaknesses": ["string"],
      "improvement_tips": ["string"]
    },
    "blue_corner": { ... }
  },
  "comparison": {
    "striking_volume": { "advantage": "red" | "blue" | "even" },
    "accuracy": { "advantage": "red" | "blue" | "even" },
    "power": { "advantage": "red" | "blue" | "even" },
    "defense": { "advantage": "red" | "blue" | "even" },
    "ring_control": { "advantage": "red" | "blue" | "even" },
    "overall": { "advantage": "red" | "blue" | "even" }
  },
  "round_winner_suggestion": "red" | "blue" | "even",
  "analysis_notes": "string"
}`,
  };

  return basePrompt + "\n" + modeInstructions[mode];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      videoUrl,
      videoBase64,
      sport = "muay_thai",
      mode = "full",
      roundNumber,
      fighterNames,
      durationSeconds,
      camerasUsed = 1,
      cameraPositions = [],
      additionalVideoUrls = [],
    } = (await req.json()) as AnalysisRequest;

    if (!videoUrl && !videoBase64) {
      throw new Error("Either videoUrl or videoBase64 must be provided");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt(sport, mode);

    let userPrompt = `Analyze this ${sportLabels[sport]} fight video.`;
    if (roundNumber) userPrompt += ` This is Round ${roundNumber}.`;
    if (fighterNames) {
      userPrompt += ` Red corner: ${fighterNames.red}. Blue corner: ${fighterNames.blue}.`;
    }
    if (durationSeconds) {
      userPrompt += ` Video duration: ${durationSeconds} seconds.`;
    }
    if (camerasUsed > 1 && cameraPositions.length > 0) {
      userPrompt += `\n\nIMPORTANT: This analysis uses ${camerasUsed} synchronized cameras from positions: ${cameraPositions.join(', ')}. Cross-reference all angles for maximum accuracy. A strike visible from multiple angles has higher confidence.`;
    }
    userPrompt += `\n\nProvide your analysis as JSON only. No markdown formatting, no code blocks, just raw JSON.`;

    // Build the request parts
    const parts: any[] = [{ text: systemPrompt + "\n\n" + userPrompt }];

    if (videoBase64) {
      // Inline video data
      const mimeType = videoBase64.startsWith("/9j/")
        ? "image/jpeg"
        : videoBase64.startsWith("AAAA")
        ? "video/mp4"
        : "video/mp4";

      parts.unshift({
        inline_data: {
          mime_type: mimeType,
          data: videoBase64,
        },
      });
    } else if (videoUrl) {
      // Use fileData with URL for larger videos
      parts.unshift({
        file_data: {
          mime_type: "video/mp4",
          file_uri: videoUrl,
        },
      });
    }

    // Add additional camera angles
    if (additionalVideoUrls && additionalVideoUrls.length > 0) {
      for (const extraUrl of additionalVideoUrls) {
        parts.push({
          file_data: {
            mime_type: "video/mp4",
            file_uri: extraUrl,
          },
        });
      }
    }

    console.log(
      `Analyzing ${sport} video, mode: ${mode}, round: ${roundNumber || "N/A"}, cameras: ${camerasUsed}`
    );

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API error [${response.status}]:`, errorBody);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please wait and try again.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
    }

    const geminiData = await response.json();
    const textContent =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the JSON response
    let analysisResult: any;
    try {
      // Clean potential markdown code blocks
      const cleaned = textContent
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      analysisResult = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", textContent);
      analysisResult = {
        raw_response: textContent,
        parse_error: true,
      };
    }

    // Token usage for cost tracking
    const usageMetadata = geminiData.usageMetadata || {};

    return new Response(
      JSON.stringify({
        analysis: analysisResult,
        metadata: {
          sport,
          mode,
          roundNumber: roundNumber || null,
          fighterNames: fighterNames || null,
          model: "gemini-2.0-flash",
          tokens: {
            input: usageMetadata.promptTokenCount || 0,
            output: usageMetadata.candidatesTokenCount || 0,
            total: usageMetadata.totalTokenCount || 0,
          },
          estimatedCost: {
            input:
              ((usageMetadata.promptTokenCount || 0) / 1_000_000) * 1.25,
            output:
              ((usageMetadata.candidatesTokenCount || 0) / 1_000_000) * 5.0,
          },
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Video analysis error:", error);
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
