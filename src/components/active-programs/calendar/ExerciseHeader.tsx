
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Video } from 'lucide-react';

interface ExerciseHeaderProps {
  exercise: any;
  isComplete: boolean;
  remainingText: string;
  workoutInProgress: boolean;
  onVideoClick: (event: React.MouseEvent) => void;
  onSetClick: (event: React.MouseEvent) => void;
}

export const ExerciseHeader: React.FC<ExerciseHeaderProps> = ({
  exercise,
  isComplete,
  remainingText,
  workoutInProgress,
  onVideoClick,
  onSetClick
}) => {
  return (
    <div className="p-3 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-900">
            {exercise.exercises?.name || 'Unknown Exercise'}
          </div>
          {isComplete && <CheckCircle className="w-4 h-4 text-green-600" />}
          {exercise.exercises?.video_url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onVideoClick}
              className="h-6 w-6 p-0 rounded-none video-thumbnail"
            >
              <Video className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {workoutInProgress && !isComplete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSetClick}
              className="rounded-none text-xs h-6"
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
