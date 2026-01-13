
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Play } from "lucide-react";
import { DebouncedInput } from '@/components/programs/builder/DebouncedInput';
import { RollingTimeInput } from '@/components/programs/builder/RollingTimeInput';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';

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
  onDuplicate?: () => void;
  onVideoClick?: () => void;
}

export const EditableExerciseRow: React.FC<EditableExerciseRowProps> = ({
  exercise,
  onUpdate,
  onRemove,
  onDuplicate,
  onVideoClick
}) => {
  const [repsMode, setRepsMode] = useState<'reps' | 'time' | 'meter'>(exercise.reps_mode as any || 'reps');
  const [kgMode, setKgMode] = useState<'kg' | 'rpm' | 'meter' | 's/m' | 'km/h'>(exercise.kg_mode as any || 'kg');

  const videoUrl = exercise.exercises?.video_url;
  const hasValidVideo = videoUrl && isValidVideoUrl(videoUrl);
  const thumbnailUrl = hasValidVideo ? getVideoThumbnail(videoUrl) : null;

  // Memoized handlers
  const handleSetsChange = useCallback((value: string) => {
    onUpdate?.('sets', parseInt(value) || '');
  }, [onUpdate]);

  const handleRepsChange = useCallback((value: string) => {
    onUpdate?.('reps', value);
  }, [onUpdate]);

  const handleKgChange = useCallback((value: string) => {
    const cleaned = value.replace('.', ',');
    onUpdate?.('kg', cleaned);
  }, [onUpdate]);

  const handleVelocityChange = useCallback((value: string) => {
    const cleaned = value.replace('.', ',');
    onUpdate?.('velocity_ms', cleaned);
  }, [onUpdate]);

  const handlePercentageChange = useCallback((value: string) => {
    const cleaned = value.replace('.', ',');
    onUpdate?.('percentage_1rm', cleaned);
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

  const handleRepsLabelClick = useCallback(() => {
    setRepsMode((prev) => {
      let newMode: 'reps' | 'time' | 'meter';
      if (prev === 'reps') newMode = 'time';
      else if (prev === 'time') newMode = 'meter';
      else newMode = 'reps';
      onUpdate?.('reps_mode', newMode);
      return newMode;
    });
  }, [onUpdate]);

  const handleKgLabelClick = useCallback(() => {
    setKgMode((prev) => {
      let newMode: 'kg' | 'rpm' | 'meter' | 's/m' | 'km/h';
      if (prev === 'kg') newMode = 'rpm';
      else if (prev === 'rpm') newMode = 'meter';
      else if (prev === 'meter') newMode = 's/m';
      else if (prev === 's/m') newMode = 'km/h';
      else newMode = 'kg';
      onUpdate?.('kg_mode', newMode);
      return newMode;
    });
  }, [onUpdate]);

  const inputStyle: React.CSSProperties = { 
    borderRadius: '0px', 
    fontSize: '12px', 
    height: '22px', 
    padding: '0 4px'
  };

  return (
    <div className="bg-white border-0 border-b w-full" style={{ fontSize: '12px' }}>
      {/* Header - Same as ExerciseSelectionButton from ProgramBuilder */}
      <div className="px-2 py-0 border-b bg-gray-100 flex items-center w-full" style={{ minHeight: '28px' }}>
        {/* Exercise button - takes remaining space with overflow hidden */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-sm h-6 justify-start px-2 bg-gray-200 hover:bg-gray-300 w-full"
            style={{ borderRadius: '0px', fontSize: '12px' }}
            onClick={onVideoClick}
          >
            <div className="flex items-center gap-2 w-full">
              {/* Video Thumbnail - LEFT side (before name) */}
              {hasValidVideo && thumbnailUrl ? (
                <div className="w-8 h-5 rounded-none overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={thumbnailUrl}
                    alt={`${exercise.exercises?.name} video thumbnail`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-full h-full bg-gray-200 flex items-center justify-center">
                    <Play className="w-2 h-2 text-gray-400" />
                  </div>
                </div>
              ) : hasValidVideo ? (
                <div className="w-8 h-5 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Play className="w-2 h-2 text-gray-400" />
                </div>
              ) : (
                <div className="w-8 h-5 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-gray-400">-</span>
                </div>
              )}
              
              {/* Exercise Name */}
              <div className="flex items-center gap-1 flex-1">
                <span className="truncate">{exercise.exercises?.name || 'Άγνωστη Άσκηση'}</span>
              </div>
            </div>
          </Button>
        </div>
        
        {/* Icons - fixed position on the right */}
        <div className="flex gap-1 flex-shrink-0 ml-1">
          {onDuplicate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="p-1 h-6 w-6"
              style={{ borderRadius: '0px' }}
            >
              <Copy className="w-3 h-3" />
            </Button>
          )}
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="p-1 h-6 w-6"
              style={{ borderRadius: '0px' }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Exercise Details - Same layout as ExerciseDetailsFormOptimized */}
      <div className="flex px-2 py-0 gap-0 w-full" style={{ minHeight: '28px' }}>
        <div className="flex flex-col items-center" style={{ width: '60px' }}>
          <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>
            Sets
          </label>
          <DebouncedInput
            value={exercise.sets?.toString() || ''}
            onChange={handleSetsChange}
            className="text-center w-full"
            style={inputStyle}
          />
        </div>
        
        <div className="flex flex-col items-center" style={{ width: '60px' }}>
          <label 
            className="block mb-1 text-center w-full cursor-pointer hover:text-[#00ffba]" 
            style={{ fontSize: '10px', color: '#666' }}
            onClick={handleRepsLabelClick}
          >
            {repsMode === 'reps' ? 'Reps' : repsMode === 'time' ? 'Time' : 'Meter'}
          </label>
          {repsMode === 'time' ? (
            <RollingTimeInput
              value={exercise.reps || ''}
              onChange={handleRepsChange}
              className="text-center w-full"
              style={inputStyle}
            />
          ) : (
            <DebouncedInput
              value={exercise.reps || ''}
              onChange={handleRepsChange}
              className="text-center w-full"
              style={inputStyle}
            />
          )}
        </div>
        
        <div className="flex flex-col items-center" style={{ width: '60px' }}>
          <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>
            %1RM
          </label>
          <DebouncedInput
            inputMode="decimal"
            value={exercise.percentage_1rm?.toString() || ''}
            onChange={handlePercentageChange}
            className="text-center w-full"
            style={inputStyle}
          />
        </div>
        
        <div className="flex flex-col items-center" style={{ width: '60px' }}>
          <label 
            className="block mb-1 text-center w-full cursor-pointer hover:text-[#00ffba]" 
            style={{ fontSize: '10px', color: '#666' }}
            onClick={handleKgLabelClick}
          >
            {kgMode === 'kg' ? 'Kg' : kgMode === 'rpm' ? 'rpm' : kgMode === 'meter' ? 'meter' : kgMode === 's/m' ? 's/m' : 'km/h'}
          </label>
          <DebouncedInput
            inputMode="decimal"
            value={exercise.kg || ''}
            onChange={handleKgChange}
            className="text-center w-full"
            style={inputStyle}
          />
        </div>
        
        <div className="flex flex-col items-center" style={{ width: '60px' }}>
          <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>
            m/s
          </label>
          <DebouncedInput
            inputMode="decimal"
            value={exercise.velocity_ms?.toString() || ''}
            onChange={handleVelocityChange}
            className="text-center w-full"
            style={inputStyle}
          />
        </div>
        
        <div className="flex flex-col items-center" style={{ width: '60px' }}>
          <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>
            Tempo
          </label>
          <DebouncedInput
            value={exercise.tempo || ''}
            onChange={handleTempoChange}
            className="text-center w-full"
            style={inputStyle}
            placeholder="1.1.1"
          />
        </div>
        
        <div className="flex flex-col items-center" style={{ width: '52px' }}>
          <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>
            Rest
          </label>
          <RollingTimeInput
            value={exercise.rest || ''}
            onChange={handleRestChange}
            className="text-center w-full"
            style={inputStyle}
          />
        </div>
      </div>
      
      {/* Notes */}
      <div className="px-2 pb-1">
        <DebouncedInput
          value={exercise.notes || ''}
          onChange={handleNotesChange}
          className="h-5 rounded-none px-1 text-xs italic text-gray-600 bg-white w-full"
          style={{ borderRadius: '0px', fontSize: '11px', height: '20px' }}
          placeholder="Σημειώσεις..."
        />
      </div>
    </div>
  );
};
