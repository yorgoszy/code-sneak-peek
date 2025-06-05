import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle } from 'lucide-react';

interface ExerciseItemProps {
  exercise: any;
  workoutInProgress: boolean;
  isComplete: boolean;
  remainingText: string;
  onExerciseClick: (exercise: any, event: React.MouseEvent) => void;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  onVideoClick: (exercise: any) => void;
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

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  workoutInProgress,
  isComplete,
  remainingText,
  onExerciseClick,
  onSetClick,
  onVideoClick
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
      className={`border border-gray-200 rounded-none p-3 cursor-pointer transition-colors ${
        workoutInProgress ? 'hover:bg-gray-50' : 'bg-gray-100'
      } ${isComplete ? 'bg-green-50 border-green-200' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h6 className="text-sm font-medium text-gray-900">
              {exercise.exercises?.name || 'Unknown Exercise'}
            </h6>
            {isComplete && <CheckCircle className="w-4 h-4 text-green-600" />}
          </div>
          
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-4">
              <span>Sets: {exercise.sets}</span>
              <span>Reps: {exercise.reps}</span>
              {exercise.kg && <span>Kg: {exercise.kg}</span>}
              {exercise.rest && <span>Rest: {exercise.rest}s</span>}
            </div>
            
            {exercise.tempo && (
              <div>Tempo: {exercise.tempo}</div>
            )}
            
            {exercise.notes && (
              <div className="italic">Notes: {exercise.notes}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {workoutInProgress && !isComplete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetClick}
              className="rounded-none text-xs"
            >
              Complete Set
            </Button>
          )}
          
          <Badge 
            variant="outline" 
            className={`rounded-none text-xs ${
              isComplete ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isComplete ? 'Complete!' : remainingText}
          </Badge>
        </div>
      </div>
    </div>
  );
};
