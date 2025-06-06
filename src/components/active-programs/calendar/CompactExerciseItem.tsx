
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle } from 'lucide-react';

interface CompactExerciseItemProps {
  exercise: any;
  workoutInProgress: boolean;
  isComplete: boolean;
  remainingText: string;
  onExerciseClick: (exercise: any, event: React.MouseEvent) => void;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  getNotes: (exerciseId: string) => string;
  updateNotes: (exerciseId: string, notes: string) => void;
  clearNotes: (exerciseId: string) => void;
  updateKg: (exerciseId: string, kg: string) => void;
  clearKg: (exerciseId: string) => void;
  updateVelocity: (exerciseId: string, velocity: number) => void;
  clearVelocity: (exerciseId: string) => void;
  updateReps: (exerciseId: string, reps: number) => void;
  clearReps: (exerciseId: string) => void;
  selectedDate?: Date;
  program?: any;
}

export const CompactExerciseItem: React.FC<CompactExerciseItemProps> = ({
  exercise,
  workoutInProgress,
  isComplete,
  remainingText,
  onExerciseClick,
  onSetClick
}) => {
  const handleClick = (event: React.MouseEvent) => {
    onExerciseClick(exercise, event);
  };

  const handleSetClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSetClick(exercise.id, exercise.sets, event);
  };

  return (
    <div 
      className={`border border-gray-200 rounded-none p-1.5 transition-colors ${
        workoutInProgress ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-100'
      } ${isComplete ? 'bg-green-50 border-green-200' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {isComplete && <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />}
          <span className="text-xs font-medium text-gray-900 truncate">
            {exercise.exercises?.name || 'Unknown Exercise'}
          </span>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="text-xs text-gray-600">
            {exercise.sets}×{exercise.reps} {exercise.kg && `• ${exercise.kg}kg`}
          </div>
          
          {workoutInProgress && !isComplete && (
            <Button
              onClick={handleSetClick}
              size="sm"
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none h-4 w-8 text-xs px-1"
            >
              ✓
            </Button>
          )}
          
          <Badge 
            variant="outline" 
            className={`rounded-none text-xs px-1 ${
              isComplete ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isComplete ? '✓' : remainingText}
          </Badge>
        </div>
      </div>
    </div>
  );
};
