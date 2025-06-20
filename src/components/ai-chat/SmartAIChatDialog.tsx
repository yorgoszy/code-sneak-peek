
import React from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { useSmartAIChat } from "./hooks/useSmartAIChat";
import { DialogWrapper } from "./components/DialogWrapper";
import { ChatContent } from "./components/ChatContent";

interface SmartAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId?: string;
  athleteName?: string;
}

export const SmartAIChatDialog: React.FC<SmartAIChatDialogProps> = ({
  isOpen,
  onClose,
  athleteId,
  athleteName
}) => {
  const isMobile = useIsMobile();
  
  const {
    messages,
    input,
    setInput,
    isLoading,
    isLoadingHistory,
    hasActiveSubscription,
    isCheckingSubscription,
    messagesEndRef,
    sendMessage,
    handleKeyPress
  } = useSmartAIChat({ isOpen, athleteId, athleteName });

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose}>
      <ChatContent
        athleteName={athleteName}
        hasActiveSubscription={hasActiveSubscription}
        isMobile={isMobile}
        isCheckingSubscription={isCheckingSubscription}
        isLoadingHistory={isLoadingHistory}
        messages={messages}
        isLoading={isLoading}
        messagesEndRef={messagesEndRef}
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        onKeyPress={handleKeyPress}
      />
    </DialogWrapper>
  );
};
