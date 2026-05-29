import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AgentMode } from "@/hooks/ai/useAiAgent";

interface Props {
  value: AgentMode;
  onChange: (m: AgentMode) => void;
  isAdmin: boolean;
  isCoach: boolean;
}

export function ModeSelector({ value, onChange, isAdmin, isCoach }: Props) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AgentMode)}>
      <SelectTrigger className="rounded-none w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-none">
        {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
        {(isAdmin || isCoach) && <SelectItem value="coach">Coach</SelectItem>}
        <SelectItem value="athlete">Athlete</SelectItem>
        <SelectItem value="general">General</SelectItem>
      </SelectContent>
    </Select>
  );
}
