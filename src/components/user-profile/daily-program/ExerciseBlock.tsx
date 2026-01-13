
import React, { useState } from 'react';
import { ExerciseVideoDialog } from './ExerciseVideoDialog';
import { useExerciseCompletion } from '@/hooks/useExerciseCompletion';
import { MultipleBlocks } from './MultipleBlocks';
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

interface Block {
  id: string;
  name: string;
  block_order: number;
  training_type?: string;
  workout_format?: string;
  workout_duration?: string;
  block_sets?: number;
  program_exercises: Exercise[];
}

interface ExerciseBlockProps {
  blocks: Block[];
  viewOnly?: boolean;
  editMode?: boolean;
  onAddExercise?: (blockId: string, exerciseId: string) => void;
  onRemoveBlock?: (blockId: string) => void;
  onRemoveExercise?: (exerciseId: string) => void;
  onUpdateExercise?: (exerciseId: string, field: string, value: any) => void;
}

export const ExerciseBlock: React.FC<ExerciseBlockProps> = ({ 
  blocks, 
  viewOnly = false, 
  editMode = false,
  onAddExercise,
  onRemoveBlock,
  onRemoveExercise,
  onUpdateExercise
}) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const { completeSet, getRemainingText, isExerciseComplete } = useExerciseCompletion();

  console.log('🎯 ExerciseBlock render:', {
    blockCount: blocks?.length || 0,
    viewOnly: viewOnly,
    editMode: editMode,
    blockNames: blocks?.map(b => b.name) || []
  });

  const handleExerciseClick = (exercise: Exercise, event: React.MouseEvent) => {
    console.log('🎯 ExerciseBlock handleExerciseClick:', {
      exerciseName: exercise.exercises?.name,
      viewOnly: viewOnly,
      editMode: editMode,
      target: (event.target as HTMLElement).className
    });
    
    // Αν είναι μόνο για προβολή ή σε edit mode, δεν κάνουμε τίποτα άλλο
    if (viewOnly || editMode) {
      console.log('👁️ View only or edit mode, skipping exercise completion');
      return;
    }

    // Αν δεν είναι view-only ούτε edit mode, ολοκληρώνουμε ένα σετ
    console.log('✅ Completing set for exercise:', exercise.id);
    completeSet(exercise.id, exercise.sets);
  };

  const handleVideoClick = (exercise: Exercise) => {
    console.log('🎬 ExerciseBlock handleVideoClick:', {
      exerciseName: exercise.exercises?.name,
      videoUrl: exercise.exercises?.video_url,
      isValidUrl: exercise.exercises?.video_url ? isValidVideoUrl(exercise.exercises.video_url) : false
    });
    
    if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
      console.log('✅ Opening video dialog for:', exercise.exercises.name);
      setSelectedExercise(exercise);
      setIsVideoDialogOpen(true);
    } else {
      console.log('❌ Invalid or missing video URL');
    }
  };

  if (!blocks || blocks.length === 0) {
    console.log('❌ No blocks provided to ExerciseBlock');
    return null;
  }

  // Πάντα δείχνουμε tabs, ακόμα και για ένα block
  console.log('📑 Rendering blocks with tabs');
  return (
    <>
      <MultipleBlocks
        blocks={blocks}
        viewOnly={viewOnly}
        editMode={editMode}
        getRemainingText={getRemainingText}
        isExerciseComplete={isExerciseComplete}
        onExerciseClick={handleExerciseClick}
        onVideoClick={handleVideoClick}
        onAddExercise={onAddExercise}
        onRemoveBlock={onRemoveBlock}
        onRemoveExercise={onRemoveExercise}
        onUpdateExercise={onUpdateExercise}
      />

      <ExerciseVideoDialog
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        exercise={selectedExercise}
      />
    </>
  );
};
