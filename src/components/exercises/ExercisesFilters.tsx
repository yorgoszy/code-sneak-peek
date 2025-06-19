
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface ExercisesFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategories: string[];
  onCategoryToggle: (categoryName: string) => void;
  categories: Category[];
  loadingCategories: boolean;
  showFilters: boolean;
  onToggleFilters: () => void;
  onResetFilters: () => void;
  activeFiltersCount: number;
}

export const ExercisesFilters: React.FC<ExercisesFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategories,
  onCategoryToggle,
  categories,
  loadingCategories,
  showFilters,
  onToggleFilters,
  onResetFilters,
  activeFiltersCount
}) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Αναζήτηση ασκήσεων..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-none"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className="rounded-none"
        >
          <Filter className="h-4 w-4 mr-2" />
          Φίλτρα {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            onClick={onResetFilters}
            className="rounded-none text-sm"
          >
            Καθαρισμός
          </Button>
        )}
      </div>

      {/* Selected categories display */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map(category => (
            <Badge 
              key={category} 
              variant="secondary" 
              className="cursor-pointer"
              onClick={() => onCategoryToggle(category)}
            >
              {category}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      {showFilters && (
        <div className="bg-white p-4 border rounded space-y-4">
          <h3 className="font-medium text-gray-900">Φίλτρα Κατηγοριών</h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Επιλογή Κατηγοριών (πολλαπλή επιλογή)
              </label>
              {loadingCategories ? (
                <p className="text-xs text-gray-500">Φόρτωση κατηγοριών...</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {categories
                    .filter(cat => cat.name !== "ζορ")
                    .map(category => (
                      <div 
                        key={category.id} 
                        className={`p-3 border cursor-pointer transition-colors hover:bg-gray-100 ${
                          selectedCategories.includes(category.name) 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-white border-gray-200'
                        }`}
                        onClick={() => onCategoryToggle(category.name)}
                      >
                        <span className="text-sm select-none font-medium">
                          {category.name}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
