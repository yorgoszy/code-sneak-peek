
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { categoryRows, categoryRowLabels } from "@/utils/categoryRows";

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
  // Capitalize first letter, lowercase the rest
  const formatCategoryName = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // Organize categories into rows
  const getCategorizedRows = () => {
    const allCategoryNames = categoryRows.flat();
    const filteredCategories = categories.filter(cat => cat.name !== "ζορ");
    
    const rows = categoryRows.map(rowNames => 
      rowNames
        .map(name => filteredCategories.find(cat => cat.name.toLowerCase() === name.toLowerCase()))
        .filter(Boolean) as Category[]
    );
    
    // Equipment row: all categories not in previous rows
    const equipmentCategories = filteredCategories.filter(cat => 
      !allCategoryNames.some(name => name.toLowerCase() === cat.name.toLowerCase())
    );
    
    return { rows, equipmentCategories };
  };

  const { rows, equipmentCategories } = getCategorizedRows();

  const rowLabels = [
    "Περιοχή Σώματος",
    "Τύπος Κίνησης",
    "Κατεύθυνση",
    "Στάση",
    "Dominance / Anti",
    "Τύπος Προπόνησης",
    "Equipment"
  ];

  return (
    <div className="mb-3 space-y-2">
      {/* Search and filter controls - stack on mobile */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Αναζήτηση..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm rounded-none w-full"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFilters}
            className="rounded-none h-8 text-xs flex-1 sm:flex-none"
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            Φίλτρα {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="rounded-none h-8 text-xs"
            >
              <X className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Καθαρισμός</span>
            </Button>
          )}
        </div>
      </div>

      {/* Selected categories display */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedCategories.map(category => (
            <Badge 
              key={category} 
              variant="secondary" 
              className="cursor-pointer text-xs py-0 px-1.5 h-5"
              onClick={() => onCategoryToggle(category)}
            >
              {formatCategoryName(category)}
              <X className="h-2.5 w-2.5 ml-0.5" />
            </Badge>
          ))}
        </div>
      )}

      {showFilters && (
        <div className="bg-white p-2 sm:p-3 border rounded-none space-y-2 max-h-[50vh] overflow-y-auto">
          {loadingCategories ? (
            <p className="text-xs text-gray-500">Φόρτωση...</p>
          ) : (
            <div className="space-y-2">
              {rows.map((rowCategories, rowIndex) => (
                rowCategories.length > 0 && (
                  <div key={rowIndex} className="space-y-1">
                    <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                      {rowLabels[rowIndex]}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {rowCategories.map(category => (
                        <div 
                          key={category.id} 
                          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 border cursor-pointer transition-colors hover:bg-gray-100 ${
                            selectedCategories.includes(category.name) 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={() => onCategoryToggle(category.name)}
                        >
                          <span className="text-[10px] sm:text-xs select-none">
                            {formatCategoryName(category.name)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
              
              {/* Equipment Row */}
              {equipmentCategories.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    Equipment
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {equipmentCategories.map(category => (
                      <div 
                        key={category.id} 
                        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 border cursor-pointer transition-colors hover:bg-gray-100 ${
                          selectedCategories.includes(category.name) 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-white border-gray-200'
                        }`}
                        onClick={() => onCategoryToggle(category.name)}
                      >
                        <span className="text-[10px] sm:text-xs select-none">
                          {formatCategoryName(category.name)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
