
import React from 'react';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface CalendarProgramItemProps {
  program: EnrichedAssignment;
  workoutStatus: string;
  onClick?: () => void;
}

export const CalendarProgramItem: React.FC<CalendarProgramItemProps> = ({
  program,
  workoutStatus,
  onClick
}) => {
  console.log('🎨 Setting colors for status:', workoutStatus);
  
  let statusColor = 'bg-blue-100 text-blue-800 border-blue-200'; // Default (scheduled)
  
  if (workoutStatus === 'completed') {
    statusColor = 'bg-green-100 text-green-800 border-green-200';
  } else if (workoutStatus === 'missed') {
    statusColor = 'bg-red-100 text-red-800 border-red-200';
  } else if (workoutStatus === 'makeup') {
    statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
  
  const statusText = workoutStatus === 'completed' ? 'Ολοκληρωμένη' : 
                   workoutStatus === 'missed' ? 'Χαμένη' : 
                   workoutStatus === 'makeup' ? 'Αναπλήρωση' : 'Προγραμματισμένη';
  
  return (
    <div
      className={`text-xs p-1 rounded-none truncate border cursor-pointer hover:opacity-80 transition-opacity ${statusColor}`}
      title={`${program.programs?.name || 'Άγνωστο πρόγραμμα'} - ${program.app_users?.name || 'Άγνωστος χρήστης'} - ${statusText}`}
      onClick={onClick}
    >
      <div className="font-medium">{program.programs?.name || 'Άγνωστο πρόγραμμα'}</div>
      <div className="text-gray-600">{program.app_users?.name || 'Άγνωστος χρήστης'}</div>
    </div>
  );
};
