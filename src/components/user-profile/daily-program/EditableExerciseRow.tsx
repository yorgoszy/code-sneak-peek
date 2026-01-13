
import React, { useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Play } from "lucide-react";
import { DebouncedInput } from '@/components/programs/builder/DebouncedInput';
import { isValidVideoUrl } from '@/utils/videoUtils';

interface Exercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  reps_mode?: string;
  kg?: string;
  kg_mode?: string;
  percentage_1rm?: number;
  velocity_ms?: number;
  tempo?: string;
  rest?: string;
  notes?: string;
  exercise_order: number;
  exercises?: {
    id: string;
    name: string;
    description?: string;
    video_url?: string;
  };
}

interface EditableExerciseRowProps {
  exercise: Exercise;
  onUpdate?: (field: string, value: any) => void;
  onRemove?: () => void;
  onVideoClick?: () => void;
}

const REPS_MODE_LABELS: Record<string, string> = {
  'reps': 'Reps',
  'time': 'Time',
  'meter': 'Meter'
};

const KG_MODE_LABELS: Record<string, string> = {
  'kg': 'Kg',
  'rpm': 'RPM',
  'meter': 'Meter',
  's/m': 's/m',
  'km/h': 'km/h'
};

export const EditableExerciseRow: React.FC<EditableExerciseRowProps> = ({
  exercise,
  onUpdate,
  onRemove,
  onVideoClick
}) => {
  const hasVideo = exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url);

  // Memoized handlers
  const handleSetsChange = useCallback((value: string) => {
    onUpdate?.('sets', parseInt(value) || 0);
  }, [onUpdate]);

  const handleRepsChange = useCallback((value: string) => {
    onUpdate?.('reps', value);
  }, [onUpdate]);

  const handleKgChange = useCallback((value: string) => {
    onUpdate?.('kg', value);
  }, [onUpdate]);

  const handleVelocityChange = useCallback((value: string) => {
    const cleaned = value.replace('.', ',');
    const numValue = parseFloat(cleaned.replace(',', '.')) || 0;
    onUpdate?.('velocity_ms', numValue);
  }, [onUpdate]);

  const handlePercentageChange = useCallback((value: string) => {
    onUpdate?.('percentage_1rm', parseInt(value) || 0);
  }, [onUpdate]);

  const handleTempoChange = useCallback((value: string) => {
    onUpdate?.('tempo', value);
  }, [onUpdate]);

  const handleRestChange = useCallback((value: string) => {
    onUpdate?.('rest', value);
  }, [onUpdate]);

  const handleNotesChange = useCallback((value: string) => {
    onUpdate?.('notes', value);
  }, [onUpdate]);

  const velocityDisplay = typeof exercise.velocity_ms === 'number'
    ? exercise.velocity_ms.toString().replace('.', ',')
    : (exercise.velocity_ms || '');

  const inputClassName = "h-6 rounded-none px-1 text-xs text-center bg-white border-0 focus:ring-1 focus:ring-[#00ffba]";

  return (
    <div className="bg-white rounded-none">
      {/* Header - Same as ExerciseHeader but with edit controls */}
      <div className="flex items-center justify-between p-1.5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasVideo && (
            <button
              onClick={onVideoClick}
              className="video-thumbnail flex-shrink-0 p-1 hover:bg-gray-100 rounded"
            >
              <Play className="w-4 h-4 text-[#00ffba]" />
            </button>
          )}
          <span className="font-medium text-sm truncate">
            {exercise.exercises?.name || 'Άγνωστη Άσκηση'}
          </span>
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Details Grid - Same layout as ExerciseDetailsGrid but editable */}
      <div className="p-1 bg-gray-50">
        <div className="flex text-xs" style={{ width: '70%' }}>
          <div className="flex-1 text-center">
            <div className="font-medium text-gray-600 mb-1">Sets</div>
            <DebouncedInput
              value={exercise.sets?.toString() || ''}
              onChange={handleSetsChange}
              className={inputClassName}
              type="number"
              min={0}
            />
          </div>
          
          <Separator orientation="vertical" className="h-10 mx-1" />
          
          <div className="flex-1 text-center">
            <div className="font-medium text-gray-600 mb-1">{REPS_MODE_LABELS[exercise.reps_mode || 'reps']}</div>
            <DebouncedInput
              value={exercise.reps || ''}
              onChange={handleRepsChange}
              className={inputClassName}
            />
          </div>
          
          <Separator orientation="vertical" className="h-10 mx-1" />
          
          <div className="flex-1 text-center">
            <div className="font-medium text-gray-600 mb-1">%1RM</div>
            <DebouncedInput
              value={exercise.percentage_1rm?.toString() || ''}
              onChange={handlePercentageChange}
              className={inputClassName}
              type="number"
              min={0}
              max={100}
            />
          </div>
          
          <Separator orientation="vertical" className="h-10 mx-1" />
          
          <div className="flex-1 text-center">
            <div className="font-medium text-gray-600 mb-1">{KG_MODE_LABELS[exercise.kg_mode || 'kg']}</div>
            <DebouncedInput
              value={exercise.kg || ''}
              onChange={handleKgChange}
              className={inputClassName}
            />
          </div>
          
          <Separator orientation="vertical" className="h-10 mx-1" />
          
          <div className="flex-1 text-center">
            <div className="font-medium text-gray-600 mb-1">m/s</div>
            <DebouncedInput
              value={velocityDisplay}
              onChange={handleVelocityChange}
              className={inputClassName}
            />
          </div>
          
          <Separator orientation="vertical" className="h-10 mx-1" />
          
          <div className="flex-1 text-center">
            <div className="font-medium text-gray-600 mb-1">Tempo</div>
            <DebouncedInput
              value={exercise.tempo || ''}
              onChange={handleTempoChange}
              className={inputClassName}
            />
          </div>
          
          <Separator orientation="vertical" className="h-10 mx-1" />
          
          <div className="flex-1 text-center">
            <div className="font-medium text-gray-600 mb-1">Rest</div>
            <DebouncedInput
              value={exercise.rest || ''}
              onChange={handleRestChange}
              className={inputClassName}
            />
          </div>
        </div>
        
        {/* Notes - Editable */}
        <div className="mt-1">
          <DebouncedInput
            value={exercise.notes || ''}
            onChange={handleNotesChange}
            className="h-5 rounded-none px-1 text-xs italic text-gray-600 bg-white w-full"
            placeholder="Σημειώσεις..."
          />
        </div>
      </div>
    </div>
  );
};
