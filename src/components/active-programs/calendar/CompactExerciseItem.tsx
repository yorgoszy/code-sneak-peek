
import React from 'react';
import { Play, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';

interface CompactExerciseItemProps {
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

export const CompactExerciseItem: React.FC<CompactExerciseItemProps> = ({
  exercise,
  workoutInProgress,
  isComplete,
  remainingText,
  onExerciseClick,
  onSetClick,
  onVideoClick
}) => {
  const handleClick = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('.video-thumbnail')) {
      return;
    }
    onExerciseClick(exercise, event);
  };

  const handleVideoClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('🎬 Compact Video click for:', exercise.exercises?.name);
    onVideoClick(exercise);
  };

  const handleSetClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSetClick(exercise.id, exercise.sets, event);
  };

  // Χρησιμοποιούμε το σωστό path για το video URL
  const videoUrl = exercise.exercises?.video_url;
  const hasVideo = videoUrl && isValidVideoUrl(videoUrl);
  const exerciseName = exercise.exercises?.name || 'Άγνωστη άσκηση';

  return (
    <div 
      className={`
        border border-gray-200 rounded-none p-1 text-xs transition-colors
        ${workoutInProgress ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-100'}
        ${isComplete ? 'bg-green-50 border-green-200' : ''}
      `}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 flex-1 min-w-0">
          {/* Video Thumbnail */}
          {hasVideo && (
            <div 
              className="video-thumbnail flex-shrink-0 w-6 h-6 bg-gray-200 rounded-none flex items-center justify-center cursor-pointer hover:bg-gray-300"
              onClick={handleVideoClick}
            >
              <Play className="w-3 h-3 text-gray-600" />
            </div>
          )}
          
          {/* Exercise Name */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{exerciseName}</div>
          </div>
          
          {/* Completion Status */}
          {isComplete && (
            <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
          )}
        </div>
        
        {/* Set Button */}
        {workoutInProgress && !isComplete && (
          <Button
            onClick={handleSetClick}
            size="sm"
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none h-5 w-8 text-xs px-1 ml-1"
          >
            ✓
          </Button>
        )}
      </div>
      
      {/* Exercise Details */}
      <div className="flex items-center space-x-2 text-gray-600 mt-0.5">
        <span>{exercise.sets}x{exercise.reps}</span>
        {exercise.kg && <span>• {exercise.kg}kg</span>}
        {exercise.percentage_1rm && <span>• {exercise.percentage_1rm}%</span>}
        {exercise.rest && <span>• {exercise.rest}s</span>}
      </div>
      
      {/* Remaining Text */}
      {workoutInProgress && (
        <div className="text-gray-500 text-xs mt-0.5">
          {remainingText}
        </div>
      )}
    </div>
  );
};
