
import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSmartAIChat } from "./hooks/useSmartAIChat";
import { ChatHeader } from "./components/ChatHeader";
import { LoadingState } from "./components/LoadingState";
import { SubscriptionRequired } from "./components/SubscriptionRequired";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] w-[95vw] h-[90vh] m-2' : 'max-w-4xl h-[80vh]'} rounded-none p-0 flex flex-col`}>
        <ChatHeader
          athleteName={athleteName}
          hasActiveSubscription={hasActiveSubscription}
          isMobile={isMobile}
        />

        {isCheckingSubscription ? (
          <LoadingState 
            message="Ελέγχω τη συνδρομή σου..." 
            isMobile={isMobile}
          />
        ) : !hasActiveSubscription ? (
          <SubscriptionRequired isMobile={isMobile} />
        ) : isLoadingHistory ? (
          <LoadingState 
            message="Φορτώνω το ιστορικό συνομιλίας..." 
            isMobile={isMobile}
          />
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              isMobile={isMobile}
              messagesEndRef={messagesEndRef}
            />

            <ChatInput
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              hasActiveSubscription={hasActiveSubscription}
              onSend={sendMessage}
              onKeyPress={handleKeyPress}
              isMobile={isMobile}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
