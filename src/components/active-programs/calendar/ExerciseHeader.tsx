
import React from 'react';
import { CheckCircle, Play } from 'lucide-react';
import { VideoThumbnail } from '@/components/user-profile/daily-program/VideoThumbnail';
import { isValidVideoUrl } from '@/utils/videoUtils';

interface ExerciseHeaderProps {
  exercise: any;
  isComplete: boolean;
  remainingText: string;
  workoutInProgress: boolean;
  onVideoClick: (event: React.MouseEvent) => void;
  onSetClick: (event: React.MouseEvent) => void;
  onExerciseNameClick?: (event: React.MouseEvent) => void;
}

export const ExerciseHeader: React.FC<ExerciseHeaderProps> = ({
  exercise,
  isComplete,
  remainingText,
  workoutInProgress,
  onVideoClick,
  onSetClick,
  onExerciseNameClick
}) => {
  const hasVideo = exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url);

  const handleVideoThumbnailClick = (exerciseForVideo: any) => {
    // Convert the exercise parameter to a MouseEvent-like call
    const syntheticEvent = {
      stopPropagation: () => {},
      preventDefault: () => {}
    } as React.MouseEvent;
    onVideoClick(syntheticEvent);
  };

  return (
    <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {isComplete && <CheckCircle className="w-4 h-4 text-[#00ffba] flex-shrink-0" />}
          
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <h4 
              className={`text-sm font-medium text-gray-900 truncate ${
                hasVideo ? 'cursor-pointer hover:text-[#00ffba] transition-colors' : ''
              }`}
              onClick={hasVideo && onExerciseNameClick ? onExerciseNameClick : undefined}
              title={exercise.exercises?.name}
            >
              {exercise.exercises?.name || 'Άγνωστη άσκηση'}
            </h4>
            
            {hasVideo && (
              <div className="video-thumbnail flex-shrink-0">
                <VideoThumbnail 
                  exercise={exercise}
                  onVideoClick={handleVideoThumbnailClick}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {remainingText && (
            <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-none border">
              {remainingText}
            </span>
          )}
          
          {workoutInProgress && (
            <div 
              className="bg-[#00ffba] hover:bg-[#00ffba]/80 text-black px-2 py-1 rounded-none text-xs cursor-pointer transition-colors flex items-center space-x-1"
              onClick={onSetClick}
            >
              <Play className="w-3 h-3" />
              <span>Sets</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

