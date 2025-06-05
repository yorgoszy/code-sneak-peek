
import React, { useState } from 'react';
import { ExerciseVideoDialog } from './ExerciseVideoDialog';
import { useExerciseCompletion } from '@/hooks/useExerciseCompletion';
import { SingleBlock } from './SingleBlock';
import { MultipleBlocks } from './MultipleBlocks';
import { isValidVideoUrl } from '@/utils/videoUtils';

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
    console.log('🎯 ExerciseBlock handleExerciseClick:', exercise.exercises?.name, 'viewOnly:', viewOnly);
    
    // Αν είναι μόνο για προβολή, δεν κάνουμε τίποτα άλλο
    if (viewOnly) {
      return;
    }

    // Αν δεν είναι view-only, ολοκληρώνουμε ένα σετ
    completeSet(exercise.id, exercise.sets);
  };

  const handleVideoClick = (exercise: Exercise) => {
    console.log('🎬 ExerciseBlock handleVideoClick:', exercise.exercises?.name);
    console.log('🎬 Video URL:', exercise.exercises?.video_url);
    console.log('🎬 Is valid URL:', exercise.exercises?.video_url ? isValidVideoUrl(exercise.exercises.video_url) : false);
    
    if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
      setSelectedExercise(exercise);
      setIsVideoDialogOpen(true);
    } else {
      console.log('❌ Invalid or missing video URL');
    }
  };

  if (!blocks || blocks.length === 0) {
    return null;
  }

  // Αν έχουμε μόνο ένα block, το εμφανίζουμε χωρίς tabs
  if (blocks.length === 1) {
    return (
      <>
        <SingleBlock
          block={blocks[0]}
          viewOnly={viewOnly}
          getRemainingText={getRemainingText}
          isExerciseComplete={isExerciseComplete}
          onExerciseClick={handleExerciseClick}
          onVideoClick={handleVideoClick}
        />

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
      <MultipleBlocks
        blocks={blocks}
        viewOnly={viewOnly}
        getRemainingText={getRemainingText}
        isExerciseComplete={isExerciseComplete}
        onExerciseClick={handleExerciseClick}
        onVideoClick={handleVideoClick}
      />

      <ExerciseVideoDialog
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        exercise={selectedExercise}
      />
    </>
  );
};
