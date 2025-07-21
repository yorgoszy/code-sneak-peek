
import { useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { useSubscriptionChecker } from './useSubscriptionChecker';
import { useConversationManager } from './useConversationManager';
import { useMessageSender } from './useMessageSender';
import type { UseSmartAIChatProps } from './types';

export const useSmartAIChat = ({ isOpen, userId, userName }: UseSmartAIChatProps) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { hasActiveSubscription, isCheckingSubscription } = useSubscriptionChecker({
    isOpen,
    userId
  });

  const { 
    messages, 
    isLoadingHistory, 
    clearConversation, 
    setMessages 
  } = useConversationManager({
    userId,
    userName,
    hasActiveSubscription
  });

  const { sendMessage: handleSendMessage, isLoading } = useMessageSender({
    userId,
    hasActiveSubscription,
    setMessages,
    checkSubscriptionStatus: async () => {
      // This would need to be implemented if we need to re-check subscription
      // For now, we'll rely on the subscription checker hook
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "end"
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const sendMessage = async (userMessage: string) => {
    await handleSendMessage(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasActiveSubscription) {
        sendMessage(input);
      } else {
        toast.error('Απαιτείται ενεργή συνδρομή για να χρησιμοποιήσεις το RID AI');
      }
    }
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    isLoadingHistory,
    hasActiveSubscription,
    isCheckingSubscription,
    messagesEndRef,
    sendMessage,
    clearConversation,
    handleKeyPress
  };
};
