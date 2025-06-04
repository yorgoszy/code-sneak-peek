
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Dumbbell } from 'lucide-react';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface QuarterProgramViewProps {
  program: EnrichedAssignment;
  status: 'idle' | 'running' | 'completed';
  todayString: string;
}

export const QuarterProgramView: React.FC<QuarterProgramViewProps> = ({
  program,
  status,
  todayString
}) => {
  const programData = program.programs;
  if (!programData) return null;

  // Βρίσκουμε το πρόγραμμα της σημερινής ημέρας
  // Για απλοποίηση, παίρνουμε την πρώτη ημέρα από την πρώτη εβδομάδα
  const todayDay = programData.program_weeks
    .flatMap(week => week.program_days)
    .find(day => {
      // Μπορούμε να βελτιώσουμε αυτή τη λογική αργότερα
      // για να βρίσκουμε την ακριβή ημέρα βάσει του προγράμματος
      return day;
    });

  if (!todayDay) return null;

  const totalDuration = todayDay.estimated_duration_minutes || 0;

  return (
    <div className="space-y-3 text-sm">
      {/* Program Info */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <User className="h-3 w-3 text-gray-400" />
          <span className="text-gray-300">{program.app_users?.name}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dumbbell className="h-3 w-3 text-gray-400" />
          <span className="text-white font-medium">{programData.name}</span>
        </div>
        
        {totalDuration > 0 && (
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-gray-300">{totalDuration} λεπτά</span>
          </div>
        )}
      </div>

      {/* Day Name */}
      <div className="border-t border-gray-600 pt-2">
        <h4 className="text-white font-medium mb-2">{todayDay.name}</h4>
        
        {/* Exercise Blocks */}
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {todayDay.program_blocks.map((block, blockIndex) => (
            <div key={blockIndex} className="space-y-1">
              <div className="text-xs text-[#00ffba] font-medium">
                {block.name}
              </div>
              
              <div className="space-y-1 pl-2">
                {block.program_exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="flex justify-between items-center text-xs">
                    <span className="text-gray-300 truncate flex-1">
                      {exercise.exercises?.name || 'Άσκηση'}
                    </span>
                    <div className="flex space-x-1 text-gray-400">
                      <span>{exercise.sets}x{exercise.reps}</span>
                      {exercise.kg && <span>{exercise.kg}kg</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Badge */}
      <div className="border-t border-gray-600 pt-2">
        <Badge 
          variant="outline" 
          className={`rounded-none text-xs ${
            status === 'running' ? 'border-yellow-500 text-yellow-500' :
            status === 'completed' ? 'border-[#00ffba] text-[#00ffba]' :
            'border-gray-500 text-gray-400'
          }`}
        >
          {status === 'running' ? 'Εν εξελίξει' :
           status === 'completed' ? 'Ολοκληρώθηκε' :
           'Σε αναμονή'}
        </Badge>
      </div>
    </div>
  );
};
