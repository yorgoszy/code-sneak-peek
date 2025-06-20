
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
  isMobile: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  input: string;
  setInput: (value: string) => void;
  hasActiveSubscription: boolean;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  isMobile,
  messagesEndRef,
  input,
  setInput,
  hasActiveSubscription,
  onSend,
  onKeyPress
}) => {
  return (
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
        onSend={onSend}
        onKeyPress={onKeyPress}
        isMobile={isMobile}
      />
    </div>
  );
};
