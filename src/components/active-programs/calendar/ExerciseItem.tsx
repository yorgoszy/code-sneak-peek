
import React, { useState } from 'react';
import { Separator } from "@/components/ui/separator";
import { Play, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  updateReps: (exerciseId: string, reps: number) => void;
  clearReps: (exerciseId: string) => void;
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
  clearVelocity,
  updateReps,
  clearReps
}) => {
  const [actualKg, setActualKg] = useState('');
  const [actualVelocity, setActualVelocity] = useState('');
  const [actualReps, setActualReps] = useState('');

  // Calculate new 1RM percentage based on actual kg
  const calculateNew1RMPercentage = (actualWeight: string) => {
    if (!actualWeight || !exercise.kg || !exercise.percentage_1rm) return null;
    
    const actual = parseFloat(actualWeight);
    const original = parseFloat(exercise.kg);
    
    if (isNaN(actual) || isNaN(original) || original === 0) return null;
    
    // Calculate the new percentage based on actual weight
    const newPercentage = (actual / original) * exercise.percentage_1rm;
    return Math.round(newPercentage * 10) / 10; // Round to 1 decimal place
  };

  const handleKgChange = (value: string) => {
    setActualKg(value);
    updateKg(exercise.id, value);
  };

  const handleVelocityChange = (value: string) => {
    setActualVelocity(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateVelocity(exercise.id, numValue);
    }
  };

  const handleRepsChange = (value: string) => {
    setActualReps(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      updateReps(exercise.id, numValue);
    }
  };

  const newPercentage = calculateNew1RMPercentage(actualKg);

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
          <div className="flex text-xs" style={{ height: '64px' }}>
            {/* Sets */}
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
            
            <Separator orientation="vertical" className="h-full mx-1" />
            
            {/* Reps */}
            <div className="flex-1 text-center">
              <div className="font-medium text-gray-600 mb-1">Reps</div>
              <div className="text-gray-900">{exercise.reps || '-'}</div>
              {workoutInProgress && (
                <div className="mt-0.5 flex items-center justify-center gap-1">
                  <Input
                    type="number"
                    value={actualReps}
                    onChange={(e) => handleRepsChange(e.target.value)}
                    placeholder="Πραγματικά"
                    className="text-xs rounded-none h-5 w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {actualReps && (
                    <button
                      onClick={() => {
                        setActualReps('');
                        clearReps(exercise.id);
                      }}
                      className="text-red-500 hover:text-red-700 p-0.5"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <Separator orientation="vertical" className="h-full mx-1" />
            
            {/* %1RM */}
            <div className="flex-1 text-center">
              <div className="font-medium text-gray-600 mb-1">%1RM</div>
              <div className="text-gray-900">{exercise.percentage_1rm ? `${exercise.percentage_1rm}%` : '-'}</div>
              {newPercentage && (
                <div className="text-xs text-red-600 font-medium mt-0.5">
                  {newPercentage}%
                </div>
              )}
            </div>
            
            <Separator orientation="vertical" className="h-full mx-1" />
            
            {/* Kg */}
            <div className="flex-1 text-center">
              <div className="font-medium text-gray-600 mb-1">Kg</div>
              <div className="text-gray-900">{exercise.kg || '-'}</div>
              {workoutInProgress && (
                <div className="mt-0.5 flex items-center justify-center gap-1">
                  <Input
                    type="number"
                    value={actualKg}
                    onChange={(e) => handleKgChange(e.target.value)}
                    placeholder="Πραγματικά"
                    className="text-xs rounded-none h-5 w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {actualKg && (
                    <button
                      onClick={() => {
                        setActualKg('');
                        clearKg(exercise.id);
                      }}
                      className="text-red-500 hover:text-red-700 p-0.5"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <Separator orientation="vertical" className="h-full mx-1" />
            
            {/* m/s */}
            <div className="flex-1 text-center">
              <div className="font-medium text-gray-600 mb-1">m/s</div>
              <div className="text-gray-900">{exercise.velocity_ms || '-'}</div>
              {workoutInProgress && (
                <div className="mt-0.5 flex items-center justify-center gap-1">
                  <Input
                    type="number"
                    step="0.01"
                    value={actualVelocity}
                    onChange={(e) => handleVelocityChange(e.target.value)}
                    placeholder="Πραγματικά"
                    className="text-xs rounded-none h-5 w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {actualVelocity && (
                    <button
                      onClick={() => {
                        setActualVelocity('');
                        clearVelocity(exercise.id);
                      }}
                      className="text-red-500 hover:text-red-700 p-0.5"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <Separator orientation="vertical" className="h-full mx-1" />
            
            {/* Tempo */}
            <div className="flex-1 text-center">
              <div className="font-medium text-gray-600 mb-1">Tempo</div>
              <div className="text-gray-900">{exercise.tempo || '-'}</div>
            </div>
            
            <Separator orientation="vertical" className="h-full mx-1" />
            
            {/* Rest */}
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

        {/* Notes Section */}
        <ExerciseNotes
          exerciseId={exercise.id}
          initialNotes={getNotes(exercise.id)}
          workoutInProgress={workoutInProgress}
          onNotesChange={updateNotes}
          onClearNotes={clearNotes}
        />
      </div>
    </div>
  );
};
