
import React from 'react';

interface FilterSectionProps {
  title: string;
  categories: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  categories,
  selectedCategories,
  onCategoryToggle
}) => {
  return (
    <div className="bg-white p-3 rounded-none border">
      <div className="font-medium text-xs text-gray-800 mb-2">{title}</div>
      <div className="space-y-1">
        {categories.map(category => {
          const isSelected = selectedCategories.includes(category);
          return (
            <div
              key={category}
              className={`text-xs p-2 rounded-none cursor-pointer transition-colors ${
                isSelected 
                  ? 'bg-[#00ffba] text-black' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => onCategoryToggle(category)}
            >
              {category}
            </div>
          );
        })}
      </div>
    </div>
  );
};
