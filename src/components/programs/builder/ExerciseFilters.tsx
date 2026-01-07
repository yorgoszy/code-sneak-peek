
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface ExerciseFiltersProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

// Κατηγορίες οργανωμένες σε σειρές (ίδιο με AddExerciseDialog)
const categoryRows = [
  ["upper body", "lower body", "total body"],
  ["push", "pull", "rotational", "antirotation", "antirotational", "antiextention", "antiflexion"],
  ["vertical", "horizontal", "linear", "lateral"],
  ["bilateral", "unilateral", "ipsilateral"],
  ["hip dominate", "knee dominate"],
  ["mobility", "stability", "activation", "intergration", "movement", "neural activation", "plyometric", "power", "strength", "endurance", "accesory", "oly lifting", "strongman", "core", "cardio"],
];

const rowLabels = [
  "Περιοχή Σώματος",
  "Τύπος Κίνησης",
  "Κατεύθυνση",
  "Στάση",
  "Dominance",
  "Τύπος Προπόνησης",
  "Equipment"
];

export const ExerciseFilters: React.FC<ExerciseFiltersProps> = ({
  selectedCategories,
  onCategoryChange
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercise_categories')
        .select('*')
        .order('type, name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      onCategoryChange(selectedCategories.filter(c => c !== categoryName));
    } else {
      onCategoryChange([...selectedCategories, categoryName]);
    }
  };

  const handleCategoryRemove = (category: string) => {
    onCategoryChange(selectedCategories.filter(c => c !== category));
  };

  const formatCategoryName = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const getCategorizedRows = () => {
    const allCategoryNames = categoryRows.flat();
    const filteredCategories = categories.filter(cat => cat.name !== "ζορ");
    
    const rows = categoryRows.map(rowNames => 
      rowNames
        .map(name => filteredCategories.find(cat => cat.name.toLowerCase() === name.toLowerCase()))
        .filter(Boolean) as Category[]
    );
    
    const equipmentCategories = filteredCategories.filter(cat => 
      !allCategoryNames.some(name => name.toLowerCase() === cat.name.toLowerCase())
    );
    
    return { rows, equipmentCategories };
  };

  const { rows, equipmentCategories } = getCategorizedRows();

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 h-8 border bg-background hover:bg-accent text-[11px]"
      >
        <span className="text-muted-foreground truncate">
          {selectedCategories.length > 0 
            ? `${selectedCategories.length} επιλεγμένες` 
            : 'Επιλέξτε κατηγορία...'}
        </span>
        {isOpen ? <ChevronUp className="w-3 h-3 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 flex-shrink-0" />}
      </button>
      
      {/* Dropdown Content - Absolute positioned */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 border bg-background p-2 max-h-[300px] overflow-y-auto shadow-lg">
          {loading ? (
            <p className="text-[10px] text-gray-500">Φόρτωση...</p>
          ) : (
            <div className="space-y-1.5">
              {rows.map((rowCategories, rowIndex) => (
                rowCategories.length > 0 && (
                  <div key={rowIndex}>
                    <h4 className="text-[9px] font-medium text-gray-500 mb-0.5">{rowLabels[rowIndex]}</h4>
                    <div className="flex flex-wrap gap-1">
                      {rowCategories.map(category => (
                        <span 
                          key={category.id} 
                          className={`px-1 cursor-pointer transition-colors text-[10px] select-none ${
                            selectedCategories.includes(category.name.toLowerCase()) 
                              ? 'bg-[#00ffba] text-black font-medium' 
                              : 'text-gray-700 hover:text-black hover:bg-gray-100'
                          }`}
                          onClick={() => handleCategoryClick(category.name.toLowerCase())}
                        >
                          {formatCategoryName(category.name)}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              ))}
              
              {equipmentCategories.length > 0 && (
                <div>
                  <h4 className="text-[9px] font-medium text-gray-500 mb-0.5">{rowLabels[6]}</h4>
                  <div className="flex flex-wrap gap-1">
                    {equipmentCategories.map(category => (
                      <span 
                        key={category.id} 
                        className={`px-1 cursor-pointer transition-colors text-[10px] select-none ${
                          selectedCategories.includes(category.name.toLowerCase()) 
                            ? 'bg-[#00ffba] text-black font-medium' 
                            : 'text-gray-700 hover:text-black hover:bg-gray-100'
                        }`}
                        onClick={() => handleCategoryClick(category.name.toLowerCase())}
                      >
                        {formatCategoryName(category.name)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected categories badges */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selectedCategories.map(category => (
            <Badge
              key={category}
              variant="secondary"
              className="bg-[#00ffba] text-black rounded-none flex items-center gap-0.5 cursor-pointer hover:bg-[#00ffba]/90 text-[9px] px-1 py-0 h-4"
              onClick={() => handleCategoryRemove(category)}
            >
              {formatCategoryName(category)}
              <X className="w-2 h-2" />
            </Badge>
          ))}
          <button
            onClick={() => onCategoryChange([])}
            className="text-[9px] text-gray-500 hover:text-gray-700 px-1 h-4 border border-gray-300 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
