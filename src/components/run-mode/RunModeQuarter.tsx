
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { ProgramCalendar } from '../active-programs/ProgramCalendar';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface RunModeQuarterProps {
  quarterId: number;
  programs: EnrichedAssignment[];
  onRemove: () => void;
  canRemove: boolean;
}

export const RunModeQuarter: React.FC<RunModeQuarterProps> = ({
  quarterId,
  programs,
  onRemove,
  canRemove
}) => {
  const handleRefresh = () => {
    // Refresh logic can be added here if needed
    console.log('Refreshing quarter calendar...');
  };

  return (
    <Card className="rounded-none border-2 border-gray-600 bg-gray-900/50 bg-opacity-80 backdrop-blur-sm h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-white">Τεταρτημόριο {quarterId}</h3>
          {canRemove && (
            <Button
              onClick={onRemove}
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-none p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {/* Calendar View - Using the same component from active-programs */}
        <div className="flex-1 overflow-hidden">
          <ProgramCalendar 
            programs={programs}
            onRefresh={handleRefresh}
          />
        </div>
      </CardContent>
    </Card>
  );
};
