
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot, Loader2 } from "lucide-react";

interface LoadingStateProps {
  message: string;
  isMobile?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message, isMobile = false }) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#00ffba]" />
          RID AI Προπονητής
        </DialogTitle>
      </DialogHeader>
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Έλεγχος Συνδρομής</h3>
        <p className="text-gray-600">{message}</p>
      </div>
    </>
  );
};
