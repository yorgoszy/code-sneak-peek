
import React from 'react';
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface RunModeMinimizedProps {
  onMinimize: () => void;
  onClose: () => void;
}

export const RunModeMinimized: React.FC<RunModeMinimizedProps> = ({
  onMinimize,
  onClose
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-black text-white p-4 rounded-none shadow-lg min-w-[200px]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Run Mode</h3>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMinimize}
              className="h-6 w-6 p-0 text-white hover:bg-[#00ffba] hover:text-black rounded-none"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-white hover:bg-[#00ffba] hover:text-black rounded-none"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-300">Ελαχιστοποιημένο</p>
      </div>
    </div>
  );
};
