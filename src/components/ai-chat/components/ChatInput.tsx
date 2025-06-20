
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  hasActiveSubscription: boolean;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isMobile: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  isLoading,
  hasActiveSubscription,
  onSend,
  onKeyPress,
  isMobile
}) => {
  return (
    <div className={`flex gap-2 ${isMobile ? 'p-3' : 'p-4'} border-t`}>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder="Πληκτρολογήστε το μήνυμά σας στον RID..."
        className={`rounded-none ${isMobile ? 'text-sm' : ''}`}
        disabled={isLoading || !hasActiveSubscription}
      />
      <Button
        onClick={onSend}
        disabled={!input.trim() || isLoading || !hasActiveSubscription}
        className={`rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black ${isMobile ? 'px-3' : 'px-4'}`}
      >
        {isLoading ? (
          <Loader2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
        ) : (
          <Send className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
        )}
      </Button>
    </div>
  );
};
