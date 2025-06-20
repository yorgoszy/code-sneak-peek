
import React from 'react';
import { User, Brain, Loader2 } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isMobile: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  isMobile,
  messagesEndRef
}) => {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className={`space-y-3 ${isMobile ? 'p-3' : 'p-4'}`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 ${isMobile ? 'max-w-[90%]' : 'max-w-[85%]'} ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-[#00ffba] text-black'
              }`}>
                {message.role === 'user' ? 
                  <User className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} /> : 
                  <Brain className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                }
              </div>
              <div className={`${isMobile ? 'p-3' : 'p-4'} rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
              }`}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} whitespace-pre-wrap leading-relaxed`}>{message.content}</p>
                <p className={`${isMobile ? 'text-xs' : 'text-xs'} opacity-70 mt-2`}>
                  {message.timestamp.toLocaleTimeString('el-GR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-[#00ffba] text-black flex items-center justify-center`}>
              <Brain className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </div>
            <div className={`bg-gray-100 text-gray-900 ${isMobile ? 'p-3' : 'p-4'} rounded-lg rounded-bl-none`}>
              <div className="flex items-center gap-2">
                <Loader2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
                <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Ο RID αναλύει τα δεδομένα σου και σκέφτεται...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
