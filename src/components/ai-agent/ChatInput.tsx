import { useState, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, loading, disabled }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    const t = value.trim();
    if (!t || loading || disabled) return;
    onSend(t);
    setValue("");
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex gap-2 items-end p-3 border-t border-border bg-background">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        placeholder="Γράψε ένα μήνυμα... (Enter να στείλεις, Shift+Enter νέα γραμμή)"
        className="rounded-none min-h-[60px] resize-none"
        disabled={disabled || loading}
      />
      <Button onClick={submit} disabled={disabled || loading || !value.trim()} className="rounded-none">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </Button>
    </div>
  );
}
