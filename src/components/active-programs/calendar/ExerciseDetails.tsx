
import React from 'react';

interface ExerciseDetailsProps {
  exercise: any;
  onVideoClick?: (exercise: any) => void;
  onSetClick?: (event: React.MouseEvent) => void;
  workoutInProgress?: boolean;
  getRemainingText?: (exerciseId: string, totalSets: number) => string;
}

export const ExerciseDetails: React.FC<ExerciseDetailsProps> = ({ 
  exercise, 
  onVideoClick,
  onSetClick,
  workoutInProgress = false,
  getRemainingText
}) => {
  const handleSetsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (workoutInProgress && onSetClick) {
      onSetClick(event);
    }
  };

  const remainingText = getRemainingText ? getRemainingText(exercise.id, exercise.sets) : '';

  if (!remainingText) {
    return null;
  }

  return (
    <div className="p-2">
      <div className="text-xs text-gray-500 text-center">
        {remainingText}
      </div>
    </div>
  );
};
