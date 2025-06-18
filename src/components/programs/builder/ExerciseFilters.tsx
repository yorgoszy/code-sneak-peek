
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ExerciseFiltersProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

export const ExerciseFilters: React.FC<ExerciseFiltersProps> = ({
  selectedCategories,
  onCategoryChange
}) => {
  const filterCategories = {
    'Περιοχή Σώματος': ['upper body', 'lower body', 'total body', 'core'],
    'Κίνηση': ['push', 'pull', 'rotational', 'hip dominant', 'knee dominant'],
    'Κατεύθυνση': ['vertical', 'horizontal', 'linear', 'lateral'],
    'Πλευρικότητα': ['bilateral', 'unilateral', 'ipsilateral'],
    'Τύπος': ['mobility', 'stability', 'activation', 'integration', 'movement', 'plyometric', 'med ball', 'power', 'strength', 'endurance', 'cardio', 'balance', 'coordination', 'flexibility', 'recovery', 'warm up', 'cool down']
  };

  const handleCategorySelect = (category: string) => {
    if (!selectedCategories.includes(category)) {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const handleCategoryRemove = (category: string) => {
    onCategoryChange(selectedCategories.filter(c => c !== category));
  };

  return (
    <div className="space-y-2">
      <Select onValueChange={handleCategorySelect}>
        <SelectTrigger className="w-full rounded-none text-xs h-8">
          <SelectValue placeholder="Επιλέξτε κατηγορία..." />
        </SelectTrigger>
        <SelectContent className="rounded-none">
          {Object.entries(filterCategories).map(([groupName, categories]) => (
            <div key={groupName}>
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100">
                {groupName}
              </div>
              {categories
                .filter(cat => !selectedCategories.includes(cat))
                .map(category => (
                  <SelectItem key={category} value={category} className="rounded-none text-xs">
                    {category}
                  </SelectItem>
                ))}
            </div>
          ))}
        </SelectContent>
      </Select>

      {selectedCategories.length > 0 && (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {selectedCategories.map(category => (
              <Badge
                key={category}
                variant="secondary"
                className="bg-[#00ffba] text-black rounded-none flex items-center gap-1 cursor-pointer hover:bg-[#00ffba]/90 text-xs px-1 py-0.5"
                onClick={() => handleCategoryRemove(category)}
              >
                {category}
                <X className="w-3 h-3" />
              </Badge>
            ))}
            <button
              onClick={() => onCategoryChange([])}
              className="text-xs text-gray-500 hover:text-gray-700 px-1 py-0.5 border border-gray-300 rounded-none hover:bg-gray-100"
            >
              Καθαρισμός
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
