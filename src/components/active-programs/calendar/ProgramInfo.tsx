
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const userName = program.app_users?.name || 'Άγνωστος Αθλητής';
  
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate day metrics for compact display
  const calculateCompactMetrics = () => {
    if (!dayProgram?.program_blocks) return { volume: 0, intensity: 0, watts: 0, time: 0 };

    let totalVolume = 0;
    let totalIntensitySum = 0;
    let intensityCount = 0;
    let totalWatts = 0;
    let totalTimeSeconds = 0;

    dayProgram.program_blocks.forEach((block: any) => {
      block.program_exercises?.forEach((exercise: any) => {
        if (exercise.exercise_id) {
          const sets = exercise.sets || 0;
          const reps = parseRepsToTotal(exercise.reps);
          const kg = parseNumberWithComma(exercise.kg || '0');

          // Volume calculation
          const volumeKg = sets * reps * kg;
          totalVolume += volumeKg;

          // Intensity calculation
          const intensity = parseNumberWithComma(exercise.percentage_1rm || '0');
          if (intensity > 0) {
            totalIntensitySum += intensity;
            intensityCount++;
          }

          // Watts calculation
          const velocity = parseNumberWithComma(exercise.velocity_ms || '0');
          if (kg > 0 && velocity > 0) {
            const force = kg * 9.81;
            const watts = force * velocity;
            totalWatts += watts * sets * reps;
          }

          // Time calculation
          const tempoSeconds = parseTempoToSeconds(exercise.tempo || '');
          const restSeconds = parseRestTime(exercise.rest || '');
          const workTime = sets * reps * tempoSeconds;
          const totalRestTime = (sets - 1) * restSeconds;
          totalTimeSeconds += workTime + totalRestTime;
        }
      });
    });

    return {
      volume: Math.round(totalVolume / 1000), // Convert to tons
      intensity: intensityCount > 0 ? Math.round(totalIntensitySum / intensityCount) : 0,
      watts: Math.round(totalWatts / 1000), // Convert to kilowatts
      time: Math.round(totalTimeSeconds / 60), // Convert to minutes
    };
  };

  const { volume, intensity, watts, time } = calculateCompactMetrics();

  return (
    <div className="bg-white border border-gray-200 rounded-none p-2 md:p-3 mb-4">
      <div className="flex items-center justify-between gap-1 md:gap-3">
        {/* Avatar and User Info - Smaller on mobile */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 min-w-0">
          <Avatar className="w-6 h-6 md:w-8 md:h-8">
            <AvatarImage 
              src={program.app_users?.photo_url} 
              alt={userName}
            />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
              {getUserInitials(userName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="min-w-0 flex-shrink">
            <div className="text-xs md:text-sm font-medium text-gray-900 truncate">
              {userName}
            </div>
            <div className="text-xs md:text-xs text-gray-600 truncate">
              {program.programs?.name || 'Άγνωστο Πρόγραμμα'}
            </div>
          </div>
        </div>

        {/* Compact Stats - Much smaller on mobile */}
        <div className="flex items-center gap-1 md:gap-4 text-xs">
          <div className="text-center min-w-0">
            <div className="text-gray-600 text-xs md:text-xs">Όγκος</div>
            <div className="font-semibold text-blue-700 text-xs md:text-sm">{volume.toLocaleString()}tn</div>
          </div>
          
          <div className="text-center min-w-0">
            <div className="text-gray-600 text-xs md:text-xs">Ένταση</div>
            <div className="font-semibold text-green-700 text-xs md:text-sm">{intensity}%</div>
          </div>
          
          <div className="text-center min-w-0">
            <div className="text-gray-600 text-xs md:text-xs">Ισχύς</div>
            <div className="font-semibold text-orange-700 text-xs md:text-sm">{watts}KW</div>
          </div>
          
          <div className="text-center min-w-0">
            <div className="text-gray-600 text-xs md:text-xs">Χρόνος</div>
            <div className="font-semibold text-red-700 text-xs md:text-sm">{time}λ</div>
          </div>
        </div>

        {/* Status Badges - Smaller on mobile */}
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
