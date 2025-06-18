
import React from 'react';
import { ExerciseCard } from './ExerciseCard';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
  categories?: string[];
}

interface ExerciseGridProps {
  exercises: Exercise[];
  onSelectExercise: (exerciseId: string) => void;
  selectedCategories: string[];
  searchTerm: string;
}

export const ExerciseGrid: React.FC<ExerciseGridProps> = ({
  exercises,
  onSelectExercise,
  selectedCategories,
  searchTerm
}) => {
  if (exercises.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {selectedCategories.length > 0 || searchTerm 
          ? 'Δεν βρέθηκαν ασκήσεις που να ταιριάζουν με τα κριτήρια'
          : 'Δεν βρέθηκαν ασκήσεις'
        }
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onSelect={onSelectExercise}
        />
      ))}
    </div>
  );
};
