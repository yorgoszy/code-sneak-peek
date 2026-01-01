import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FoodItem {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  category?: string;
  portion_size?: number;
  portion_unit?: string;
}

interface FoodSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (food: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
}

export const FoodSelectionDialog: React.FC<FoodSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelectFood
}) => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (isOpen) {
      fetchFoods();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const normalizedSearch = normalizeGreek(searchTerm.toLowerCase());
      const filtered = foods.filter(food => 
        normalizeGreek(food.name.toLowerCase()).includes(normalizedSearch) ||
        (food.category && normalizeGreek(food.category.toLowerCase()).includes(normalizedSearch))
      );
      setFilteredFoods(filtered);
    } else {
      setFilteredFoods(foods);
    }
  }, [searchTerm, foods]);

  // Normalize Greek characters (remove accents)
  const normalizeGreek = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ά/g, 'α').replace(/έ/g, 'ε').replace(/ή/g, 'η')
      .replace(/ί/g, 'ι').replace(/ό/g, 'ο').replace(/ύ/g, 'υ').replace(/ώ/g, 'ω')
      .replace(/Ά/g, 'Α').replace(/Έ/g, 'Ε').replace(/Ή/g, 'Η')
      .replace(/Ί/g, 'Ι').replace(/Ό/g, 'Ο').replace(/Ύ/g, 'Υ').replace(/Ώ/g, 'Ω');
  };

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setFoods(data || []);
      setFilteredFoods(data || []);
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = (food: FoodItem) => {
    const qty = quantity[food.id] || 100;
    const multiplier = qty / 100;
    
    onSelectFood({
      name: food.name,
      quantity: qty,
      unit: 'g',
      calories: Math.round(food.calories_per_100g * multiplier),
      protein: Math.round(food.protein_per_100g * multiplier * 10) / 10,
      carbs: Math.round(food.carbs_per_100g * multiplier * 10) / 10,
      fat: Math.round(food.fat_per_100g * multiplier * 10) / 10
    });
    
    onClose();
  };

  const updateQuantity = (foodId: string, value: number) => {
    setQuantity(prev => ({ ...prev, [foodId]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Επιλογή Τροφίμου</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Αναζήτηση τροφίμου..."
            className="rounded-none pl-8"
            autoFocus
          />
        </div>

        <ScrollArea className="flex-1 max-h-[400px] -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {searchTerm ? 'Δεν βρέθηκαν τρόφιμα' : 'Δεν υπάρχουν τρόφιμα στην τράπεζα'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFoods.map(food => {
                const qty = quantity[food.id] || 100;
                const multiplier = qty / 100;
                const displayCals = Math.round(food.calories_per_100g * multiplier);
                const displayProtein = Math.round(food.protein_per_100g * multiplier * 10) / 10;
                const displayCarbs = Math.round(food.carbs_per_100g * multiplier * 10) / 10;
                const displayFat = Math.round(food.fat_per_100g * multiplier * 10) / 10;

                return (
                  <div 
                    key={food.id} 
                    className="border rounded-none p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{food.name}</p>
                        {food.category && (
                          <p className="text-xs text-gray-500">{food.category}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-gray-600">
                          <span className="text-[#00ffba] font-medium">{displayCals} kcal</span>
                          <span>Π: {displayProtein}g</span>
                          <span>Υ: {displayCarbs}g</span>
                          <span>Λ: {displayFat}g</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={qty}
                          onChange={(e) => updateQuantity(food.id, parseInt(e.target.value) || 100)}
                          className="w-16 h-8 rounded-none text-xs text-center"
                          min={1}
                        />
                        <span className="text-xs text-gray-500">g</span>
                        <Button
                          size="sm"
                          onClick={() => handleSelectFood(food)}
                          className="rounded-none h-8 w-8 p-0 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
