import { Button } from "@/components/ui/button";
import { Trash2, MessageSquare, Plus } from "lucide-react";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import type { AgentConversation } from "@/hooks/ai/useAiAgent";

interface Props {
  conversations: AgentConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

function groupKey(d: Date | null): string {
  if (!d) return "Παλαιότερα";
  if (isToday(d)) return "Σήμερα";
  if (isYesterday(d)) return "Εχθές";
  if (isThisWeek(d)) return "Αυτή την εβδομάδα";
  return "Παλαιότερα";
}

export function ConversationList({ conversations, activeId, onSelect, onDelete, onNew }: Props) {
  const groups = new Map<string, AgentConversation[]>();
  for (const c of conversations) {
    const d = c.last_message_at ? new Date(c.last_message_at) : new Date(c.created_at);
    const k = groupKey(d);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(c);
  }

  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="p-3 border-b border-border">
        <Button onClick={onNew} className="w-full rounded-none">
          <Plus className="w-4 h-4 mr-2" /> Νέα συνομιλία
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {[...groups.entries()].map(([label, items]) => (
          <div key={label}>
            <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
            {items.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted ${
                  activeId === c.id ? "bg-muted" : ""
                }`}
                onClick={() => onSelect(c.id)}
              >
                <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{c.title || "Χωρίς τίτλο"}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{c.mode}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ))}
        {!conversations.length && (
          <div className="p-4 text-sm text-muted-foreground">Καμία συνομιλία ακόμα.</div>
        )}
      </div>
    </div>
  );
}
