
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  // Row 1: Body Part
  ["upper body", "lower body", "total body"],
  // Row 2: Movement Type
  ["push", "pull", "rotational", "antirotation", "antirotational", "antiextention", "antiflexion"],
  // Row 3: Direction
  ["vertical", "horizontal", "linear", "lateral"],
  // Row 4: Stance
  ["bilateral", "unilateral", "ipsilateral"],
  // Row 5: Dominance
  ["hip dominate", "knee dominate"],
  // Row 6: Training Type
  ["mobility", "stability", "activation", "intergration", "movement", "neural activation", "plyometric", "power", "strength", "endurance", "accesory", "oly lifting", "strongman", "core", "cardio"],
  // Row 7: Equipment - θα είναι όλα τα υπόλοιπα
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

      if (error) {
        console.error('Categories fetch error:', error);
        throw error;
      }
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

  // Capitalize first letter
  const formatCategoryName = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // Οργάνωση κατηγοριών σε σειρές
  const getCategorizedRows = () => {
    const allCategoryNames = categoryRows.flat();
    const filteredCategories = categories.filter(cat => cat.name !== "ζορ");
    
    // Βρες τις κατηγορίες για κάθε σειρά
    const rows = categoryRows.map(rowNames => 
      rowNames
        .map(name => filteredCategories.find(cat => cat.name.toLowerCase() === name.toLowerCase()))
        .filter(Boolean) as Category[]
    );
    
    // Equipment row: όλες οι κατηγορίες που δεν είναι στις προηγούμενες σειρές
    const equipmentCategories = filteredCategories.filter(cat => 
      !allCategoryNames.some(name => name.toLowerCase() === cat.name.toLowerCase())
    );
    
    return { rows, equipmentCategories };
  };

  const { rows, equipmentCategories } = getCategorizedRows();

  return (
    <div className="space-y-1">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-1.5 h-8 border bg-background hover:bg-accent text-[11px]">
          <span className="text-muted-foreground">
            {selectedCategories.length > 0 
              ? `${selectedCategories.length} επιλεγμένες` 
              : 'Επιλέξτε κατηγορία...'}
          </span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="border border-t-0 bg-background p-2 max-h-[300px] overflow-y-auto z-50">
          {loading ? (
            <p className="text-[10px] text-gray-500">Φόρτωση...</p>
          ) : (
            <div className="space-y-1.5">
              {rows.map((rowCategories, rowIndex) => (
                rowCategories.length > 0 && (
                  <div key={rowIndex} className="border-b pb-1">
                    <h4 className="text-[9px] font-medium text-gray-500 mb-0.5">{rowLabels[rowIndex]}</h4>
                    <div className="flex flex-wrap gap-0.5">
                      {rowCategories.map(category => (
                        <div 
                          key={category.id} 
                          className={`px-1.5 py-0 border cursor-pointer transition-colors hover:bg-gray-100 ${
                            selectedCategories.includes(category.name.toLowerCase()) 
                              ? 'bg-[#00ffba]/20 border-[#00ffba] text-black' 
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={() => handleCategoryClick(category.name.toLowerCase())}
                        >
                          <span className="text-[10px] select-none leading-tight">{formatCategoryName(category.name)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
              
              {/* Equipment Row */}
              {equipmentCategories.length > 0 && (
                <div className="border-b pb-1">
                  <h4 className="text-[9px] font-medium text-gray-500 mb-0.5">{rowLabels[6]}</h4>
                  <div className="flex flex-wrap gap-0.5">
                    {equipmentCategories.map(category => (
                      <div 
                        key={category.id} 
                        className={`px-1.5 py-0 border cursor-pointer transition-colors hover:bg-gray-100 ${
                          selectedCategories.includes(category.name.toLowerCase()) 
                            ? 'bg-[#00ffba]/20 border-[#00ffba] text-black' 
                            : 'bg-white border-gray-200'
                        }`}
                        onClick={() => handleCategoryClick(category.name.toLowerCase())}
                      >
                        <span className="text-[10px] select-none leading-tight">{formatCategoryName(category.name)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedCategories.map(category => (
            <Badge
              key={category}
              variant="secondary"
              className="bg-[#00ffba] text-black rounded-none flex items-center gap-1 cursor-pointer hover:bg-[#00ffba]/90 text-[10px] px-1 py-0"
              onClick={() => handleCategoryRemove(category)}
            >
              {formatCategoryName(category)}
              <X className="w-2.5 h-2.5" />
            </Badge>
          ))}
          <button
            onClick={() => onCategoryChange([])}
            className="text-[10px] text-gray-500 hover:text-gray-700 px-1 py-0 border border-gray-300 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
