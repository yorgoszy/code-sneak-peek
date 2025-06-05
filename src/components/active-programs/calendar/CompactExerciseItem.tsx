import React from 'react';
import { Clock, Target, Zap, Play, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  updateVelocity: (exerciseId: string, velocity: string) => void;
  clearVelocity: (exerciseId: string) => void;
  updateReps: (exerciseId: string, reps: string) => void;
  clearReps: (exerciseId: string) => void;
  selectedDate: Date;
  program: any;
}

export const CompactExerciseItem: React.FC<CompactExerciseItemProps> = ({
  exercise,
  workoutInProgress,
  isComplete,
  remainingText,
  onExerciseClick,
  onSetClick,
  onVideoClick,
  getNotes,
  updateNotes,
  clearNotes,
  updateKg,
  clearKg,
  updateVelocity,
  clearVelocity,
  updateReps,
  clearReps,
  selectedDate,
  program,
}) => {
  const hasVideo = exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url);

  return (
    <div 
      className={`border border-gray-200 rounded-none p-2 cursor-pointer transition-colors ${
        isComplete ? 'bg-[#00ffba]/10 border-[#00ffba]' : 'hover:bg-gray-50'
      }`}
      onClick={(e) => onExerciseClick(exercise, e)}
    >
      <div className="flex items-start gap-2">
        {/* Video Thumbnail */}
        {hasVideo && (
          <div 
            className="relative flex-shrink-0 video-thumbnail cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onVideoClick(exercise);
            }}
          >
            <div className="w-12 h-9 bg-gray-100 border border-gray-200 rounded-none overflow-hidden">
              <img
                src={getVideoThumbnail(exercise.exercises.video_url) || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=48&h=36&fit=crop&crop=center'}
                alt={exercise.exercises?.name || 'Video thumbnail'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder image
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=48&h=36&fit=crop&crop=center';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <Play className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm text-gray-900 truncate">
              {exercise.exercises?.name || 'Άσκηση'}
            </h4>
            <div className="flex items-center gap-1">
              {hasVideo && (
                <Video className="w-3 h-3 text-gray-400" />
              )}
              {workoutInProgress && (
                <Badge 
                  variant={isComplete ? "default" : "secondary"}
                  className={`text-xs rounded-none ${
                    isComplete ? 'bg-[#00ffba] text-black' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetClick(exercise.id, exercise.sets);
                  }}
                >
                  {remainingText}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-1 text-xs text-gray-600">
            {exercise.sets && (
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                <span>{exercise.sets}</span>
              </div>
            )}
            {exercise.reps && (
              <span>{exercise.reps} reps</span>
            )}
            {exercise.kg && (
              <span>{exercise.kg} kg</span>
            )}
            {exercise.rest_seconds && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{exercise.rest_seconds}s</span>
              </div>
            )}
            {exercise.tempo && (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>{exercise.tempo}</span>
              </div>
            )}
            {exercise.velocity && (
              <span>{exercise.velocity} m/s</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
