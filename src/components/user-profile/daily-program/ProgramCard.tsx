
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Dumbbell } from 'lucide-react';
import { ExerciseBlock } from './ExerciseBlock';
import type { TodaysProgramAssignment } from './types';

interface ProgramCardProps {
  assignment: TodaysProgramAssignment;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ assignment }) => {
  const program = assignment.programs;
  if (!program) return null;

  // Βρίσκουμε την ημέρα που αντιστοιχεί στο σήμερα
  const todayDay = program.program_weeks
    .flatMap(week => week.program_days)
    .find(day => {
      // Για απλότητα, παίρνουμε την πρώτη ημέρα που βρίσκουμε
      // Μπορεί να χρειάζεται πιο σύνθετη λογική ανάλογα με το πώς αντιστοιχίζονται οι ημέρες
      return day;
    });

  if (!todayDay) return null;

  const totalDuration = todayDay.estimated_duration_minutes || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-none p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {program.name}
          </h3>
          {program.description && (
            <p className="text-xs text-gray-600 mt-1">
              {program.description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {totalDuration > 0 && (
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <Clock className="h-3 w-3" />
              <span>{totalDuration} λεπτά</span>
            </div>
          )}
          <Badge variant="outline" className="rounded-none text-xs">
            {assignment.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
          <Dumbbell className="h-4 w-4" />
          <span>{todayDay.name}</span>
        </h4>

        {todayDay.program_blocks.map((block) => (
          <ExerciseBlock key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
};
