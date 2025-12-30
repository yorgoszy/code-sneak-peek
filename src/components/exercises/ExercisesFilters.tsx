
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
              {formatCategoryName(category)}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      {showFilters && (
        <div className="bg-white p-4 border rounded-none space-y-4">
          <h3 className="font-medium text-gray-900">Φίλτρα Κατηγοριών</h3>
          <p className="text-sm text-gray-600">Επιλογή Κατηγοριών (πολλαπλή επιλογή)</p>
          
          {loadingCategories ? (
            <p className="text-xs text-gray-500">Φόρτωση κατηγοριών...</p>
          ) : (
            <div className="space-y-4">
              {rows.map((rowCategories, rowIndex) => (
                rowCategories.length > 0 && (
                  <div key={rowIndex} className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {rowLabels[rowIndex]}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {rowCategories.map(category => (
                        <div 
                          key={category.id} 
                          className={`px-3 py-2 border cursor-pointer transition-colors hover:bg-gray-100 ${
                            selectedCategories.includes(category.name) 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={() => onCategoryToggle(category.name)}
                        >
                          <span className="text-sm select-none font-medium">
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
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Equipment
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {equipmentCategories.map(category => (
                      <div 
                        key={category.id} 
                        className={`px-3 py-2 border cursor-pointer transition-colors hover:bg-gray-100 ${
                          selectedCategories.includes(category.name) 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-white border-gray-200'
                        }`}
                        onClick={() => onCategoryToggle(category.name)}
                      >
                        <span className="text-sm select-none font-medium">
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
