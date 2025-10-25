import React, { useState } from 'react';
import { Dumbbell, Play } from 'lucide-react';
import { format } from 'date-fns';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';
import { isValidVideoUrl } from '@/utils/videoUtils';

interface TodayExercisesCardProps {
  userPrograms: any[];
  workoutCompletions: any[];
}

export const TodayExercisesCard: React.FC<TodayExercisesCardProps> = ({ 
  userPrograms, 
  workoutCompletions 
}) => {
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  
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
        targetDay.program_blocks?.forEach((block: any) => {
          block.program_exercises?.forEach((pe: any) => {
            exercises.push({
              id: pe.exercise_id,
              name: pe.exercises?.name || 'Άσκηση',
              sets: pe.sets || 0,
              reps: pe.reps || '',
              category: pe.exercises?.exercise_categories?.name || '',
              video_url: pe.exercises?.video_url || '',
              exercises: pe.exercises
            });
          });
        });
        
        return {
          dayName: targetDay.name,
          exercises
        };
      }
    }
    return null;
  };

  const todayData = getTodayExercises();

  const handleExerciseClick = (exercise: any) => {
    if (exercise.video_url && isValidVideoUrl(exercise.video_url)) {
      setSelectedExercise(exercise);
      setIsVideoDialogOpen(true);
    }
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

  return (
    <>
      <div className="bg-white p-3 border rounded-none">
        <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center space-x-1">
          <Dumbbell className="h-3 w-3 text-blue-600" />
          <span>Ασκήσεις Σήμερα - {todayData.dayName}</span>
        </h4>
        <div className="space-y-1">
          {todayData.exercises.map((exercise, index) => {
            const hasVideo = exercise.video_url && isValidVideoUrl(exercise.video_url);
            
            return (
              <div 
                key={index} 
                className={`text-xs flex justify-between items-center py-1 border-b border-gray-100 last:border-0 ${
                  hasVideo ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
                }`}
                onClick={() => hasVideo && handleExerciseClick(exercise)}
              >
                <span className="font-medium text-gray-800 truncate flex-1 flex items-center gap-1">
                  {exercise.name}
                  {hasVideo && <Play className="w-3 h-3 text-blue-600" />}
                </span>
                <span className="text-gray-600 ml-2 whitespace-nowrap">
                  {exercise.sets}x{exercise.reps}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <ExerciseVideoDialog
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        exercise={selectedExercise}
      />
    </>
  );
};