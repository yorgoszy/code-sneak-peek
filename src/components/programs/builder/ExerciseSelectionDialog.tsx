
import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Exercise } from '../types';
import { Search, Filter } from "lucide-react";
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseFilters } from './ExerciseFilters';
import { supabase } from '@/integrations/supabase/client';

interface ExerciseSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: Exercise[];
  onSelectExercise: (exerciseId: string) => void;
}

interface ExerciseWithCategories extends Exercise {
  categories?: string[];
}

export const ExerciseSelectionDialog: React.FC<ExerciseSelectionDialogProps> = ({
  open,
  onOpenChange,
  exercises,
  onSelectExercise
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [exercisesWithCategories, setExercisesWithCategories] = useState<ExerciseWithCategories[]>([]);

  // Fetch exercise categories when dialog opens
  useEffect(() => {
    if (open && exercises.length > 0) {
      fetchExerciseCategories();
    }
  }, [open, exercises]);

  const fetchExerciseCategories = async () => {
    try {
      // Fetch exercise categories from the database
      const { data: exerciseCategories, error } = await supabase
        .from('exercise_to_category')
        .select(`
          exercise_id,
          exercise_categories!inner(name)
        `);

      if (error) {
        console.error('Error fetching exercise categories:', error);
        setExercisesWithCategories(exercises);
        return;
      }

      // Map exercises with their categories
      const exercisesWithCats = exercises.map(exercise => {
        const exerciseCats = exerciseCategories
          .filter(ec => ec.exercise_id === exercise.id)
          .map(ec => ec.exercise_categories?.name)
          .filter(Boolean) as string[];
        
        return {
          ...exercise,
          categories: exerciseCats
        };
      });

      setExercisesWithCategories(exercisesWithCats);
    } catch (error) {
      console.error('Error processing exercise categories:', error);
      setExercisesWithCategories(exercises);
    }
  };

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
    onOpenChange(false);
    setSearchTerm('');
    setSelectedCategories([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchTerm('');
    setSelectedCategories([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-none max-w-6xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Επιλογή Άσκησης
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Filters - Horizontal Layout */}
          <div className="flex gap-4">
            {/* Search */}
            <div className="relative w-[30%]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <Input
                placeholder="Αναζήτηση άσκησης..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-none h-8"
              />
            </div>

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
            {filteredExercises.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                {filteredExercises.map((exercise) => {
                  const videoUrl = exercise.video_url;
                  const hasValidVideo = videoUrl && isValidVideoUrl(videoUrl);
                  const thumbnailUrl = hasValidVideo ? getVideoThumbnail(videoUrl) : null;
                  
                  return (
                    <div
                      key={exercise.id}
                      className="border rounded-none p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectExercise(exercise.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{exercise.name}</h4>
                          {exercise.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {exercise.description}
                            </p>
                          )}
                          {exercise.categories && exercise.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {exercise.categories.slice(0, 3).map((category, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-[#00ffba] text-black px-1 py-0.5 rounded-none"
                                >
                                  {category}
                                </span>
                              ))}
                              {exercise.categories.length > 3 && (
                                <span className="text-xs text-gray-500">+{exercise.categories.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Video Thumbnail */}
                        <div className="flex-shrink-0">
                          {hasValidVideo && thumbnailUrl ? (
                            <div className="w-16 h-12 rounded-none overflow-hidden bg-gray-100">
                              <img
                                src={thumbnailUrl}
                                alt={`${exercise.name} video thumbnail`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="hidden w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-400">Video</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-16 h-12 rounded-none bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-400">-</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {selectedCategories.length > 0 || searchTerm 
                  ? 'Δεν βρέθηκαν ασκήσεις που να ταιριάζουν με τα κριτήρια'
                  : 'Δεν βρέθηκαν ασκήσεις'
                }
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
