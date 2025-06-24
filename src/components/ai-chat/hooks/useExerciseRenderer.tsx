
import React from 'react';
import { ExerciseLink } from '../components/ExerciseLink';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';

export const useExerciseRenderer = () => {
  const [selectedExercise, setSelectedExercise] = React.useState<any>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = React.useState(false);

  const handleExerciseClick = (exerciseName: string, videoUrl?: string) => {
    if (videoUrl) {
      const exerciseForDialog = {
        id: exerciseName,
        exercises: {
          id: exerciseName,
          name: exerciseName,
          video_url: videoUrl
        }
      };
      setSelectedExercise(exerciseForDialog);
      setIsVideoDialogOpen(true);
    }
  };

  const renderExercisesInText = (text: string) => {
    // Ψάχνω για patterns όπως "Άσκηση: [όνομα άσκησης]" ή "Exercise: [όνομα άσκησης]"
    const exercisePattern = /(?:Άσκηση|Exercise|άσκηση):\s*([^.\n,]+)/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = exercisePattern.exec(text)) !== null) {
      // Προσθήκη του κειμένου πριν την άσκηση
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const exerciseName = match[1].trim();
      
      // Προσθήκη του ExerciseLink component
      parts.push(
        <ExerciseLink
          key={`exercise-${match.index}`}
          exerciseName={exerciseName}
          onClick={() => handleExerciseClick(exerciseName)}
        />
      );

      lastIndex = exercisePattern.lastIndex;
    }

    // Προσθήκη του υπόλοιπου κειμένου
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 1 ? parts : text;
  };

  const ExerciseVideoDialogComponent = () => (
    <ExerciseVideoDialog
      isOpen={isVideoDialogOpen}
      onClose={() => setIsVideoDialogOpen(false)}
      exercise={selectedExercise}
    />
  );

  return {
    renderExercisesInText,
    ExerciseVideoDialogComponent
  };
};
