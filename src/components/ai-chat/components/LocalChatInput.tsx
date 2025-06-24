
import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface LocalChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  userId?: string;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export const LocalChatInput: React.FC<LocalChatInputProps> = ({
  input,
  setInput,
  isLoading,
  userId,
  onSend,
  onKeyPress
}) => {
  return (
    <div className="flex gap-2 p-4 border-t">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={userId ? "Πληκτρολογήστε το μήνυμά σας..." : "Παρακαλώ επιλέξτε χρήστη πρώτα..."}
        className="rounded-none min-h-[80px] max-h-[120px] resize-none"
        disabled={isLoading || !userId}
        rows={3}
      />
      <Button
        onClick={onSend}
        disabled={!input.trim() || isLoading || !userId}
        className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black self-end"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};
