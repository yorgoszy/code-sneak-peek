
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Navigation } from 'lucide-react';
import { ProgramCalendar } from '../active-programs/ProgramCalendar';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const handleRefresh = () => {
    console.log('Refreshing quarter calendar...');
  };

  const handleNavigate = () => {
    navigate('/dashboard');
  };

  return (
    <Card className="rounded-none border-2 border-gray-600 bg-gray-900/50 bg-opacity-80 backdrop-blur-sm h-full flex flex-col relative">
      <CardHeader className="pb-1 flex-shrink-0 p-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-medium text-white">Τετάρτημόριο {quarterId}</h3>
          <div className="flex items-center space-x-1">
            <Button
              onClick={handleNavigate}
              variant="ghost"
              size="sm"
              className="text-[#00ffba] hover:text-white hover:bg-[#00ffba]/20 rounded-none p-1 h-6 w-6"
            >
              <Navigation className="h-3 w-3" />
            </Button>
            {canRemove && (
              <Button
                onClick={onRemove}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-none p-1 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-1 relative">
        <div className="h-full w-full">
          <ProgramCalendar 
            programs={programs}
            onRefresh={handleRefresh}
            isCompactMode={true}
            containerId={`quarter-${quarterId}`}
          />
        </div>
      </CardContent>
    </Card>
  );
};
