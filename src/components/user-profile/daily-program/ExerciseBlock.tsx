
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
        <div className="w-16 h-12 bg-gray-200 rounded-none flex items-center justify-center">
          <span className="text-xs text-gray-400">Χωρίς βίντεο</span>
        </div>
      );
    }

    const thumbnailUrl = getVideoThumbnail(videoUrl);
    
    return (
      <div className="relative w-16 h-12 rounded-none overflow-hidden cursor-pointer group">
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
    <>
      <div className="border border-gray-100 rounded-none p-4">
        <h5 className="font-medium text-gray-800 mb-3">
          {block.name}
        </h5>
        
        <div className="space-y-3">
          {block.program_exercises
            .sort((a, b) => a.exercise_order - b.exercise_order)
            .map((exercise) => (
              <div 
                key={exercise.id} 
                className="flex items-center gap-4 p-3 border border-gray-50 rounded-none hover:bg-gray-50 transition-colors"
              >
                {/* Video Thumbnail */}
                <div 
                  onClick={() => handleExerciseClick(exercise)}
                  className="flex-shrink-0"
                >
                  {renderVideoThumbnail(exercise)}
                </div>

                {/* Exercise Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h6 
                        className={`font-medium text-gray-900 ${
                          exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url) 
                            ? 'cursor-pointer hover:text-blue-600' 
                            : ''
                        }`}
                        onClick={() => handleExerciseClick(exercise)}
                      >
                        {exercise.exercises?.name || 'Άγνωστη άσκηση'}
                      </h6>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="font-medium">{exercise.sets} sets</span>
                        <span>{exercise.reps} reps</span>
                        {exercise.kg && <span>{exercise.kg} kg</span>}
                        {exercise.percentage_1rm && <span>{exercise.percentage_1rm}% 1RM</span>}
                        {exercise.velocity_ms && <span>{exercise.velocity_ms} m/s</span>}
                        {exercise.tempo && <span>Tempo: {exercise.tempo}</span>}
                        {exercise.rest && <span>Ανάπαυση: {exercise.rest}</span>}
                      </div>
                      
                      {exercise.notes && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          {exercise.notes}
                        </p>
                      )}
                    </div>
                  </div>
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
