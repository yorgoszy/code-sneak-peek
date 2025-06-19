
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Clock, User, Calendar } from 'lucide-react';
import { DayCalculations } from './DayCalculations';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramInfoProps {
  program: EnrichedAssignment;
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
  const isCompleted = workoutStatus === 'completed';

  return (
    <div className="bg-white border border-gray-200 rounded-none p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">
              {program.app_users?.name || 'Άγνωστος Αθλητής'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {program.programs?.name || 'Άγνωστο Πρόγραμμα'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isCompleted && (
            <Badge className="bg-green-100 text-green-800 border-green-200 rounded-none">
              Ολοκληρωμένη
            </Badge>
          )}
          
          {workoutInProgress && (
            <Badge className="bg-[#00ffba]/20 text-[#00ffba] border-[#00ffba]/30 rounded-none">
              Σε εξέλιξη
            </Badge>
          )}
          
          <Badge variant="outline" className="rounded-none">
            {program.status}
          </Badge>
        </div>
      </div>

      {program.programs?.description && (
        <p className="text-sm text-gray-600 mb-3">
          {program.programs.description}
        </p>
      )}

      {/* Εμφάνιση υπολογισμών ημέρας */}
      {dayProgram?.program_blocks && (
        <DayCalculations blocks={dayProgram.program_blocks} />
      )}
    </div>
  );
};
