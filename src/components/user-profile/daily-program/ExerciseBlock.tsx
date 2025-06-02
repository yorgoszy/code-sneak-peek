
import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseVideoDialog } from './ExerciseVideoDialog';

interface Exercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  kg?: string;
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

interface Block {
  id: string;
  name: string;
  block_order: number;
  program_exercises: Exercise[];
}

interface ExerciseBlockProps {
  block: Block;
}

export const ExerciseBlock: React.FC<ExerciseBlockProps> = ({ block }) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  const handleExerciseClick = (exercise: Exercise) => {
    if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
      setSelectedExercise(exercise);
      setIsVideoDialogOpen(true);
    }
  };

  const renderVideoThumbnail = (exercise: Exercise) => {
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
      <div className="relative w-8 h-6 rounded-none overflow-hidden cursor-pointer group flex-shrink-0">
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
    <>
      <div className="bg-gray-700 rounded-none p-2 mb-1">
        <h6 className="text-xs font-medium text-white mb-1">
          {block.name}
        </h6>
        
        <div className="space-y-0">
          {block.program_exercises
            .sort((a, b) => a.exercise_order - b.exercise_order)
            .map((exercise) => (
              <div key={exercise.id} className="bg-white rounded-none">
                {/* Exercise Header */}
                <div className="flex items-center gap-2 p-1 border-b border-gray-100">
                  <div 
                    onClick={() => handleExerciseClick(exercise)}
                    className="flex-shrink-0"
                  >
                    {renderVideoThumbnail(exercise)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h6 
                      className={`text-xs font-medium text-gray-900 truncate ${
                        exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url) 
                          ? 'cursor-pointer hover:text-blue-600' 
                          : ''
                      }`}
                      onClick={() => handleExerciseClick(exercise)}
                    >
                      {exercise.exercises?.name || 'Άγνωστη άσκηση'}
                    </h6>
                  </div>
                </div>
                
                {/* Exercise Details Grid */}
                <div className="p-1 bg-gray-50">
                  <div className="grid grid-cols-6 gap-1 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-gray-600 mb-1">Sets</div>
                      <div className="text-gray-900">{exercise.sets}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-600 mb-1">Reps</div>
                      <div className="text-gray-900">{exercise.reps}</div>
                    </div>
                    {exercise.kg && (
                      <div className="text-center">
                        <div className="font-medium text-gray-600 mb-1">Kg</div>
                        <div className="text-gray-900">{exercise.kg}</div>
                      </div>
                    )}
                    {exercise.percentage_1rm && (
                      <div className="text-center">
                        <div className="font-medium text-gray-600 mb-1">%1RM</div>
                        <div className="text-gray-900">{exercise.percentage_1rm}%</div>
                      </div>
                    )}
                    {exercise.velocity_ms && (
                      <div className="text-center">
                        <div className="font-medium text-gray-600 mb-1">m/s</div>
                        <div className="text-gray-900">{exercise.velocity_ms}</div>
                      </div>
                    )}
                    {exercise.tempo && (
                      <div className="text-center">
                        <div className="font-medium text-gray-600 mb-1">Tempo</div>
                        <div className="text-gray-900">{exercise.tempo}</div>
                      </div>
                    )}
                    {exercise.rest && (
                      <div className="text-center">
                        <div className="font-medium text-gray-600 mb-1">Rest</div>
                        <div className="text-gray-900">{exercise.rest}</div>
                      </div>
                    )}
                  </div>
                  
                  {exercise.notes && (
                    <div className="mt-1 text-xs text-gray-600 italic">
                      {exercise.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      <ExerciseVideoDialog
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        exercise={selectedExercise}
      />
    </>
  );
};
