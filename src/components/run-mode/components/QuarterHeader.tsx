
import React from 'react';
import { Button } from "@/components/ui/button";
import { X, Navigation } from 'lucide-react';

interface QuarterHeaderProps {
  quarterId: number;
  onNavigate: () => void;
  onRemove: () => void;
  canRemove: boolean;
}

export const QuarterHeader: React.FC<QuarterHeaderProps> = ({
  quarterId,
  onNavigate,
  onRemove,
  canRemove
}) => {
  return (
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-xs font-medium text-white">Τετάρτημόριο {quarterId}</h3>
      <div className="flex items-center space-x-1">
        <Button
          onClick={onNavigate}
          variant="ghost"
          size="sm"
          className="text-[#00ffba] hover:text-white hover:bg-[#00ffba]/20 p-1 h-6 w-6"
        >
          <Navigation className="h-3 w-3" />
        </Button>
        {canRemove && (
          <Button
            onClick={onRemove}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};
