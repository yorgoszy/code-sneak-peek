
import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface MinimizedProgramBubbleProps {
  program: EnrichedAssignment;
  selectedDate: Date;
  workoutStatus: string;
  onRestore: () => void;
  onClose: () => void;
}

export const MinimizedProgramBubble: React.FC<MinimizedProgramBubbleProps> = ({
  program,
  selectedDate,
  workoutStatus,
  onRestore,
  onClose
}) => {
  const getStatusColor = () => {
    if (workoutStatus === 'completed') return 'text-[#00ffba]';
    if (workoutStatus === 'in_progress') return 'text-blue-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (workoutStatus === 'completed') return 'Ολοκληρωμένη';
    if (workoutStatus === 'in_progress') return 'Σε εξέλιξη';
    return 'Προγραμματισμένη';
  };

  return (
    <div className="bg-white border border-gray-200 p-2 mb-2 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Avatar className="w-6 h-6">
            <AvatarImage src={program.app_users?.photo_url} alt={program.app_users?.name} />
            <AvatarFallback className="text-xs">
              {program.app_users?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {program.app_users?.name}
            </p>
            <p className={`text-xs ${getStatusColor()}`}>
              {format(selectedDate, 'dd/MM')} - {getStatusText()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            onClick={onRestore}
            variant="ghost"
            size="sm"
            className="text-[#00ffba] hover:text-white hover:bg-[#00ffba]/20 p-1 h-5 w-5"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-5 w-5"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
