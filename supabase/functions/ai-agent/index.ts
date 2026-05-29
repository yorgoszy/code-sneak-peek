// Module 14: Unified AI Agent (Gemini)
// Strictly additive — does not touch other AI functions.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";
import { toolsForMode, findTool, type ToolContext } from "./tools.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: any, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM_PROMPTS: Record<string, string> = {
  admin: `Είσαι ο AI assistant της πλατφόρμας hyperkids. Ο χρήστης είναι admin με πλήρη πρόσβαση. Έχεις διαθέσιμα tools για να διαβάζεις, να ψάχνεις, να αναλύεις και να τροποποιείς δεδομένα. Destructive operations (delete, bulk update σε ευαίσθητα tables) απαιτούν explicit confirmation από τον χρήστη — κάλεσε το αντίστοιχο tool, εξήγησε ΑΚΡΙΒΩΣ τι θα κάνει, και περίμενε confirmation πριν εκτελέσεις. Όταν ο χρήστης ρωτάει 'πόσοι', 'ποιοι', 'top X' → χρησιμοποίησε aggregate_query ή query_table. Όταν χρησιμοποιείς αριθμούς, εξήγησε από πού τους πήρες. Απαντάς πάντα στα Ελληνικά εκτός αν ο χρήστης γράψει Αγγλικά.`,
  coach: `Είσαι ο AI coach assistant. Ο χρήστης είναι προπονητής. Tools διαθέσιμα: list_my_athletes, get_athlete_summary, get_athlete_recent_workouts. Δεν μπορείς να δεις άλλους coaches ή τα δικά τους athletes (το RLS το επιβάλλει). Βοηθάς στην αξιολόγηση progress, δημιουργία notes, και ερωτήσεις προπόνησης.`,
  athlete: `Είσαι ο προσωπικός AI assistant του αθλητή. Tools: get_my_summary, get_my_recent_workouts, get_my_program. Απαντάς σε ερωτήσεις για τη δική του προπόνηση. Δεν δίνεις ιατρικές συμβουλές.`,
  general: `Γενικός AI assistant για ερωτήσεις προπόνησης/διατροφής/αποκατάστασης. Δεν έχεις tools. Δεν έχεις πρόσβαση σε προσωπικά data. Δίνεις γενικές εκπαιδευτικές πληροφορίες με αναφορά σε bibliography όπου είναι δυνατό.`,
};

function modeAllowedForRole(mode: string, role: string): boolean {
  if (mode === "admin") return role === "admin";
  if (mode === "coach") return role === "coach" || role === "admin";
  return true; // athlete, general
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY missing from project secrets" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const authUserId = claimsData.claims.sub as string;

    // Resolve app user row
    const { data: appUser, error: auErr } = await admin
      .from("app_users")
      .select("id, role")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    if (auErr || !appUser) return json({ error: "App user not found" }, 403);

    const body = await req.json();
    const mode = body.mode as "admin" | "coach" | "athlete" | "general";
    if (!mode || !SYSTEM_PROMPTS[mode]) return json({ error: "Invalid mode" }, 400);
    if (!modeAllowedForRole(mode, appUser.role)) return json({ error: "Mode not allowed for role" }, 403);

    let conversationId: string | undefined = body.conversation_id;
    const confirmPendingId: string | undefined = body.confirm_pending_id;
    const userMessage: string | undefined = body.message;

    // Get or create conversation
    if (!conversationId) {
      const { data: conv, error: cErr } = await admin
        .from("agent_conversations")
        .insert({
          user_id: appUser.id,
          mode,
          title: userMessage ? userMessage.slice(0, 60) : "Νέα συνομιλία",
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (cErr || !conv) return json({ error: cErr?.message || "Failed to create conversation" }, 500);
      conversationId = conv.id;
    }

    const toolCtx: ToolContext = {
      appUserId: appUser.id,
      authUserId,
      role: appUser.role,
      mode,
      admin,
      user: userClient,
    };

    // Handle pending confirmation execution path
    let confirmedToolResult: { name: string; result: any } | null = null;
    if (confirmPendingId) {
      const { data: pending, error: pErr } = await admin
        .from("agent_pending_confirmations")
        .select("*")
        .eq("id", confirmPendingId)
        .maybeSingle();
      if (pErr || !pending) return json({ error: "Pending confirmation not found" }, 404);
      if (pending.resolved) return json({ error: "Already resolved" }, 400);
      if (new Date(pending.expires_at) < new Date()) {
        await admin
          .from("agent_pending_confirmations")
          .update({ resolved: true, resolution: "expired", resolved_at: new Date().toISOString() })
          .eq("id", confirmPendingId);
        return json({ error: "Confirmation expired" }, 400);
      }

      const tool = findTool(pending.tool_name);
      if (!tool) return json({ error: "Unknown tool" }, 400);

      const start = Date.now();
      let result: any, errorStr: string | null = null;
      try {
        result = await tool.execute(pending.arguments, toolCtx);
      } catch (e: any) {
        errorStr = String(e?.message || e);
        result = { error: errorStr };
      }
      const duration = Date.now() - start;

      await admin.from("agent_pending_confirmations").update({
        resolved: true,
        resolution: "approved",
        resolved_at: new Date().toISOString(),
      }).eq("id", confirmPendingId);

      await admin.from("agent_tool_executions").insert({
        conversation_id: conversationId,
        user_id: appUser.id,
        tool_name: pending.tool_name,
        arguments: pending.arguments,
        result,
        error: errorStr,
        required_confirmation: true,
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        confirmed_by: appUser.id,
        executed_at: new Date().toISOString(),
        duration_ms: duration,
      });

      confirmedToolResult = { name: pending.tool_name, result };
    } else {
      if (!userMessage || !userMessage.trim()) return json({ error: "Empty message" }, 400);
      await admin.from("agent_messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: userMessage,
      });
    }

    // Load history (last 20 messages)
    const { data: history } = await admin
      .from("agent_messages")
      .select("role, content, tool_calls, tool_call_id")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(40);

    // Build Gemini chat
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const modelName = "gemini-2.5-flash"; // per project memory rule
    const availableTools = toolsForMode(mode);
    const toolsArg = availableTools.length
      ? [{
          functionDeclarations: availableTools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        }]
      : undefined;

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPTS[mode],
      tools: toolsArg as any,
    });

    // Convert history to Gemini format
    const geminiHistory: any[] = [];
    for (const m of history || []) {
      if (m.role === "user") {
        geminiHistory.push({ role: "user", parts: [{ text: m.content || "" }] });
      } else if (m.role === "assistant") {
        const parts: any[] = [];
        if (m.content) parts.push({ text: m.content });
        if (Array.isArray(m.tool_calls)) {
          for (const tc of m.tool_calls) {
            parts.push({ functionCall: { name: tc.name, args: tc.args } });
          }
        }
        if (parts.length) geminiHistory.push({ role: "model", parts });
      } else if (m.role === "tool") {
        try {
          const payload = m.content ? JSON.parse(m.content) : {};
          geminiHistory.push({
            role: "user",
            parts: [{ functionResponse: { name: m.tool_call_id || "tool", response: payload } }],
          });
        } catch {
          /* skip */
        }
      }
    }

    // Drop last user message from history (we send it via sendMessage)
    let initialMessageParts: any[];
    if (confirmedToolResult) {
      initialMessageParts = [{
        functionResponse: { name: confirmedToolResult.name, response: confirmedToolResult.result },
      }];
      // store tool result message in DB
      await admin.from("agent_messages").insert({
        conversation_id: conversationId,
        role: "tool",
        tool_call_id: confirmedToolResult.name,
        content: JSON.stringify(confirmedToolResult.result),
      });
    } else {
      // pop trailing user
      if (geminiHistory.length && geminiHistory[geminiHistory.length - 1].role === "user") {
        const last = geminiHistory.pop();
        initialMessageParts = last.parts;
      } else {
        initialMessageParts = [{ text: userMessage! }];
      }
    }

    const chat = model.startChat({ history: geminiHistory });
    let response = await chat.sendMessage(initialMessageParts);

    // Iterate tool calls
    const MAX_TURNS = 8;
    const collectedToolCalls: any[] = [];
    let pendingConfirmations: any[] = [];

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const fc = response.response.functionCalls?.() || [];
      if (!fc.length) break;

      const fnResponses: any[] = [];
      let halted = false;

      for (const call of fc) {
        const tool = findTool(call.name);
        collectedToolCalls.push({ name: call.name, args: call.args });

        if (!tool) {
          fnResponses.push({
            functionResponse: { name: call.name, response: { error: "Unknown tool" } },
          });
          continue;
        }

        // Confirmation gate
        if (tool.requiresConfirmation?.(call.args)) {
          const { data: pend } = await admin.from("agent_pending_confirmations").insert({
            user_id: appUser.id,
            conversation_id: conversationId,
            tool_name: call.name,
            arguments: call.args,
            description: tool.describe?.(call.args) || tool.description,
            risk_level: tool.riskLevel?.(call.args) || "medium",
          }).select("*").single();
          if (pend) pendingConfirmations.push(pend);
          halted = true;
          continue;
        }

        const start = Date.now();
        let result: any, errStr: string | null = null;
        try {
          result = await tool.execute(call.args, toolCtx);
        } catch (e: any) {
          errStr = String(e?.message || e);
          result = { error: errStr };
        }
        const duration = Date.now() - start;

        await admin.from("agent_tool_executions").insert({
          conversation_id: conversationId,
          user_id: appUser.id,
          tool_name: call.name,
          arguments: call.args,
          result,
          error: errStr,
          required_confirmation: false,
          executed_at: new Date().toISOString(),
          duration_ms: duration,
        });

        await admin.from("agent_messages").insert({
          conversation_id: conversationId,
          role: "tool",
          tool_call_id: call.name,
          content: JSON.stringify(result),
        });

        fnResponses.push({
          functionResponse: { name: call.name, response: result },
        });
      }

      if (halted) break;
      if (!fnResponses.length) break;
      response = await chat.sendMessage(fnResponses);
    }

    // If confirmations are pending → return early
    if (pendingConfirmations.length) {
      // Persist assistant intent (text so far + tool_calls)
      const partialText = (() => {
        try { return response.response.text(); } catch { return ""; }
      })();
      await admin.from("agent_messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: partialText || null,
        tool_calls: collectedToolCalls,
        model: modelName,
      });
      await admin.from("agent_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
      return json({
        type: "confirmation_required",
        conversation_id: conversationId,
        content: partialText,
        pending: pendingConfirmations.map((p) => ({
          id: p.id,
          tool_name: p.tool_name,
          description: p.description,
          risk_level: p.risk_level,
          arguments: p.arguments,
          expires_at: p.expires_at,
        })),
      });
    }

    const finalText = (() => {
      try { return response.response.text(); } catch { return ""; }
    })();

    const { data: finalMsg } = await admin.from("agent_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: finalText,
      tool_calls: collectedToolCalls.length ? collectedToolCalls : null,
      model: modelName,
    }).select("id").single();

    await admin.from("agent_conversations").update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", conversationId);

    return json({
      type: "message",
      conversation_id: conversationId,
      content: finalText,
      message_id: finalMsg?.id,
      tool_calls: collectedToolCalls,
    });
  } catch (e: any) {
    console.error("ai-agent error", e);
    return json({ error: String(e?.message || e) }, 500);
  }
});
