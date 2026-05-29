import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import type { AgentPending } from "@/hooks/ai/useAiAgent";

const RISK_COLORS: Record<string, string> = {
  low: "bg-muted text-foreground",
  medium: "bg-yellow-200 text-yellow-900",
  high: "bg-orange-200 text-orange-900",
  critical: "bg-destructive text-destructive-foreground",
};

interface Props {
  pending: AgentPending | null;
  onApprove: (p: AgentPending) => void;
  onReject: (p: AgentPending) => void;
}

export function ConfirmationDialog({ pending, onApprove, onReject }: Props) {
  const [remaining, setRemaining] = useState(300);

  useEffect(() => {
    if (!pending) return;
    const expiresAt = new Date(pending.expires_at).getTime();
    const tick = () => setRemaining(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pending]);

  if (!pending) return null;

  const isHigh = pending.risk_level === "high" || pending.risk_level === "critical";

  return (
    <AlertDialog open={!!pending}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Επιβεβαίωση ενέργειας
            <Badge className={`rounded-none ${RISK_COLORS[pending.risk_level]}`}>
              {pending.risk_level}
            </Badge>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <div>{pending.description}</div>
            <pre className="text-xs bg-muted p-2 rounded-none overflow-x-auto">
              {JSON.stringify(pending.arguments, null, 2)}
            </pre>
            <div className="text-xs text-muted-foreground">
              Λήγει σε {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-none" onClick={() => onReject(pending)}>
            Απόρριψη
          </AlertDialogCancel>
          <AlertDialogAction
            className={`rounded-none ${isHigh ? "bg-destructive hover:bg-destructive/90" : ""}`}
            onClick={() => onApprove(pending)}
          >
            Έγκριση
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
