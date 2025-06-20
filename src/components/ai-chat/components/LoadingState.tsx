
import React from 'react';
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message: string;
  isMobile: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message, isMobile }) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
        <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>{message}</span>
      </div>
    </div>
  );
};
