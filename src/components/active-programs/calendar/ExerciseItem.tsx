
import React from 'react';
import { Separator } from "@/components/ui/separator";
import { Play } from "lucide-react";
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseNotes } from './ExerciseNotes';

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
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
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
  clearVelocity
}) => {
  const renderVideoThumbnail = (exercise: any) => {
    const videoUrl = exercise.exercises?.video_url;
    if (!videoUrl || !isValidVideoUrl(videoUrl)) {
      return (
        <div className="w-8 h-6 bg-gray-200 rounded-none flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-gray-400">-</span>
        </div>
      );
    }

    const thumbnailUrl = getVideoThumbnail(videoUrl);
    
    return (
      <div 
        className="relative w-8 h-6 rounded-none overflow-hidden cursor-pointer group flex-shrink-0 video-thumbnail"
        onClick={() => onVideoClick(exercise)}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${exercise.exercises?.name} thumbnail`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Play className="w-2 h-2 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-2 h-2 text-white" />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-none border border-gray-200">
      {/* Exercise Header */}
      <div 
        className={`flex items-center gap-2 p-1 border-b border-gray-100 ${
          workoutInProgress ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-50'
        } ${isComplete ? 'bg-green-50' : ''}`}
        onClick={(e) => onExerciseClick(exercise, e)}
      >
        <div className="flex-shrink-0">
          {renderVideoThumbnail(exercise)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h6 className={`text-xs font-medium truncate ${
            isComplete ? 'text-green-800' : 'text-gray-900'
          }`}>
            {exercise.exercises?.name || 'Άγνωστη άσκηση'}
          </h6>
        </div>
      </div>
      
      {/* Exercise Details Grid */}
      <div className="flex">
        <div className="p-1 bg-gray-50" style={{ width: '70%' }}>
          <div className="flex text-xs">
            <div className="flex-1 text-center">
              <div className="font-medium text-gray-600 mb-1">Sets</div>
              <div 
                className={`${
                  workoutInProgress ? 'cursor-pointer hover:bg-blue-100 rounded px-1 py-0.5' : 'cursor-not-allowed opacity-50'
                } ${isComplete ? 'text-green-700 font-semibold' : 'text-gray-900'}`}
                onClick={(e) => onSetClick(exercise.id, exercise.sets, e)}
              >
                {exercise.sets || '-'}{remainingText}
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-10 mx-1" />
            
            <div className="flex-1 text-center">
              <div className="font-medium text-gray-600 mb-1">Reps</div>
              <div className="text-gray-900">{exercise.reps || '-'}</div>
            </div>
            
            <Separator orientation="vertical" className="h-10 mx-1" />
            
            <div className="flex-1 text-center">
              <div className="font-medium text-gray-600 mb-1">%1RM</div>
              <div className="text-gray-900">{exercise.percentage_1rm ? `${exercise.percentage_1rm}%` : '-'}</div>
            </div>
            
            <Separator orientation="vertical" className="h-10 mx-1" />
            
            <div className="flex-1 text-center">
              <div className="font-medium text-gray-600 mb-1">Kg</div>
              <div className="text-gray-900">{exercise.kg || '-'}</div>
            </div>
            
            <Separator orientation="vertical" className="h-10 mx-1" />
            
            <div className="flex-1 text-center">
              <div className="font-medium text-gray-600 mb-1">m/s</div>
              <div className="text-gray-900">{exercise.velocity_ms || '-'}</div>
            </div>
            
            <Separator orientation="vertical" className="h-10 mx-1" />
            
            <div className="flex-1 text-center">
              <div className="font-medium text-gray-600 mb-1">Tempo</div>
              <div className="text-gray-900">{exercise.tempo || '-'}</div>
            </div>
            
            <Separator orientation="vertical" className="h-10 mx-1" />
            
            <div className="flex-1 text-center">
              <div className="font-medium text-gray-600 mb-1">Rest</div>
              <div className="text-gray-900">{exercise.rest || '-'}</div>
            </div>
          </div>
          
          {exercise.notes && (
            <div className="mt-1 text-xs text-gray-600 italic">
              {exercise.notes}
            </div>
          )}
        </div>

        {/* Notes and Adjustments Section */}
        <ExerciseNotes
          exerciseId={exercise.id}
          initialNotes={getNotes(exercise.id)}
          initialKg={exercise.kg}
          initialVelocity={exercise.velocity_ms}
          percentage1rm={exercise.percentage_1rm}
          workoutInProgress={workoutInProgress}
          onNotesChange={updateNotes}
          onKgChange={updateKg}
          onVelocityChange={updateVelocity}
          onClearNotes={clearNotes}
          onClearKg={clearKg}
          onClearVelocity={clearVelocity}
        />
      </div>
    </div>
  );
};
