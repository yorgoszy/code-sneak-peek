
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Video, Trash2 } from 'lucide-react';

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
  clearNotes
}) => {
  const [actualKg, setActualKg] = useState(exercise.kg || '');
  const [actualReps, setActualReps] = useState(exercise.reps || '');
  const notes = getNotes(exercise.id);

  const handleSetClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSetClick(exercise.id, exercise.sets, event);
  };

  const handleVideoClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onVideoClick(exercise);
  };

  const handleKgChange = (value: string) => {
    setActualKg(value);
    if (workoutInProgress) {
      updateKg(exercise.id, value);
    }
  };

  const handleRepsChange = (value: string) => {
    setActualReps(value);
    if (workoutInProgress) {
      updateReps(exercise.id, parseInt(value) || 0);
    }
  };

  const handleNotesChange = (value: string) => {
    updateNotes(exercise.id, value);
  };

  return (
    <div 
      className={`border border-gray-200 rounded-none transition-colors ${
        workoutInProgress ? 'hover:bg-gray-50' : 'bg-gray-100'
      } ${isComplete ? 'bg-green-50 border-green-200' : ''}`}
    >
      {/* Header */}
      <div className="p-2 border-b border-gray-200">
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
                onClick={handleVideoClick}
                className="h-5 w-5 p-0 rounded-none"
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

      <div className="p-2 space-y-2">
        {/* Planned Values - Compact Row */}
        <div className="grid grid-cols-7 gap-1 text-xs">
          <div className="text-center">
            <div className="text-gray-600 mb-1">Sets</div>
            <div className="bg-gray-100 px-1 py-0.5 rounded-none">{exercise.sets || '-'}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600 mb-1">Reps</div>
            <div className="bg-gray-100 px-1 py-0.5 rounded-none">{exercise.reps || '-'}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600 mb-1">%1RM</div>
            <div className="bg-gray-100 px-1 py-0.5 rounded-none">{exercise.percentage_1rm || '-'}%</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600 mb-1">Kg</div>
            <div className="bg-gray-100 px-1 py-0.5 rounded-none">{exercise.kg || '-'}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600 mb-1">m/s</div>
            <div className="bg-gray-100 px-1 py-0.5 rounded-none">{exercise.velocity_ms || '-'}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600 mb-1">Tempo</div>
            <div className="bg-gray-100 px-1 py-0.5 rounded-none">{exercise.tempo || '-'}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600 mb-1">Rest</div>
            <div className="bg-gray-100 px-1 py-0.5 rounded-none">{exercise.rest || '-'}</div>
          </div>
        </div>

        {/* Actual Values - Only when workout is in progress */}
        {workoutInProgress && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-gray-600 mb-1">Actual Kg</label>
              <Input
                type="number"
                step="0.5"
                value={actualKg}
                onChange={(e) => handleKgChange(e.target.value)}
                className="h-6 text-xs rounded-none"
                placeholder={exercise.kg || ''}
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Actual Reps</label>
              <Input
                type="number"
                value={actualReps}
                onChange={(e) => handleRepsChange(e.target.value)}
                className="h-6 text-xs rounded-none"
                placeholder={exercise.reps || ''}
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-600">Notes</label>
              {notes && (
                <button
                  onClick={() => clearNotes(exercise.id)}
                  className="text-red-500 hover:text-red-700 p-0.5"
                  disabled={!workoutInProgress}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <Textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder={workoutInProgress ? "Προσθήκη σημειώσεων..." : "Πάτησε έναρξη για σημειώσεις"}
              className="min-h-[24px] text-xs rounded-none resize-none"
              disabled={!workoutInProgress}
              rows={1}
            />
          </div>
        </div>

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
