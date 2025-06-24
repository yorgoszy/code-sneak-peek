
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot, Zap } from "lucide-react";
import { toast } from "sonner";

interface ChatHeaderProps {
  userName?: string;
  hasActiveSubscription: boolean;
  onClearConversation: () => void;
  isMobile?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  userName,
  hasActiveSubscription,
  onClearConversation,
  isMobile = false
}) => {
  const handleClearConversation = () => {
    if (!hasActiveSubscription) {
      toast.error('Απαιτείται ενεργή συνδρομή για αυτή την ενέργεια');
      return;
    }
    onClearConversation();
    toast.success("Η συνομιλία διαγράφηκε επιτυχώς!");
  };

  return (
    <DialogHeader>
      <DialogTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#00ffba]" />
          RID AI Προπονητής
          {userName && (
            <span className="text-sm font-normal text-gray-600">
              για {userName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-none">
            <Zap className="w-3 h-3" />
            Powered by HyperTeam
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearConversation}
            className="text-xs rounded-none"
            disabled={!hasActiveSubscription}
          >
            Καθαρισμός
          </Button>
        </div>
      </DialogTitle>
    </DialogHeader>
  );
};
