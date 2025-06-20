
import React from 'react';
import { CustomLoading } from "@/components/ui/custom-loading";

interface LoadingStateProps {
  message: string;
  isMobile: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message, isMobile }) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-2 text-gray-600">
        <CustomLoading size={isMobile ? 'sm' : 'md'} />
        <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>{message}</span>
      </div>
    </div>
  );
};
