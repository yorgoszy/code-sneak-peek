import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type AnalysisModule =
  | "fight_analysis"
  | "jump_analysis"
  | "bar_velocity"
  | "sprint_timer"
  | "anthropometrics";

interface BridgeRequest {
  module: AnalysisModule;
  action: "start_session" | "send_frame" | "send_batch" | "end_session" | "heartbeat";
  session_id?: string;
  device_id?: string;
  // Session start params
  ring_id?: string;
  match_id?: string;
  user_id?: string;
  sport?: string;
  camera_count?: number;
  camera_positions?: string[];
  // Frame data
  frame_data?: {
    camera_index: number;
    timestamp: number;
    // Processed data from local app (NOT raw pixels)
    pose_landmarks?: number[][]; // [x, y, z, visibility] per joint
    detected_objects?: Array<{
      label: string;
      confidence: number;
      bbox: [number, number, number, number]; // x, y, w, h
    }>;
    measurements?: Record<string, number>;
    hsv_tracking?: {
      marker_position: [number, number];
      velocity_pixels_per_frame: number;
      calibrated_velocity_ms?: number;
    };
  };
  // Batch data (multiple frames)
  frames?: Array<BridgeRequest["frame_data"]>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = (await req.json()) as BridgeRequest;
    const { module, action } = body;

    // ── START SESSION ──
    if (action === "start_session") {
      const sessionId = crypto.randomUUID();

      // Store session in ai_analysis_sessions for fight analysis
      if (module === "fight_analysis" && body.ring_id) {
        await supabase.from("ai_analysis_sessions").insert({
          id: sessionId,
          ring_id: body.ring_id,
          match_id: body.match_id || null,
          sport: body.sport || "muay_thai",
          analysis_type: "live_camera",
          status: "active",
          cameras_used: body.camera_count || 1,
          started_at: new Date().toISOString(),
          created_by: body.user_id || null,
        });
      }

      return new Response(
        JSON.stringify({
          session_id: sessionId,
          status: "active",
          module,
          message: `Session started for ${module}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── HEARTBEAT ──
    if (action === "heartbeat") {
      return new Response(
        JSON.stringify({ status: "ok", timestamp: Date.now() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── SEND FRAME (processed data, not raw pixels) ──
    if (action === "send_frame" && body.frame_data) {
      const result = await processFrame(module, body.session_id!, body.frame_data, supabase);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── SEND BATCH ──
    if (action === "send_batch" && body.frames) {
      const results = [];
      for (const frame of body.frames) {
        if (frame) {
          const result = await processFrame(module, body.session_id!, frame, supabase);
          results.push(result);
        }
      }
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── END SESSION ──
    if (action === "end_session" && body.session_id) {
      if (module === "fight_analysis") {
        await supabase
          .from("ai_analysis_sessions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", body.session_id);
      }

      return new Response(
        JSON.stringify({ status: "completed", session_id: body.session_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Camera bridge error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Process a single frame based on the module type
async function processFrame(
  module: AnalysisModule,
  sessionId: string,
  frameData: BridgeRequest["frame_data"],
  supabase: any
) {
  if (!frameData) return { error: "No frame data" };

  switch (module) {
    case "fight_analysis":
      return processFightFrame(sessionId, frameData, supabase);
    case "jump_analysis":
      return processJumpFrame(sessionId, frameData);
    case "bar_velocity":
      return processBarVelocity(sessionId, frameData);
    case "sprint_timer":
      return processSprintFrame(sessionId, frameData);
    case "anthropometrics":
      return processAnthropometrics(sessionId, frameData);
    default:
      return { error: "Unknown module" };
  }
}

// ── FIGHT ANALYSIS ──
async function processFightFrame(
  sessionId: string,
  frameData: BridgeRequest["frame_data"],
  supabase: any
) {
  // Store detected strikes as training labels
  if (frameData?.detected_objects) {
    for (const obj of frameData.detected_objects) {
      if (obj.confidence > 0.5) {
        await supabase.from("ai_training_labels").insert({
          session_id: sessionId,
          frame_timestamp: frameData.timestamp,
          camera_index: frameData.camera_index,
          strike_type: obj.label,
          strike_category: categorizeStrike(obj.label),
          fighter_corner: "red", // Will be determined by pose position
          confidence: obj.confidence,
        });
      }
    }
  }

  return {
    session_id: sessionId,
    timestamp: frameData?.timestamp,
    strikes_detected: frameData?.detected_objects?.length || 0,
    pose_received: !!frameData?.pose_landmarks,
  };
}

// ── JUMP ANALYSIS ──
function processJumpFrame(
  sessionId: string,
  frameData: BridgeRequest["frame_data"]
) {
  if (!frameData?.pose_landmarks) {
    return { session_id: sessionId, status: "waiting_for_pose" };
  }

  // Key landmarks for jump: ankles (27, 28), hips (23, 24)
  const leftAnkle = frameData.pose_landmarks[27];
  const rightAnkle = frameData.pose_landmarks[28];
  const leftHip = frameData.pose_landmarks[23];
  const rightHip = frameData.pose_landmarks[24];

  if (!leftAnkle || !rightAnkle) {
    return { session_id: sessionId, status: "landmarks_not_visible" };
  }

  const avgAnkleY = (leftAnkle[1] + rightAnkle[1]) / 2;
  const avgHipY = (leftHip[1] + rightHip[1]) / 2;

  return {
    session_id: sessionId,
    timestamp: frameData.timestamp,
    ankle_y: avgAnkleY,
    hip_y: avgHipY,
    body_height_pixels: avgAnkleY - avgHipY,
  };
}

// ── BAR VELOCITY ──
function processBarVelocity(
  sessionId: string,
  frameData: BridgeRequest["frame_data"]
) {
  if (!frameData?.hsv_tracking) {
    return { session_id: sessionId, status: "no_marker_detected" };
  }

  const { marker_position, velocity_pixels_per_frame, calibrated_velocity_ms } =
    frameData.hsv_tracking;

  return {
    session_id: sessionId,
    timestamp: frameData.timestamp,
    marker_position,
    velocity_raw: velocity_pixels_per_frame,
    velocity_ms: calibrated_velocity_ms || null,
  };
}

// ── SPRINT TIMER ──
function processSprintFrame(
  sessionId: string,
  frameData: BridgeRequest["frame_data"]
) {
  if (!frameData?.pose_landmarks) {
    return { session_id: sessionId, status: "waiting_for_pose" };
  }

  // Detect if athlete crosses a virtual gate line
  const nose = frameData.pose_landmarks[0];
  
  return {
    session_id: sessionId,
    timestamp: frameData.timestamp,
    nose_x: nose?.[0],
    nose_y: nose?.[1],
  };
}

// ── ANTHROPOMETRICS ──
function processAnthropometrics(
  sessionId: string,
  frameData: BridgeRequest["frame_data"]
) {
  if (!frameData?.pose_landmarks || !frameData?.measurements) {
    return { session_id: sessionId, status: "insufficient_data" };
  }

  return {
    session_id: sessionId,
    timestamp: frameData.timestamp,
    measurements: frameData.measurements,
    landmark_count: frameData.pose_landmarks.length,
  };
}

function categorizeStrike(label: string): string {
  const punches = ["jab", "cross", "hook", "uppercut"];
  const kicks = ["roundhouse", "front_kick", "low_kick", "teep", "side_kick"];
  const knees = ["knee", "flying_knee"];
  const elbows = ["elbow", "spinning_elbow"];

  const lower = label.toLowerCase();
  if (punches.some((p) => lower.includes(p))) return "punch";
  if (kicks.some((k) => lower.includes(k))) return "kick";
  if (knees.some((k) => lower.includes(k))) return "knee";
  if (elbows.some((e) => lower.includes(e))) return "elbow";
  return "other";
}
