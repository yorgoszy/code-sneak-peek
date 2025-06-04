
import React from 'react';
import { Button } from "@/components/ui/button";
import { X, Minimize2, Plus } from "lucide-react";

interface RunModeHeaderProps {
  onAddQuadrant: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export const RunModeHeader: React.FC<RunModeHeaderProps> = ({
  onAddQuadrant,
  onMinimize,
  onClose
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-700">
      <h1 className="text-xl font-bold">Run Mode</h1>
      <div className="flex space-x-2">
        <Button
          onClick={onAddQuadrant}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-[#00ffba] hover:text-black rounded-none"
        >
          <Plus className="h-4 w-4 mr-2" />
          Προσθήκη Τεταρτημορίου
        </Button>
        <Button
          onClick={onMinimize}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-[#00ffba] hover:text-black rounded-none"
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-[#00ffba] hover:text-black rounded-none"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
