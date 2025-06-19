
import { useState, useEffect, useMemo } from 'react';

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  categories: { name: string; type: string }[];
}

export const useExerciseFilters = (exercises: Exercise[]) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filteredExercises = useMemo(() => {
    console.log('Applying filters:', { searchQuery, selectedCategories });
    console.log('Total exercises:', exercises.length);
    
    let filtered = exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.categories.some(cat => 
          cat.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      return matchesSearch;
    });

    console.log('After search filter:', filtered.length);

    if (selectedCategories.length > 0) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(exercise =>
        selectedCategories.some(selectedCategory => 
          exercise.categories.some(cat => cat.name === selectedCategory)
        )
      );
      console.log(`After category filter (${selectedCategories.join(', ')}):`, filtered.length, 'from', beforeFilter);
    }

    console.log('Final filtered exercises:', filtered.length);
    return filtered;
  }, [exercises, searchQuery, selectedCategories]);

  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(cat => cat !== categoryName)
        : [...prev, categoryName]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSearchQuery("");
  };

  const activeFiltersCount = selectedCategories.length + (searchQuery ? 1 : 0);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategories,
    showFilters,
    setShowFilters,
    filteredExercises,
    handleCategoryToggle,
    resetFilters,
    activeFiltersCount
  };
};
