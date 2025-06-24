
import React from 'react';
import { ChatHeader } from "./ChatHeader";
import { LoadingState } from "./LoadingState";
import { SubscriptionRequired } from "./SubscriptionRequired";
import { ChatContainer } from "./ChatContainer";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatContentProps {
  userName?: string;
  userPhotoUrl?: string;
  hasActiveSubscription: boolean;
  isMobile: boolean;
  isCheckingSubscription: boolean;
  isLoadingHistory: boolean;
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onClearConversation: () => void;
}

export const ChatContent: React.FC<ChatContentProps> = ({
  userName,
  userPhotoUrl,
  hasActiveSubscription,
  isMobile,
  isCheckingSubscription,
  isLoadingHistory,
  messages,
  isLoading,
  messagesEndRef,
  input,
  setInput,
  onSend,
  onKeyPress,
  onClearConversation
}) => {
  return (
    <>
      <ChatHeader
        userName={userName}
        hasActiveSubscription={hasActiveSubscription}
        onClearConversation={onClearConversation}
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
        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          userName={userName}
          userPhotoUrl={userPhotoUrl}
          isMobile={isMobile}
          messagesEndRef={messagesEndRef}
          input={input}
          setInput={setInput}
          hasActiveSubscription={hasActiveSubscription}
          onSend={onSend}
          onKeyPress={onKeyPress}
        />
      )}
    </>
  );
};
