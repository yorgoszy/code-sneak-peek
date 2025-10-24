import React from 'react';
import { Dumbbell } from 'lucide-react';
import { format } from 'date-fns';

interface TodayExercisesCardProps {
  userPrograms: any[];
  workoutCompletions: any[];
}

export const TodayExercisesCard: React.FC<TodayExercisesCardProps> = ({ 
  userPrograms, 
  workoutCompletions 
}) => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Βρίσκουμε το πρόγραμμα της σημερινής ημέρας
  const getTodayExercises = () => {
    for (const program of userPrograms) {
      if (!program.training_dates) continue;
      
      const dateIndex = program.training_dates.findIndex((d: string) => d === todayStr);
      if (dateIndex === -1) continue;

      const weeks = program.programs?.program_weeks || [];
      if (weeks.length === 0) continue;

      let targetDay = null;
      let currentDayCount = 0;

      for (const week of weeks) {
        const daysInWeek = week.program_days?.length || 0;
        
        if (dateIndex >= currentDayCount && dateIndex < currentDayCount + daysInWeek) {
          const dayIndexInWeek = dateIndex - currentDayCount;
          targetDay = week.program_days?.[dayIndexInWeek] || null;
          break;
        }
        
        currentDayCount += daysInWeek;
      }

      if (targetDay) {
        const exercises: any[] = [];
        const typeCount: Record<string, number> = {};
        
        targetDay.program_blocks?.forEach((block: any) => {
          block.program_exercises?.forEach((pe: any) => {
            const type = pe.exercises?.exercise_categories?.type || 'other';
            typeCount[type] = (typeCount[type] || 0) + 1;
            
            exercises.push({
              name: pe.exercises?.name || 'Άσκηση',
              sets: pe.sets || 0,
              reps: pe.reps || '',
              category: pe.exercises?.exercise_categories?.name || '',
              type: type
            });
          });
        });
        
        return {
          dayName: targetDay.name,
          exercises,
          typeCount
        };
      }
    }
    return null;
  };

  const todayData = getTodayExercises();

  // Χρώματα για τους τύπους ασκήσεων
  const typeColors: Record<string, string> = {
    'strength': '#3b82f6',     // blue
    'hypertrophy': '#8b5cf6',  // purple
    'power': '#ef4444',        // red
    'endurance': '#10b981',    // green
    'mobility': '#f59e0b',     // amber
    'core': '#ec4899',         // pink
    'cardio': '#06b6d4',       // cyan
    'other': '#6b7280'         // gray
  };

  if (!todayData || todayData.exercises.length === 0) {
    return (
      <div className="bg-white p-3 border rounded-none">
        <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center space-x-1">
          <Dumbbell className="h-3 w-3 text-blue-600" />
          <span>Ασκήσεις Σήμερα</span>
        </h4>
        <p className="text-xs text-gray-500">Δεν υπάρχουν προπονήσεις σήμερα</p>
      </div>
    );
  }

  const totalExercises = todayData.exercises.length;

  return (
    <div className="bg-white p-3 border rounded-none">
      <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center space-x-1">
        <Dumbbell className="h-3 w-3 text-blue-600" />
        <span>Ασκήσεις Σήμερα - {todayData.dayName}</span>
      </h4>
      
      {/* Χρωματιστή μπάρα με τους τύπους ασκήσεων */}
      <div className="h-3 w-full flex rounded-none overflow-hidden mb-3">
        {Object.entries(todayData.typeCount).map(([type, count]) => {
          const percentage = ((count as number) / totalExercises) * 100;
          return (
            <div
              key={type}
              style={{
                width: `${percentage}%`,
                backgroundColor: typeColors[type] || typeColors.other
              }}
              className="transition-all duration-300"
              title={`${type}: ${count} ασκήσεις`}
            />
          );
        })}
      </div>

      <div className="space-y-1 max-h-32 overflow-y-auto">
        {todayData.exercises.map((exercise, index) => (
          <div key={index} className="text-xs flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
            <span className="font-medium text-gray-800 truncate flex-1">{exercise.name}</span>
            <span className="text-gray-600 ml-2 whitespace-nowrap">
              {exercise.sets}x{exercise.reps}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
