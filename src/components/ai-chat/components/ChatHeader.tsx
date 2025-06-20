
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Brain, Zap } from "lucide-react";

interface ChatHeaderProps {
  athleteName?: string;
  hasActiveSubscription: boolean;
  isMobile: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  athleteName,
  hasActiveSubscription,
  isMobile
}) => {
  return (
    <DialogHeader className={`${isMobile ? 'p-3 pb-0' : 'p-6 pb-0'}`}>
      <DialogTitle className={`flex ${isMobile ? 'flex-col gap-1' : 'items-center gap-3'}`}>
        <div className="flex items-center gap-2">
          <Brain className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-[#00ffba]`} />
          <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold`}>RID - Έξυπνος AI Προπονητής</span>
        </div>
        {athleteName && (
          <span className={`${isMobile ? 'text-xs' : 'text-base'} font-normal text-gray-600`}>
            για {athleteName}
          </span>
        )}
        <div className={`flex ${isMobile ? 'flex-col gap-1' : 'items-center gap-2'}`}>
          <div className={`flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-xs'} bg-blue-100 text-blue-800 px-2 py-1 rounded-none`}>
            <Zap className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} />
            <span>Powered by OpenAI</span>
          </div>
          {hasActiveSubscription && (
            <div className={`flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-xs'} bg-green-100 text-green-800 px-2 py-1 rounded-none`}>
              <Brain className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} />
              <span>Ενεργή Συνδρομή</span>
            </div>
          )}
        </div>
      </DialogTitle>
    </DialogHeader>
  );
};
