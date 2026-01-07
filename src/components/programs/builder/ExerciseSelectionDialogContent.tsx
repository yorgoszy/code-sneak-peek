
import React, { useState, useMemo } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Filter, Plus, X, Save, FolderOpen } from "lucide-react";
import { ExerciseFilters } from './ExerciseFilters';
import { ExerciseSearchInput } from './ExerciseSearchInput';
import { ExerciseGrid } from './ExerciseGrid';
import { ExerciseCard } from './ExerciseCard';
import { AddExerciseDialog } from '@/components/AddExerciseDialog';
import { CreateBlockTemplateDialog } from './CreateBlockTemplateDialog';
import { SelectBlockTemplateDialog } from './SelectBlockTemplateDialog';
import { useExerciseRealtime } from './hooks/useExerciseRealtime';
import { useExerciseWithCategories } from './hooks/useExerciseWithCategories';
import { matchesSearchTerm } from "@/lib/utils";

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
  onSelectBlockTemplate?: (template: any) => void;
}

export const ExerciseSelectionDialogContent: React.FC<ExerciseSelectionDialogContentProps> = ({
  exercises: initialExercises,
  onSelectExercise,
  onClose,
  onExercisesUpdate,
  onSelectBlockTemplate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [createTemplateDialogOpen, setCreateTemplateDialogOpen] = useState(false);
  const [selectTemplateDialogOpen, setSelectTemplateDialogOpen] = useState(false);

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
        matchesSearchTerm(exercise.name, searchTerm)
      );
    }

    // Category filter - AND logic: exercise must have ALL selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(exercise => {
        if (!exercise.categories || exercise.categories.length === 0) {
          return false;
        }
        // Check if exercise has ALL of the selected categories
        return selectedCategories.every(selectedCat => 
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
  };

  const handleSelectTemplate = (template: any) => {
    if (onSelectBlockTemplate) {
      onSelectBlockTemplate(template);
      onClose();
    }
  };

  return (
    <>
      <DialogContent className="rounded-none max-w-6xl w-[95vw] md:w-[90vw] lg:w-auto max-h-[90vh] sm:max-h-[80vh] p-3 sm:p-4 md:p-6 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate">Επιλογή Άσκησης ({exercisesWithCategories.length})</span>
              </div>
              <Button
                onClick={onClose}
                variant="destructive"
                className="rounded-none"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1 flex-nowrap">
              <Button
                onClick={() => setAddExerciseDialogOpen(true)}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none h-7 px-2 text-xs"
                size="sm"
              >
                <Plus className="w-3 h-3 mr-0.5" />
                <span>Άσκηση</span>
              </Button>
              <Button
                onClick={() => setCreateTemplateDialogOpen(true)}
                variant="outline"
                className="rounded-none h-7 px-2 text-xs"
                size="sm"
              >
                <Save className="w-3 h-3 mr-0.5" />
                <span>Template</span>
              </Button>
              <Button
                onClick={() => setSelectTemplateDialogOpen(true)}
                variant="outline"
                className="rounded-none h-7 px-2 text-xs"
                size="sm"
              >
                <FolderOpen className="w-3 h-3 mr-0.5" />
                <span>Templates</span>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Exercise List with Search at top */}
          <div className="flex-1 min-h-0 overflow-y-auto border rounded-none">
            <div className="p-2">
              {/* Search and Filters - Always in one row */}
              <div className="grid grid-cols-2 gap-2 mb-2 sticky top-0 bg-background z-10 pb-2">
                <ExerciseSearchInput
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
                <ExerciseFilters
                  selectedCategories={selectedCategories}
                  onCategoryChange={setSelectedCategories}
                />
              </div>
              
              {/* Exercise Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredExercises.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    {selectedCategories.length > 0 || searchTerm 
                      ? 'Δεν βρέθηκαν ασκήσεις που να ταιριάζουν με τα κριτήρια'
                      : 'Δεν βρέθηκαν ασκήσεις'
                    }
                  </div>
                ) : (
                  filteredExercises.map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onSelect={handleSelectExercise}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      <AddExerciseDialog
        open={addExerciseDialogOpen}
        onOpenChange={setAddExerciseDialogOpen}
        onSuccess={handleExerciseAdded}
      />

      <CreateBlockTemplateDialog
        open={createTemplateDialogOpen}
        onOpenChange={setCreateTemplateDialogOpen}
      />

      <SelectBlockTemplateDialog
        open={selectTemplateDialogOpen}
        onOpenChange={setSelectTemplateDialogOpen}
        onSelectTemplate={handleSelectTemplate}
      />
    </>
  );
};
