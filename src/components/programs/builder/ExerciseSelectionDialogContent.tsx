
import React, { useState, useMemo, useEffect } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Filter, Plus } from "lucide-react";
import { ExerciseFilters } from './ExerciseFilters';
import { ExerciseSearchInput } from './ExerciseSearchInput';
import { ExerciseGrid } from './ExerciseGrid';
import { AddExerciseDialog } from '@/components/AddExerciseDialog';
import { supabase } from '@/integrations/supabase/client';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
}

interface ExerciseWithCategories extends Exercise {
  categories?: string[];
}

interface ExerciseSelectionDialogContentProps {
  exercises: Exercise[];
  onSelectExercise: (exerciseId: string) => void;
  onClose: () => void;
}

export const ExerciseSelectionDialogContent: React.FC<ExerciseSelectionDialogContentProps> = ({
  exercises: initialExercises,
  onSelectExercise,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [exercisesWithCategories, setExercisesWithCategories] = useState<ExerciseWithCategories[]>([]);
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>(initialExercises);

  // Update current exercises when initial exercises change
  useEffect(() => {
    setCurrentExercises(initialExercises);
  }, [initialExercises]);

  // Set up real-time subscription for exercises
  useEffect(() => {
    console.log('🔄 Setting up real-time subscription for exercises...');
    
    const exercisesSubscription = supabase
      .channel('exercises-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'exercises'
        },
        async (payload) => {
          console.log('✅ New exercise added via realtime:', payload.new);
          
          // Add the new exercise to the current list immediately
          const newExercise = payload.new as Exercise;
          setCurrentExercises(prev => {
            // Check if exercise already exists to avoid duplicates
            const exists = prev.some(ex => ex.id === newExercise.id);
            if (exists) return prev;
            return [...prev, newExercise];
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up exercises subscription...');
      supabase.removeChannel(exercisesSubscription);
    };
  }, []);

  // Fetch exercise categories when exercises change
  useEffect(() => {
    if (currentExercises.length > 0) {
      fetchExerciseCategories();
    }
  }, [currentExercises]);

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
        setExercisesWithCategories(currentExercises);
        return;
      }

      // Map exercises with their categories
      const exercisesWithCats = currentExercises.map(exercise => {
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
      setExercisesWithCategories(currentExercises);
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
    onClose();
    setSearchTerm('');
    setSelectedCategories([]);
  };

  const handleExerciseAdded = () => {
    // Just close the add exercise dialog - the real-time subscription will handle the update
    setAddExerciseDialogOpen(false);
    console.log('✅ Exercise added successfully - waiting for real-time update...');
  };

  return (
    <>
      <DialogContent className="rounded-none max-w-6xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Επιλογή Άσκησης
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
