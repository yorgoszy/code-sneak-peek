
import React from 'react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  userName?: string;
  userPhotoUrl?: string;
  isMobile: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  input: string;
  setInput: (value: string) => void;
  hasActiveSubscription: boolean;
  onSend: (files?: string[]) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  userId?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  userName,
  userPhotoUrl,
  isMobile,
  messagesEndRef,
  input,
  setInput,
  hasActiveSubscription,
  onSend,
  onKeyPress,
  userId
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        userName={userName}
        userPhotoUrl={userPhotoUrl}
        isMobile={isMobile}
        messagesEndRef={messagesEndRef}
      />

      <ChatInput
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        hasActiveSubscription={hasActiveSubscription}
        onSend={onSend}
        onKeyPress={onKeyPress}
        isMobile={isMobile}
        userId={userId}
      />
    </div>
  );
};
