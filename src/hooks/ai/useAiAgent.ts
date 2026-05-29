import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AgentMode = "admin" | "coach" | "athlete" | "general";

export interface AgentMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string | null;
  tool_calls: any;
  tool_call_id: string | null;
  model: string | null;
  created_at: string;
}

export interface AgentConversation {
  id: string;
  user_id: string;
  mode: AgentMode;
  title: string | null;
  last_message_at: string | null;
  created_at: string;
  archived: boolean;
}

export interface AgentPending {
  id: string;
  tool_name: string;
  description: string;
  risk_level: "low" | "medium" | "high" | "critical";
  arguments: any;
  expires_at: string;
}

export function useAgentConversations() {
  return useQuery({
    queryKey: ["agent-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_conversations" as any)
        .select("*")
        .eq("archived", false)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as AgentConversation[];
    },
  });
}

export function useAgentMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["agent-messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_messages" as any)
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as AgentMessage[];
    },
  });
}

interface SendArgs {
  conversation_id?: string | null;
  mode: AgentMode;
  message?: string;
  confirm_pending_id?: string;
}

export interface SendResult {
  type: "message" | "confirmation_required";
  conversation_id: string;
  content?: string;
  pending?: AgentPending[];
}

export function useSendAgentMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: SendArgs): Promise<SendResult> => {
      const { data, error } = await supabase.functions.invoke("ai-agent", {
        body: args,
      });
      if (error) throw error;
      return data as SendResult;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["agent-messages", res.conversation_id] });
      qc.invalidateQueries({ queryKey: ["agent-conversations"] });
    },
  });
}

export async function createConversation(mode: AgentMode, userId: string, title?: string) {
  const { data, error } = await supabase
    .from("agent_conversations" as any)
    .insert({ user_id: userId, mode, title: title || null })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as AgentConversation;
}

export async function rejectConfirmation(pendingId: string) {
  const { error } = await supabase
    .from("agent_pending_confirmations" as any)
    .update({ resolved: true, resolution: "rejected", resolved_at: new Date().toISOString() })
    .eq("id", pendingId);
  if (error) throw error;
}

export async function deleteConversation(id: string) {
  const { error } = await supabase.from("agent_conversations" as any).delete().eq("id", id);
  if (error) throw error;
}
