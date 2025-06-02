
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProgramInfoProps {
  program: any;
  dayProgram: any;
  workoutInProgress: boolean;
  workoutStatus: string;
}

export const ProgramInfo: React.FC<ProgramInfoProps> = ({
  program,
  dayProgram,
  workoutInProgress,
  workoutStatus
}) => {
  const userName = program.app_users?.name || 'Άγνωστος χρήστης';
  
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-none p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {program.programs?.name}
          </h3>
          {program.programs?.description && (
            <p className="text-xs text-gray-600 mt-0.5">
              {program.programs.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-600 text-right">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">Αθλητής:</span> 
              <span>{userName}</span>
            </div>
            {dayProgram?.estimated_duration_minutes && (
              <div><span className="font-medium">Διάρκεια:</span> {dayProgram.estimated_duration_minutes} λεπτά</div>
            )}
          </div>
          <Avatar className="w-12 h-12">
            <AvatarImage 
              src={program.app_users?.photo_url} 
              alt={userName}
            />
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {getUserInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      {workoutInProgress && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-none">
          <p className="text-xs text-green-700">
            🏋️‍♂️ Προπόνηση σε εξέλιξη! Κάνε κλικ στα Sets για να ολοκληρώνεις τα sets.
          </p>
        </div>
      )}
    </div>
  );
};
