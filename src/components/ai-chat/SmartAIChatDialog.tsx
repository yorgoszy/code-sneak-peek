
import React, { useState, useRef, useEffect } from 'react';
import { useSmartAIChat } from './hooks/useSmartAIChat';
import { DialogWrapper } from './components/DialogWrapper';
import { ChatContent } from './components/ChatContent';
import { toast } from "sonner";

interface SmartAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
  userPhotoUrl?: string;
}

export const SmartAIChatDialog: React.FC<SmartAIChatDialogProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userPhotoUrl
}) => {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    isLoadingHistory,
    hasActiveSubscription,
    isCheckingSubscription,
    sendMessage,
    clearConversation
  } = useSmartAIChat({ userId, userName, isOpen });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    // Αυστηρός έλεγχος συνδρομής
    if (!hasActiveSubscription) {
      console.log('❌ SmartAIChatDialog: No active subscription - blocking message');
      toast.error('Απαιτείται ενεργή συνδρομή για να χρησιμοποιήσεις το RID AI');
      return;
    }

    const userInput = input;
    setInput('');
    await sendMessage(userInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasActiveSubscription) {
        handleSendMessage();
      } else {
        console.log('❌ SmartAIChatDialog: Key press blocked - no active subscription');
        toast.error('Απαιτείται ενεργή συνδρομή για να χρησιμοποιήσεις το RID AI');
      }
    }
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onClose}
      className={isCheckingSubscription || !hasActiveSubscription ? "max-w-md rounded-none" : "max-w-2xl max-h-[80vh] rounded-none flex flex-col"}
    >
      <ChatContent
        userName={userName}
        userPhotoUrl={userPhotoUrl}
        hasActiveSubscription={hasActiveSubscription}
        isMobile={false}
        isCheckingSubscription={isCheckingSubscription}
        isLoadingHistory={isLoadingHistory}
        messages={messages}
        isLoading={isLoading}
        messagesEndRef={scrollAreaRef}
        input={input}
        setInput={setInput}
        onSend={handleSendMessage}
        onKeyPress={handleKeyPress}
        onClearConversation={clearConversation}
      />
    </DialogWrapper>
  );
};
