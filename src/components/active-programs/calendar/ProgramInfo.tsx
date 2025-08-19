
import React from 'react';
import { Badge } from "@/components/ui/badge";
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
    <div className="bg-white border border-gray-200 rounded-none p-2 md:p-3 mb-4">
      <div className="flex items-center justify-end gap-1 md:gap-2">
        {/* Status Badges Only - Smaller on mobile */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {isCompleted && (
            <Badge className="bg-green-100 text-green-800 border-green-200 rounded-none text-xs px-1 py-0.5 md:px-2.5 md:py-0.5">
              Ολοκ
            </Badge>
          )}
          
          {workoutInProgress && (
            <Badge className="bg-[#00ffba]/20 text-[#00ffba] border-[#00ffba]/30 rounded-none text-xs px-1 py-0.5 md:px-2.5 md:py-0.5">
              Εξέλ
            </Badge>
          )}
          
          <Badge variant="outline" className="rounded-none text-xs px-1 py-0.5 md:px-2.5 md:py-0.5">
            {program.status === 'active' ? 'active' : program.status}
          </Badge>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const parseRepsToTotal = (reps: string): number => {
  if (!reps) return 0;
  
  if (!reps.includes('.')) {
    return parseInt(reps) || 0;
  }
  
  const parts = reps.split('.');
  let totalReps = 0;
  
  parts.forEach(part => {
    totalReps += parseInt(part) || 0;
  });
  
  return totalReps;
};

const parseTempoToSeconds = (tempo: string): number => {
  if (!tempo || tempo.trim() === '') {
    return 3;
  }
  
  const parts = tempo.split('.');
  let totalSeconds = 0;
  
  parts.forEach(part => {
    if (part === 'x' || part === 'X') {
      totalSeconds += 0.5;
    } else {
      totalSeconds += parseFloat(part) || 0;
    }
  });
  
  return totalSeconds;
};

const parseRestTime = (rest: string): number => {
  if (!rest) return 0;
  
  if (rest.includes(':')) {
    const [minutes, seconds] = rest.split(':');
    return (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
  } else if (rest.includes("'")) {
    return (parseFloat(rest.replace("'", "")) || 0) * 60;
  } else if (rest.includes('s')) {
    return parseFloat(rest.replace('s', '')) || 0;
  } else {
    const minutes = parseFloat(rest) || 0;
    return minutes * 60;
  }
};

const parseNumberWithComma = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;
  
  const normalizedValue = value.toString().replace(',', '.');
  return parseFloat(normalizedValue) || 0;
};
