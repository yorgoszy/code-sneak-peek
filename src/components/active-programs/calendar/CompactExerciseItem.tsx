
import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { getWorkoutData, saveWorkoutData, clearWorkoutData } from '@/hooks/useWorkoutCompletions/workoutDataService';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseHeader } from './ExerciseHeader';
import { ExerciseDetails } from './ExerciseDetails';
import { ExerciseActualValues } from './ExerciseActualValues';

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
  onSetClick,
  onVideoClick,
  updateKg,
  updateVelocity,
  updateReps,
  getNotes,
  updateNotes,
  clearNotes,
  selectedDate,
  program
}) => {
  const handleSetClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSetClick(exercise.id, exercise.sets, event);
  };

  const handleVideoClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onVideoClick(exercise);
  };

  const renderVideoThumbnail = () => {
    const videoUrl = exercise.exercises?.video_url;
    if (!videoUrl || !isValidVideoUrl(videoUrl)) {
      return (
        <div className="w-12 h-8 bg-gray-200 rounded-none flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-gray-400">-</span>
        </div>
      );
    }

    const thumbnailUrl = getVideoThumbnail(videoUrl);
    
    return (
      <div 
        className="relative w-12 h-8 rounded-none overflow-hidden cursor-pointer group flex-shrink-0 video-thumbnail"
        onClick={handleVideoClick}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${exercise.exercises?.name} thumbnail`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Play className="w-3 h-3 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-3 h-3 text-white" />
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`border border-gray-200 rounded-none transition-colors ${
        workoutInProgress ? 'hover:bg-gray-50' : 'bg-gray-100'
      } ${isComplete ? 'bg-green-50 border-green-200' : ''}`}
    >
      {/* Modified Exercise Header with Video Thumbnail */}
      <div className="p-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {renderVideoThumbnail()}
            <div className="text-sm font-medium text-gray-900">
              {exercise.exercises?.name || 'Unknown Exercise'}
            </div>
            {isComplete && <CheckCircle className="w-4 h-4 text-green-600" />}
          </div>
          
          <div className="flex items-center gap-2">
            {workoutInProgress && !isComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetClick}
                className="rounded-none text-xs h-5 px-2"
              >
                Complete Set
              </Button>
            )}
            
            <Badge 
              variant="outline" 
              className={`rounded-none text-xs px-1 ${
                isComplete ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isComplete ? 'Complete!' : remainingText}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-1 space-y-1">
        {/* Planned Values */}
        <ExerciseDetails exercise={exercise} />

        {/* Actual Values */}
        <ExerciseActualValues
          exercise={exercise}
          workoutInProgress={workoutInProgress}
          updateReps={updateReps}
          updateKg={updateKg}
          updateVelocity={updateVelocity}
          getNotes={getNotes}
          updateNotes={updateNotes}
          selectedDate={selectedDate}
          program={program}
        />

        {/* Program Notes */}
        {exercise.notes && (
          <div className="p-1 bg-blue-50 border border-blue-200 rounded-none">
            <p className="text-xs text-blue-800 font-medium">Program Notes:</p>
            <p className="text-xs text-blue-700">{exercise.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
