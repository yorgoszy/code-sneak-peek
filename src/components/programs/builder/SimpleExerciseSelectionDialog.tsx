
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Play, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { matchesSearchTerm } from "@/lib/utils";
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseFilters } from './ExerciseFilters';
import { useExerciseWithCategories } from './hooks/useExerciseWithCategories';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
}

interface SimpleExerciseSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: Exercise[];
  onSelectExercise: (exerciseId: string) => void;
}

export const SimpleExerciseSelectionDialog: React.FC<SimpleExerciseSelectionDialogProps> = ({
  open,
  onOpenChange,
  exercises,
  onSelectExercise
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Handle exercises with categories
  const { exercisesWithCategories } = useExerciseWithCategories(exercises);

  const filteredExercises = useMemo(() => {
    let filtered = exercisesWithCategories;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(exercise => matchesSearchTerm(exercise.name, searchTerm));
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

  const handleSelect = (exerciseId: string) => {
    onSelectExercise(exerciseId);
    onOpenChange(false);
    setSearchTerm('');
    setSelectedCategories([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] rounded-none flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-sm">Επιλογή Άσκησης</DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-none opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Search and Filters - Always in one row */}
          <div className="grid grid-cols-2 gap-2 mb-2 flex-shrink-0 pr-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Αναζήτηση άσκησης..."
                className="pl-8 rounded-none h-8 text-xs"
              />
            </div>
            <ExerciseFilters
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
              closeOnClickOutside
            />
          </div>

          {/* Exercise List */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="grid grid-cols-2 gap-2 pr-3">
              {filteredExercises.map(exercise => {
                const hasValidVideo = exercise.video_url && isValidVideoUrl(exercise.video_url);
                const thumbnailUrl = hasValidVideo ? getVideoThumbnail(exercise.video_url!) : null;
                
                return (
                  <Button
                    key={exercise.id}
                    variant="outline"
                    className="h-auto py-2 px-3 rounded-none justify-start text-left"
                    onClick={() => handleSelect(exercise.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {/* Video Thumbnail */}
                      {hasValidVideo && thumbnailUrl ? (
                        <div className="w-8 h-6 rounded-none overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={thumbnailUrl}
                            alt={`${exercise.name} thumbnail`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<svg class="w-3 h-3 text-[#00ffba]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
                                parent.className = 'w-8 h-6 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0';
                              }
                            }}
                          />
                        </div>
                      ) : hasValidVideo ? (
                        <div className="w-8 h-6 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Play className="w-3 h-3 text-[#00ffba]" />
                        </div>
                      ) : null}
                      <span className="text-xs truncate">{exercise.name}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
            
            {filteredExercises.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                {selectedCategories.length > 0 || searchTerm 
                  ? 'Δεν βρέθηκαν ασκήσεις που να ταιριάζουν με τα κριτήρια'
                  : 'Δεν βρέθηκαν ασκήσεις'
                }
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
