import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Brain, User } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  aiType?: 'rid-smart';
}

interface MessageBubbleProps {
  message: Message;
  athleteName?: string;
  athletePhotoUrl?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  athleteName,
  athletePhotoUrl
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#00ffba] text-black flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`p-3 rounded-lg ${
            isUser
              ? 'bg-[#00ffba] text-black rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
        
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {format(message.timestamp, 'HH:mm')}
        </div>
      </div>
      
      {isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={athletePhotoUrl} />
          <AvatarFallback>
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};