
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";

interface SmartChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  isInitializing: boolean;
}

export const SmartChatInput: React.FC<SmartChatInputProps> = ({
  input,
  setInput,
  onSend,
  onKeyPress,
  isLoading,
  isInitializing
}) => {
  return (
    <div className="flex gap-2 p-4 border-t">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder="Γράψε εδώ το μήνυμά σου..."
        className="rounded-none"
        disabled={isLoading || isInitializing}
      />
      <Button
        onClick={onSend}
        disabled={!input.trim() || isLoading || isInitializing}
        className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black px-6"
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
