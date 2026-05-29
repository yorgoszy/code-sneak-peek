import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { DisabledModuleNotice } from "@/components/ams/DisabledModuleNotice";
import {
  useAgentConversations,
  useAgentMessages,
  useSendAgentMessage,
  createConversation,
  rejectConfirmation,
  deleteConversation,
  type AgentMode,
  type AgentPending,
} from "@/hooks/ai/useAiAgent";
import { ConversationList } from "@/components/ai-agent/ConversationList";
import { MessageBubble } from "@/components/ai-agent/MessageBubble";
import { ChatInput } from "@/components/ai-agent/ChatInput";
import { ModeSelector } from "@/components/ai-agent/ModeSelector";
import { ConfirmationDialog } from "@/components/ai-agent/ConfirmationDialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MODE_BADGE: Record<AgentMode, string> = {
  admin: "bg-destructive text-destructive-foreground",
  coach: "bg-blue-600 text-white",
  athlete: "bg-emerald-600 text-white",
  general: "bg-muted text-foreground",
};

export default function AiAgentPage() {
  const { enabled, loading: flagLoading } = useFeatureFlag("ai_agent_unified");
  const { isAdmin, hasRole, user } = useAuthContext();

  const adminFlag = isAdmin();
  const coachFlag = hasRole("coach");

  const defaultMode: AgentMode = adminFlag ? "admin" : coachFlag ? "coach" : "athlete";
  const [mode, setMode] = useState<AgentMode>(defaultMode);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<AgentPending | null>(null);
  const [appUserId, setAppUserId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const qc = useQueryClient();
  const { data: conversations = [] } = useAgentConversations();
  const { data: messages = [] } = useAgentMessages(activeId);
  const send = useSendAgentMessage();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch app user id
  useEffect(() => {
    if (!user?.id) return;
    supabase.from("app_users").select("id").eq("auth_user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setAppUserId(data.id);
    });
  }, [user?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const handleNew = async () => {
    if (!appUserId) return;
    try {
      const conv = await createConversation(mode, appUserId);
      await qc.invalidateQueries({ queryKey: ["agent-conversations"] });
      setActiveId(conv.id);
    } catch (e: any) {
      toast.error(e?.message || "Σφάλμα");
    }
  };

  const handleSend = async (text: string) => {
    try {
      const res = await send.mutateAsync({
        conversation_id: activeId,
        mode,
        message: text,
      });
      setActiveId(res.conversation_id);
      if (res.type === "confirmation_required" && res.pending?.length) {
        setPending(res.pending[0]);
      }
    } catch (e: any) {
      toast.error(e?.message || "Σφάλμα");
    }
  };

  const handleApprove = async (p: AgentPending) => {
    setPending(null);
    try {
      const res = await send.mutateAsync({
        conversation_id: activeId,
        mode,
        confirm_pending_id: p.id,
      });
      if (res.type === "confirmation_required" && res.pending?.length) setPending(res.pending[0]);
    } catch (e: any) {
      toast.error(e?.message || "Σφάλμα");
    }
  };

  const handleReject = async (p: AgentPending) => {
    setPending(null);
    try {
      await rejectConfirmation(p.id);
      toast.success("Η ενέργεια απορρίφθηκε");
    } catch (e: any) {
      toast.error(e?.message || "Σφάλμα");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Διαγραφή συνομιλίας;")) return;
    await deleteConversation(id);
    if (activeId === id) setActiveId(null);
    qc.invalidateQueries({ queryKey: ["agent-conversations"] });
  };

  if (flagLoading) return <div className="p-6 text-muted-foreground">Φόρτωση...</div>;
  if (!enabled) return <DisabledModuleNotice flag="ai_agent_unified" />;

  const sidebar = (
    <ConversationList
      conversations={conversations}
      activeId={activeId}
      onSelect={(id) => {
        setActiveId(id);
        setMobileOpen(false);
      }}
      onDelete={handleDelete}
      onNew={handleNew}
    />
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-72 shrink-0">{sidebar}</div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 h-full bg-background">{sidebar}</div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background border-b border-border p-3 flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-none lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Sparkles className="w-5 h-5" />
          <h1 className="text-lg font-semibold">AI Agent</h1>
          <Badge className={`rounded-none ${MODE_BADGE[mode]}`}>{mode.toUpperCase()}</Badge>
          <div className="ml-auto">
            <ModeSelector value={mode} onChange={setMode} isAdmin={adminFlag} isCoach={coachFlag} />
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {!activeId && (
            <div className="text-center text-muted-foreground py-10">
              Ξεκίνα νέα συνομιλία ή στείλε το πρώτο σου μήνυμα.
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {send.isPending && (
            <div className="text-sm text-muted-foreground italic">Σκέφτομαι...</div>
          )}
        </div>

        <ChatInput onSend={handleSend} loading={send.isPending} />
      </div>

      <ConfirmationDialog pending={pending} onApprove={handleApprove} onReject={handleReject} />
    </div>
  );
}
