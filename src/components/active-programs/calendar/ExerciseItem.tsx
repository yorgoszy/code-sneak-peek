
import React, { useState, useEffect } from 'react';
import { Separator } from "@/components/ui/separator";
import { Play, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseNotes } from './ExerciseNotes';
import { format, subDays } from "date-fns";

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
  program
}) => {
  const [actualKg, setActualKg] = useState('');
  const [actualVelocity, setActualVelocity] = useState('');
  const [actualReps, setActualReps] = useState('');

  // Φόρτωση δεδομένων από την προηγούμενη εβδομάδα
  useEffect(() => {
    if (selectedDate && program) {
      const previousWeekDate = subDays(selectedDate, 7);
      const previousWeekDateStr = format(previousWeekDate, 'yyyy-MM-dd');
      const previousWeekKey = `${previousWeekDateStr}-${exercise.id}`;
      
      // Φόρτωση kg από localStorage
      const savedKg = localStorage.getItem(`exercise-kg-${previousWeekKey}`);
      if (savedKg && !actualKg) {
        console.log(`⚖️ Φόρτωση kg από προηγούμενη εβδομάδα για άσκηση ${exercise.id}:`, savedKg);
        setActualKg(savedKg);
        updateKg(exercise.id, savedKg);
      }
      
      // Φόρτωση velocity από localStorage
      const savedVelocity = localStorage.getItem(`exercise-velocity-${previousWeekKey}`);
      if (savedVelocity && !actualVelocity) {
        console.log(`🏃 Φόρτωση velocity από προηγούμενη εβδομάδα για άσκηση ${exercise.id}:`, savedVelocity);
        setActualVelocity(savedVelocity);
        updateVelocity(exercise.id, parseFloat(savedVelocity));
      }
      
      // Φόρτωση reps από localStorage
      const savedReps = localStorage.getItem(`exercise-reps-${previousWeekKey}`);
      if (savedReps && !actualReps) {
        console.log(`🔢 Φόρτωση reps από προηγούμενη εβδομάδα για άσκηση ${exercise.id}:`, savedReps);
        setActualReps(savedReps);
        updateReps(exercise.id, parseInt(savedReps));
      }
    }
  }, [selectedDate, program, exercise.id, actualKg, actualVelocity, actualReps, updateKg, updateVelocity, updateReps]);

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
    
    // Αποθήκευση στο localStorage
    if (selectedDate) {
      const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
      const storageKey = `exercise-kg-${currentDateStr}-${exercise.id}`;
      localStorage.setItem(storageKey, value);
    }
  };

  const handleVelocityChange = (value: string) => {
    setActualVelocity(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateVelocity(exercise.id, numValue);
      
      // Αποθήκευση στο localStorage
      if (selectedDate) {
        const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
        const storageKey = `exercise-velocity-${currentDateStr}-${exercise.id}`;
        localStorage.setItem(storageKey, value);
      }
    }
  };

  const handleRepsChange = (value: string) => {
    setActualReps(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      updateReps(exercise.id, numValue);
      
      // Αποθήκευση στο localStorage
      if (selectedDate) {
        const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
        const storageKey = `exercise-reps-${currentDateStr}-${exercise.id}`;
        localStorage.setItem(storageKey, value);
      }
    }
  };

  const newPercentage = calculateNew1RMPercentage(actualKg);

  const renderVideoThumbnail = (exercise: any) => {
    const videoUrl = exercise.exercises?.video_url;
    if (!videoUrl || !isValidVideoUrl(videoUrl)) {
      return (
        <div className="w-20 h-16 bg-gray-200 rounded-none flex items-center justify-center flex-shrink-0">
          <span className="text-sm text-gray-400">-</span>
        </div>
      );
    }

    const thumbnailUrl = getVideoThumbnail(videoUrl);
    
    return (
      <div 
        className="relative w-20 h-16 rounded-none overflow-hidden cursor-pointer group flex-shrink-0 video-thumbnail"
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
            <Play className="w-4 h-4 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-4 h-4 text-white" />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-none border border-gray-200">
      {/* Exercise Header */}
      <div 
        className={`flex items-center gap-3 p-2 border-b border-gray-100 ${
          workoutInProgress ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-50'
        } ${isComplete ? 'bg-green-50' : ''}`}
        onClick={(e) => onExerciseClick(exercise, e)}
      >
        <div className="flex-1 min-w-0">
          <h6 className={`text-sm font-medium truncate ${
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
            {/* Video */}
            <div className="flex items-center justify-center" style={{ width: '80px' }}>
              {renderVideoThumbnail(exercise)}
            </div>
            
            <Separator orientation="vertical" className="h-full mx-0.5" />
            
            {/* Sets */}
            <div className="flex-1 text-center min-w-0">
              <div className="font-medium text-gray-600 mb-1 text-xs">Sets</div>
              <div 
                className={`${
                  workoutInProgress ? 'cursor-pointer hover:bg-blue-100 rounded px-1 py-0.5' : 'cursor-not-allowed opacity-50'
                } ${isComplete ? 'text-green-700 font-semibold' : 'text-gray-900'} text-xs`}
                onClick={(e) => onSetClick(exercise.id, exercise.sets, e)}
              >
                {exercise.sets || '-'}{remainingText}
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-full mx-0.5" />
            
            {/* Reps */}
            <div className="flex-1 text-center min-w-0">
              <div className="font-medium text-gray-600 mb-1 text-xs">Reps</div>
              <div className="text-gray-900 text-xs">{exercise.reps || '-'}</div>
              {workoutInProgress && (
                <div className="mt-0.5 flex items-center justify-center gap-0.5">
                  <Input
                    type="number"
                    value={actualReps}
                    onChange={(e) => handleRepsChange(e.target.value)}
                    placeholder="Πραγ."
                    className="text-xs rounded-none h-4 w-10 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                  />
                  {actualReps && (
                    <button
                      onClick={() => {
                        setActualReps('');
                        clearReps(exercise.id);
                        if (selectedDate) {
                          const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
                          const storageKey = `exercise-reps-${currentDateStr}-${exercise.id}`;
                          localStorage.removeItem(storageKey);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-0.5"
                    >
                      <Trash2 className="w-2 h-2" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <Separator orientation="vertical" className="h-full mx-0.5" />
            
            {/* %1RM */}
            <div className="flex-1 text-center min-w-0">
              <div className="font-medium text-gray-600 mb-1 text-xs">%1RM</div>
              <div className="text-gray-900 text-xs">{exercise.percentage_1rm ? `${exercise.percentage_1rm}%` : '-'}</div>
              {newPercentage && (
                <div className="text-xs text-red-600 font-medium mt-0.5">
                  {newPercentage}%
                </div>
              )}
            </div>
            
            <Separator orientation="vertical" className="h-full mx-0.5" />
            
            {/* Kg */}
            <div className="flex-1 text-center min-w-0">
              <div className="font-medium text-gray-600 mb-1 text-xs">Kg</div>
              <div className="text-gray-900 text-xs">{exercise.kg || '-'}</div>
              {workoutInProgress && (
                <div className="mt-0.5 flex items-center justify-center gap-0.5">
                  <Input
                    type="number"
                    value={actualKg}
                    onChange={(e) => handleKgChange(e.target.value)}
                    placeholder="Πραγ."
                    className="text-xs rounded-none h-4 w-10 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                  />
                  {actualKg && (
                    <button
                      onClick={() => {
                        setActualKg('');
                        clearKg(exercise.id);
                        if (selectedDate) {
                          const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
                          const storageKey = `exercise-kg-${currentDateStr}-${exercise.id}`;
                          localStorage.removeItem(storageKey);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-0.5"
                    >
                      <Trash2 className="w-2 h-2" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <Separator orientation="vertical" className="h-full mx-0.5" />
            
            {/* m/s */}
            <div className="flex-1 text-center min-w-0">
              <div className="font-medium text-gray-600 mb-1 text-xs">m/s</div>
              <div className="text-gray-900 text-xs">{exercise.velocity_ms || '-'}</div>
              {workoutInProgress && (
                <div className="mt-0.5 flex items-center justify-center gap-0.5">
                  <Input
                    type="number"
                    step="0.01"
                    value={actualVelocity}
                    onChange={(e) => handleVelocityChange(e.target.value)}
                    placeholder="Πραγ."
                    className="text-xs rounded-none h-4 w-10 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                  />
                  {actualVelocity && (
                    <button
                      onClick={() => {
                        setActualVelocity('');
                        clearVelocity(exercise.id);
                        if (selectedDate) {
                          const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
                          const storageKey = `exercise-velocity-${currentDateStr}-${exercise.id}`;
                          localStorage.removeItem(storageKey);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-0.5"
                    >
                      <Trash2 className="w-2 h-2" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <Separator orientation="vertical" className="h-full mx-0.5" />
            
            {/* Tempo */}
            <div className="flex-1 text-center min-w-0">
              <div className="font-medium text-gray-600 mb-1 text-xs">Tempo</div>
              <div className="text-gray-900 text-xs">{exercise.tempo || '-'}</div>
            </div>
            
            <Separator orientation="vertical" className="h-full mx-0.5" />
            
            {/* Rest */}
            <div className="flex-1 text-center min-w-0">
              <div className="font-medium text-gray-600 mb-1 text-xs">Rest</div>
              <div className="text-gray-900 text-xs">{exercise.rest || '-'}</div>
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
          selectedDate={selectedDate}
          program={program}
        />
      </div>
    </div>
  );
};
