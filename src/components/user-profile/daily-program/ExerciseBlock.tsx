
import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseVideoDialog } from './ExerciseVideoDialog';
import { useExerciseCompletion } from '@/hooks/useExerciseCompletion';

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
  blocks: Block[];
  viewOnly?: boolean;
}

export const ExerciseBlock: React.FC<ExerciseBlockProps> = ({ blocks, viewOnly = false }) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const { completeSet, getRemainingText, isExerciseComplete } = useExerciseCompletion();

  const handleExerciseClick = (exercise: Exercise, event: React.MouseEvent) => {
    // Αν κλικάρουμε στο video thumbnail, ανοίγει το video
    if ((event.target as HTMLElement).closest('.video-thumbnail')) {
      if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
        setSelectedExercise(exercise);
        setIsVideoDialogOpen(true);
      }
      return;
    }

    // Αν είναι μόνο για προβολή, δεν κάνουμε τίποτα άλλο
    if (viewOnly) {
      return;
    }

    // Αλλιώς, ολοκληρώνουμε ένα σετ
    completeSet(exercise.id, exercise.sets);
  };

  const handleVideoClick = (exercise: Exercise) => {
    if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
      setSelectedExercise(exercise);
      setIsVideoDialogOpen(true);
    }
  };

  const renderVideoThumbnail = (exercise: Exercise) => {
    const videoUrl = exercise.exercises?.video_url;
    if (!videoUrl || !isValidVideoUrl(videoUrl)) {
      return (
        <div className="w-10 h-6 bg-gray-200 rounded-none flex items-center justify-center flex-shrink-0 video-thumbnail mr-2">
          <span className="text-xs text-gray-400">-</span>
        </div>
      );
    }

    const thumbnailUrl = getVideoThumbnail(videoUrl);
    
    return (
      <div 
        className="relative w-10 h-6 rounded-none overflow-hidden cursor-pointer group flex-shrink-0 video-thumbnail mr-2"
        onClick={(e) => {
          e.stopPropagation();
          handleVideoClick(exercise);
        }}
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

  if (!blocks || blocks.length === 0) {
    return null;
  }

  // Αν έχουμε μόνο ένα block, το εμφανίζουμε χωρίς tabs
  if (blocks.length === 1) {
    const block = blocks[0];
    return (
      <>
        <div className="bg-gray-700 rounded-none p-2 mb-1">
          <h6 className="text-xs font-medium text-white mb-1">
            {block.name}
          </h6>
          
          <div className="space-y-0">
            {block.program_exercises
              .sort((a, b) => a.exercise_order - b.exercise_order)
              .map((exercise) => {
                const remainingText = viewOnly ? '' : getRemainingText(exercise.id, exercise.sets);
                const isComplete = viewOnly ? false : isExerciseComplete(exercise.id, exercise.sets);
                
                return (
                  <div key={exercise.id} className="bg-white rounded-none">
                    {/* Exercise Header */}
                    <div 
                      className={`flex items-center gap-2 p-1 border-b border-gray-100 ${
                        viewOnly ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'
                      } ${isComplete ? 'bg-green-50' : ''}`}
                      onClick={(e) => handleExerciseClick(exercise, e)}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        {renderVideoThumbnail(exercise)}
                        <h6 className={`text-xs font-medium truncate ${
                          isComplete ? 'text-green-800' : 'text-gray-900'
                        }`}>
                          {exercise.exercises?.name || 'Άγνωστη άσκηση'}
                        </h6>
                      </div>
                    </div>
                    
                    {/* Exercise Details Grid */}
                    <div className="p-1 bg-gray-50">
                      <div className="flex text-xs" style={{ width: '70%' }}>
                        <div className="flex-1 text-center">
                          <div className="font-medium text-gray-600 mb-1">Sets</div>
                          <div className={`${isComplete ? 'text-green-700 font-semibold' : 'text-gray-900'}`}>
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
                  </div>
                );
              })}
          </div>
        </div>

        <ExerciseVideoDialog
          isOpen={isVideoDialogOpen}
          onClose={() => setIsVideoDialogOpen(false)}
          exercise={selectedExercise}
        />
      </>
    );
  }

  // Αν έχουμε πολλαπλά blocks, τα εμφανίζουμε ως tabs
  return (
    <>
      <Tabs defaultValue={blocks[0]?.id} className="w-full">
        <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${blocks.length}, 1fr)` }}>
          {blocks
            .sort((a, b) => a.block_order - b.block_order)
            .map((block) => (
              <TabsTrigger key={block.id} value={block.id} className="rounded-none text-xs">
                {block.name}
              </TabsTrigger>
            ))}
        </TabsList>
        
        {blocks.map((block) => (
          <TabsContent key={block.id} value={block.id} className="mt-2">
            <div className="space-y-0">
              {block.program_exercises
                .sort((a, b) => a.exercise_order - b.exercise_order)
                .map((exercise) => {
                  const remainingText = viewOnly ? '' : getRemainingText(exercise.id, exercise.sets);
                  const isComplete = viewOnly ? false : isExerciseComplete(exercise.id, exercise.sets);
                  
                  return (
                    <div key={exercise.id} className="bg-white rounded-none border border-gray-200">
                      {/* Exercise Header */}
                      <div 
                        className={`flex items-center gap-2 p-1 border-b border-gray-100 ${
                          viewOnly ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'
                        } ${isComplete ? 'bg-green-50' : ''}`}
                        onClick={(e) => handleExerciseClick(exercise, e)}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          {renderVideoThumbnail(exercise)}
                          <h6 className={`text-xs font-medium truncate ${
                            isComplete ? 'text-green-800' : 'text-gray-900'
                          }`}>
                            {exercise.exercises?.name || 'Άγνωστη άσκηση'}
                          </h6>
                        </div>
                      </div>
                      
                      {/* Exercise Details Grid */}
                      <div className="p-1 bg-gray-50">
                        <div className="flex text-xs" style={{ width: '70%' }}>
                          <div className="flex-1 text-center">
                            <div className="font-medium text-gray-600 mb-1">Sets</div>
                            <div className={`${isComplete ? 'text-green-700 font-semibold' : 'text-gray-900'}`}>
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
                    </div>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <ExerciseVideoDialog
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        exercise={selectedExercise}
      />
    </>
  );
};
