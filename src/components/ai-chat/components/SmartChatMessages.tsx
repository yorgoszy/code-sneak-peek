
import React from 'react';
import { User, Brain, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface SmartChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  athleteId?: string;
  athleteName?: string;
}

export const SmartChatMessages: React.FC<SmartChatMessagesProps> = ({
  messages,
  isLoading,
  messagesEndRef,
  athleteId,
  athleteName
}) => {
  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex-1 border rounded-none overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4 min-h-full">
          {messages.length === 0 && !isLoading && (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="text-center text-gray-500">
                <Brain className="w-16 h-16 text-[#00ffba] mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Γεια σου! Είμαι ο RID AI 🤖</p>
                <p className="text-sm">Στείλε μου ένα μήνυμα για να ξεκινήσουμε!</p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {message.role === 'user' ? (
                  <Avatar className="w-10 h-10 rounded-none">
                    <AvatarFallback className="bg-blue-500 text-white rounded-none">
                      {getUserInitials(athleteName)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-10 h-10 rounded-none bg-[#00ffba] text-black flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                )}
                
                <div className={`p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-50 text-gray-900 rounded-bl-none border'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2">
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
              <div className="w-10 h-10 rounded-none bg-[#00ffba] text-black flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div className="bg-gray-50 text-gray-900 p-4 rounded-lg rounded-bl-none border">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#00ffba]" />
                  <span className="text-sm">Αναλύω τα δεδομένα σου...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};
