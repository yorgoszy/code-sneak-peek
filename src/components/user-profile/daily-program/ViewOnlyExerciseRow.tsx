
import React from 'react';
import { Play } from "lucide-react";
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

interface ViewOnlyExerciseRowProps {
  exercise: Exercise;
  exerciseNumber?: number;
  onVideoClick?: (exercise: Exercise) => void;
}

export const ViewOnlyExerciseRow: React.FC<ViewOnlyExerciseRowProps> = ({
  exercise,
  exerciseNumber,
  onVideoClick
}) => {
  const videoUrl = exercise.exercises?.video_url;
  const hasValidVideo = videoUrl && isValidVideoUrl(videoUrl);
  const thumbnailUrl = hasValidVideo ? getVideoThumbnail(videoUrl) : null;

  const inputStyle: React.CSSProperties = { 
    borderRadius: '0px', 
    fontSize: '12px', 
    height: '22px', 
    padding: '0 4px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    cursor: 'default'
  };

  // Get label for reps mode
  const getRepsLabel = () => {
    const mode = exercise.reps_mode || 'reps';
    if (mode === 'reps') return 'Reps';
    if (mode === 'time') return 'Time';
    return 'Meter';
  };

  // Get label for kg mode
  const getKgLabel = () => {
    const mode = exercise.kg_mode || 'kg';
    if (mode === 'kg') return 'Kg';
    if (mode === 'rpm') return 'rpm';
    if (mode === 'meter') return 'meter';
    if (mode === 's/m') return 's/m';
    return 'km/h';
  };

  return (
    <div className="bg-white border-0 border-b w-full" style={{ fontSize: '12px' }}>
      {/* Exercise Name Row - Same as ExerciseSelectionButton */}
      <div className="px-2 py-0 border-b bg-gray-100 flex items-center w-full" style={{ minHeight: '28px' }}>
        <div className="flex items-center gap-2 w-full h-6 px-2 bg-gray-200" style={{ borderRadius: '0px' }}>
          {/* Thumbnail on left */}
          {hasValidVideo && thumbnailUrl ? (
            <div 
              className="w-8 h-5 rounded-none overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer"
              onClick={() => onVideoClick?.(exercise)}
            >
              <img
                src={thumbnailUrl}
                alt={`${exercise.exercises?.name} video thumbnail`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          ) : hasValidVideo ? (
            <div 
              className="w-8 h-5 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0 cursor-pointer"
              onClick={() => onVideoClick?.(exercise)}
            >
              <Play className="w-2 h-2 text-gray-400" />
            </div>
          ) : (
            <div className="w-8 h-5 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-gray-400">-</span>
            </div>
          )}
          
          {/* Exercise Number */}
          {exerciseNumber && (
            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded-sm flex-shrink-0">
              {exerciseNumber}
            </span>
          )}
          
          {/* Exercise Name */}
          <span className="truncate flex-1">{exercise.exercises?.name || 'Άγνωστη άσκηση'}</span>
        </div>
      </div>

      {/* Exercise Details Row - Same layout as ExerciseDetailsFormOptimized but read-only */}
      <div className="flex px-2 py-0 gap-0 w-full" style={{ minHeight: '28px' }}>
        <div className="flex flex-col items-center" style={{ width: '60px' }}>
          <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>
            Sets
          </label>
          <div 
            className="text-center w-full flex items-center justify-center"
            style={inputStyle}
          >
            {exercise.sets || '-'}
          </div>
        </div>
        
        <div className="flex flex-col items-center" style={{ width: '60px' }}>
          <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>
            {getRepsLabel()}
          </label>
          <div 
            className="text-center w-full flex items-center justify-center"
            style={inputStyle}
          >
            {exercise.reps || '-'}
          </div>
        </div>
        
        <div className="flex flex-col items-center" style={{ width: '60px' }}>
          <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>%1RM</label>
          <div 
            className="text-center w-full flex items-center justify-center"
            style={inputStyle}
          >
            {exercise.percentage_1rm || '-'}
          </div>
        </div>
        
        <div className="flex flex-col items-center" style={{ width: '60px' }}>
          <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>
            {getKgLabel()}
          </label>
          <div 
            className="text-center w-full flex items-center justify-center"
            style={inputStyle}
          >
            {exercise.kg || '-'}
          </div>
        </div>
        
        <div className="flex flex-col items-center" style={{ width: '60px' }}>
          <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>m/s</label>
          <div 
            className="text-center w-full flex items-center justify-center"
            style={inputStyle}
          >
            {exercise.velocity_ms || '-'}
          </div>
        </div>
        
        <div className="flex flex-col items-center" style={{ width: '60px' }}>
          <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Tempo</label>
          <div 
            className="text-center w-full flex items-center justify-center"
            style={inputStyle}
          >
            {exercise.tempo || '-'}
          </div>
        </div>
        
        <div className="flex flex-col items-center" style={{ width: '52px' }}>
          <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Rest</label>
          <div 
            className="text-center w-full flex items-center justify-center"
            style={inputStyle}
          >
            {exercise.rest || '-'}
          </div>
        </div>
      </div>
    </div>
  );
};
