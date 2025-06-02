
import React from 'react';

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
  return (
    <div className="bg-white border border-gray-200 rounded-none p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {program.programs?.name}
          </h3>
          {program.programs?.description && (
            <p className="text-sm text-gray-600 mt-1">
              {program.programs.description}
            </p>
          )}
        </div>
        <div className="text-sm text-gray-600">
          <div><span className="font-medium">Αθλητής:</span> {program.app_users?.name}</div>
          {dayProgram?.estimated_duration_minutes && (
            <div><span className="font-medium">Διάρκεια:</span> {dayProgram.estimated_duration_minutes} λεπτά</div>
          )}
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
