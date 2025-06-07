
import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, Maximize2 } from "lucide-react";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface MinimizedWorkoutProps {
  assignment: EnrichedAssignment;
  onRestore: () => void;
  onCancel: () => void;
  elapsedTime?: number;
}

export const MinimizedWorkout: React.FC<MinimizedWorkoutProps> = ({
  assignment,
  onRestore,
  onCancel,
  elapsedTime = 0
}) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const userName = assignment.app_users?.name || 'Άγνωστος χρήστης';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="bg-[#00ffba] border border-[#00ffba] rounded-none p-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar className="w-8 h-8 rounded-none">
            <AvatarImage 
              src={assignment.app_users?.photo_url} 
              alt={userName}
              className="rounded-none"
            />
            <AvatarFallback className="rounded-none bg-gray-200 text-gray-800 text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-xs font-semibold text-black">{userName}</div>
            <div className="text-xs text-black opacity-80">Προπόνηση σε εξέλιξη</div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="text-xs font-mono text-black">
            {formatTime(elapsedTime)}
          </div>
          <Button
            onClick={onRestore}
            size="sm"
            variant="ghost"
            className="w-6 h-6 p-0 text-black hover:bg-black/10 rounded-none"
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
          <Button
            onClick={onCancel}
            size="sm"
            variant="ghost"
            className="w-6 h-6 p-0 text-black hover:bg-black/10 rounded-none"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
