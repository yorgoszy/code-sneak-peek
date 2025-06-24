
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Database, Loader2 } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface LocalChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  renderMessageContent: (content: string, role: string) => React.ReactNode;
}

export const LocalChatMessages: React.FC<LocalChatMessagesProps> = ({
  messages,
  isLoading,
  scrollAreaRef,
  renderMessageContent
}) => {
  return (
    <ScrollArea className="flex-1 p-4 border rounded-none" ref={scrollAreaRef}>
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-[#00ffba] text-black'
              }`}>
                {message.role === 'user' ? <User className="w-4 h-4" /> : <Database className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
              }`}>
                {renderMessageContent(message.content, message.role)}
                <p className="text-xs opacity-70 mt-1">
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
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#00ffba] text-black flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div className="bg-gray-100 text-gray-900 p-3 rounded-lg rounded-bl-none">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Αναλύω τα δεδομένα σας και σκέφτομαι...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
