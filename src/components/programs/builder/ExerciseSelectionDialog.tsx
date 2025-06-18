
import React from 'react';
import { Dialog } from "@/components/ui/dialog";
import { ExerciseSelectionDialogContent } from './ExerciseSelectionDialogContent';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
}

interface ExerciseSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: Exercise[];
  onSelectExercise: (exerciseId: string) => void;
}

export const ExerciseSelectionDialog: React.FC<ExerciseSelectionDialogProps> = ({
  open,
  onOpenChange,
  exercises,
  onSelectExercise
}) => {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <ExerciseSelectionDialogContent
        exercises={exercises}
        onSelectExercise={onSelectExercise}
        onClose={handleClose}
      />
    </Dialog>
  );
};
