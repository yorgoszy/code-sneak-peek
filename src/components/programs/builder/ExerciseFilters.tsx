
import React from 'react';
import { FilterSection } from './FilterSection';

interface ExerciseFiltersProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

export const ExerciseFilters: React.FC<ExerciseFiltersProps> = ({
  selectedCategories,
  onCategoryChange
}) => {
  const filterCategories = {
    'Περιοχή Σώματος': ['upper body', 'lower body', 'core'],
    'Κίνηση': ['push', 'pull', 'hip dominant', 'knee dominant'],
    'Κατεύθυνση': ['vertical', 'horizontal'],
    'Πλευρικότητα': ['bilateral', 'unilateral'],
    'Τύπος': ['stability', 'mobility', 'plyometric']
  };

  const handleCategoryToggle = (category: string) => {
    const isSelected = selectedCategories.includes(category);
    if (isSelected) {
      onCategoryChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-none border">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Φίλτρα Ασκήσεων</h4>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(filterCategories).map(([groupName, categories]) => (
          <FilterSection
            key={groupName}
            title={groupName}
            categories={categories}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
          />
        ))}
      </div>
      {selectedCategories.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Ενεργά φίλτρα:</span>
            <div className="flex flex-wrap gap-1">
              {selectedCategories.map(category => (
                <span
                  key={category}
                  className="inline-flex items-center gap-1 bg-[#00ffba] text-black text-xs px-2 py-1 rounded-none cursor-pointer"
                  onClick={() => handleCategoryToggle(category)}
                >
                  {category}
                  <span className="text-xs">×</span>
                </span>
              ))}
            </div>
            <button
              onClick={() => onCategoryChange([])}
              className="text-xs text-gray-500 hover:text-gray-700 ml-2"
            >
              Καθαρισμός όλων
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
