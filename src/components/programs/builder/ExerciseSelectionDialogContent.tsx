
import React, { useState, useMemo } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Filter, Plus } from "lucide-react";
import { ExerciseFilters } from './ExerciseFilters';
import { ExerciseSearchInput } from './ExerciseSearchInput';
import { ExerciseGrid } from './ExerciseGrid';
import { AddExerciseDialog } from '@/components/AddExerciseDialog';
import { useExerciseRealtime } from './hooks/useExerciseRealtime';
import { useExerciseWithCategories } from './hooks/useExerciseWithCategories';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
}

interface ExerciseSelectionDialogContentProps {
  exercises: Exercise[];
  onSelectExercise: (exerciseId: string) => void;
  onClose: () => void;
  onExercisesUpdate?: (exercises: Exercise[]) => void;
}

export const ExerciseSelectionDialogContent: React.FC<ExerciseSelectionDialogContentProps> = ({
  exercises: initialExercises,
  onSelectExercise,
  onClose,
  onExercisesUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);

  // Handle real-time exercise updates
  const { currentExercises } = useExerciseRealtime(
    initialExercises,
    (newExercise) => {
      console.log('🎯 Real-time exercise received, adding with categories:', newExercise.name);
      addExerciseWithCategories(newExercise);
      // Notify parent about the updated exercises list
      if (onExercisesUpdate) {
        onExercisesUpdate([...exercisesWithCategories, newExercise]);
      }
    }
  );

  // Handle exercises with categories
  const { exercisesWithCategories, addExerciseWithCategories } = useExerciseWithCategories(currentExercises);

  const filteredExercises = useMemo(() => {
    let filtered = exercisesWithCategories;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(exercise => {
        if (!exercise.categories || exercise.categories.length === 0) {
          return false;
        }
        // Check if exercise has ANY of the selected categories
        return selectedCategories.some(selectedCat => 
          exercise.categories!.some(exerciseCat => 
            exerciseCat.toLowerCase() === selectedCat.toLowerCase()
          )
        );
      });
    }

    return filtered;
  }, [exercisesWithCategories, searchTerm, selectedCategories]);

  const handleSelectExercise = (exerciseId: string) => {
    onSelectExercise(exerciseId);
    onClose();
    setSearchTerm('');
    setSelectedCategories([]);
  };

  const handleExerciseAdded = () => {
    // Close the add exercise dialog
    setAddExerciseDialogOpen(false);
    console.log('✅ Exercise added successfully - real-time update should show it automatically');
    
    // Note: The real-time subscription will handle updating the exercises list
    // and calling onExercisesUpdate if provided
  };

  return (
    <>
      <DialogContent className="rounded-none max-w-6xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Επιλογή Άσκησης ({exercisesWithCategories.length} διαθέσιμες)
            </div>
            <Button
              onClick={() => setAddExerciseDialogOpen(true)}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Προσθήκη Άσκησης
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Filters - Horizontal Layout */}
          <div className="flex gap-4">
            <ExerciseSearchInput
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />

            {/* Filters */}
            <div className="w-[30%]">
              <ExerciseFilters
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
              />
            </div>
          </div>
          
          {/* Exercise List */}
          <div className="max-h-96 overflow-y-auto border rounded-none">
            <ExerciseGrid
              exercises={filteredExercises}
              onSelectExercise={handleSelectExercise}
              selectedCategories={selectedCategories}
              searchTerm={searchTerm}
            />
          </div>
        </div>
      </DialogContent>

      <AddExerciseDialog
        open={addExerciseDialogOpen}
        onOpenChange={setAddExerciseDialogOpen}
        onSuccess={handleExerciseAdded}
      />
    </>
  );
};
