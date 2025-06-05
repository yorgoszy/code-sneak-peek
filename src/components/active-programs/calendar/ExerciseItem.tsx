
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Play, Video } from 'lucide-react';
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
  updateKg,
  updateVelocity,
  updateReps,
  getNotes,
  updateNotes,
  clearNotes,
  selectedDate,
  program
}) => {
  const [actualReps, setActualReps] = useState(exercise.reps || '');
  const [actualKg, setActualKg] = useState(exercise.kg || '');
  const [actualVelocity, setActualVelocity] = useState(exercise.velocity_ms || '');
  const [actualRest, setActualRest] = useState(exercise.rest || '');

  const handleClick = (event: React.MouseEvent) => {
    onExerciseClick(exercise, event);
  };

  const handleSetClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSetClick(exercise.id, exercise.sets, event);
  };

  const handleVideoClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onVideoClick(exercise);
  };

  const handleRepsChange = (value: string) => {
    setActualReps(value);
    if (workoutInProgress) {
      updateReps(exercise.id, parseInt(value) || 0);
    }
  };

  const handleKgChange = (value: string) => {
    setActualKg(value);
    if (workoutInProgress) {
      updateKg(exercise.id, value);
    }
  };

  const handleVelocityChange = (value: string) => {
    setActualVelocity(value);
    if (workoutInProgress) {
      updateVelocity(exercise.id, parseFloat(value) || 0);
    }
  };

  return (
    <div 
      className={`border border-gray-200 rounded-none transition-colors ${
        workoutInProgress ? 'hover:bg-gray-50' : 'bg-gray-100'
      } ${isComplete ? 'bg-green-50 border-green-200' : ''}`}
      onClick={handleClick}
    >
      {/* Exercise Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h6 className="text-sm font-medium text-gray-900">
              {exercise.exercises?.name || 'Unknown Exercise'}
            </h6>
            {isComplete && <CheckCircle className="w-4 h-4 text-green-600" />}
            {exercise.exercises?.video_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVideoClick}
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
                onClick={handleSetClick}
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

      {/* Exercise Details */}
      <div className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {/* Planned Values */}
          <div className="text-xs">
            <label className="block text-gray-600 mb-1">Planned Sets</label>
            <div className="bg-gray-100 px-2 py-1 rounded-none">{exercise.sets || '-'}</div>
          </div>
          
          <div className="text-xs">
            <label className="block text-gray-600 mb-1">Planned Reps</label>
            <div className="bg-gray-100 px-2 py-1 rounded-none">{exercise.reps || '-'}</div>
          </div>
          
          <div className="text-xs">
            <label className="block text-gray-600 mb-1">%1RM</label>
            <div className="bg-gray-100 px-2 py-1 rounded-none">{exercise.percentage_1rm || '-'}%</div>
          </div>
          
          <div className="text-xs">
            <label className="block text-gray-600 mb-1">Planned Kg</label>
            <div className="bg-gray-100 px-2 py-1 rounded-none">{exercise.kg || '-'}</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 text-xs">
          <div>
            <label className="block text-gray-600 mb-1">Tempo</label>
            <div className="bg-gray-100 px-2 py-1 rounded-none">{exercise.tempo || '-'}</div>
          </div>
          
          <div>
            <label className="block text-gray-600 mb-1">Rest (s)</label>
            <div className="bg-gray-100 px-2 py-1 rounded-none">{exercise.rest || '-'}</div>
          </div>
          
          <div>
            <label className="block text-gray-600 mb-1">Target m/s</label>
            <div className="bg-gray-100 px-2 py-1 rounded-none">{exercise.velocity_ms || '-'}</div>
          </div>
        </div>

        {/* Actual Values (when workout in progress) */}
        {workoutInProgress && (
          <div>
            <h7 className="text-xs font-medium text-gray-700 mb-2 block">Actual Values</h7>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              <div className="text-xs">
                <label className="block text-gray-600 mb-1">Actual Reps</label>
                <Input
                  type="number"
                  value={actualReps}
                  onChange={(e) => handleRepsChange(e.target.value)}
                  className="h-7 text-xs rounded-none"
                  placeholder={exercise.reps || ''}
                />
              </div>
              
              <div className="text-xs">
                <label className="block text-gray-600 mb-1">Actual Kg</label>
                <Input
                  type="number"
                  step="0.5"
                  value={actualKg}
                  onChange={(e) => handleKgChange(e.target.value)}
                  className="h-7 text-xs rounded-none"
                  placeholder={exercise.kg || ''}
                />
              </div>
              
              <div className="text-xs">
                <label className="block text-gray-600 mb-1">Actual m/s</label>
                <Input
                  type="number"
                  step="0.01"
                  value={actualVelocity}
                  onChange={(e) => handleVelocityChange(e.target.value)}
                  className="h-7 text-xs rounded-none"
                  placeholder={exercise.velocity_ms || ''}
                />
              </div>
              
              <div className="text-xs">
                <label className="block text-gray-600 mb-1">Actual Rest (s)</label>
                <Input
                  type="number"
                  value={actualRest}
                  onChange={(e) => setActualRest(e.target.value)}
                  className="h-7 text-xs rounded-none"
                  placeholder={exercise.rest || ''}
                />
              </div>
            </div>
          </div>
        )}

        {/* Exercise Notes */}
        <ExerciseNotes
          exerciseId={exercise.id}
          workoutInProgress={workoutInProgress}
          onNotesChange={updateNotes}
          onClearNotes={clearNotes}
          selectedDate={selectedDate}
          program={program}
        />

        {/* Exercise Description/Notes if available */}
        {exercise.notes && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-none">
            <p className="text-xs text-blue-800 font-medium">Program Notes:</p>
            <p className="text-xs text-blue-700">{exercise.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
