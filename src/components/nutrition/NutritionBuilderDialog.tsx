import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Loader2, Plus, Utensils, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AIQuestionnaireWizard } from "./AIQuestionnaireWizard";
import { NutritionDayBuilder } from "./NutritionDayBuilder";

interface NutritionBuilderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GOALS = [
  { value: 'weight_loss', label: 'Απώλεια Βάρους' },
  { value: 'muscle_gain', label: 'Αύξηση Μυϊκής Μάζας' },
  { value: 'maintenance', label: 'Διατήρηση' },
  { value: 'performance', label: 'Απόδοση' },
  { value: 'health', label: 'Υγεία' },
];

export const NutritionBuilderDialog: React.FC<NutritionBuilderDialogProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'select' | 'ai' | 'manual'>('select');
  const [loading, setLoading] = useState(false);

  const handleAIComplete = async (planData: any) => {
    try {
      setLoading(true);
      
      // Create nutrition plan
      const { data: plan, error: planError } = await supabase
        .from('nutrition_plans')
        .insert([{
          name: planData.name,
          description: planData.description,
          goal: planData.goal,
          total_daily_calories: planData.totalCalories,
          protein_target: planData.proteinTarget,
          carbs_target: planData.carbsTarget,
          fat_target: planData.fatTarget
        }])
        .select()
        .single();

      if (planError) throw planError;

      // Create days and meals
      for (const day of planData.days) {
        const { data: dayData, error: dayError } = await supabase
          .from('nutrition_plan_days')
          .insert([{
            plan_id: plan.id,
            day_number: day.dayNumber,
            name: day.name,
            total_calories: day.totalCalories,
            total_protein: day.totalProtein,
            total_carbs: day.totalCarbs,
            total_fat: day.totalFat
          }])
          .select()
          .single();

        if (dayError) throw dayError;

        // Create meals for this day
        for (const meal of day.meals) {
          const { data: mealData, error: mealError } = await supabase
            .from('nutrition_meals')
            .insert([{
              day_id: dayData.id,
              meal_type: meal.type,
              meal_order: meal.order,
              name: meal.name,
              description: meal.description,
              total_calories: meal.totalCalories,
              total_protein: meal.totalProtein,
              total_carbs: meal.totalCarbs,
              total_fat: meal.totalFat
            }])
            .select()
            .single();

          if (mealError) throw mealError;

          // Create foods for this meal
          if (meal.foods && meal.foods.length > 0) {
            const foodsToInsert = meal.foods.map((food: any, index: number) => ({
              meal_id: mealData.id,
              food_id: food.foodId || null,
              food_name: food.name,
              quantity: food.quantity,
              unit: food.unit,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat,
              notes: food.notes || null,
              food_order: index
            }));

            const { error: foodsError } = await supabase
              .from('nutrition_meal_foods')
              .insert(foodsToInsert);

            if (foodsError) throw foodsError;
          }
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating nutrition plan:', error);
      toast.error('Σφάλμα κατά τη δημιουργία του προγράμματος');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMode('select');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`rounded-none w-[95vw] sm:w-auto ${mode === 'select' ? 'max-w-md' : 'max-w-5xl'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-[#00ffba]" />
            {mode === 'select' && 'Νέο Πρόγραμμα Διατροφής'}
            {mode === 'ai' && 'AI Διατροφολόγος'}
            {mode === 'manual' && 'Χειροκίνητη Δημιουργία'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'select' && (
          <div className="space-y-4 py-4">
            <p className="text-xs sm:text-sm text-gray-500 text-center">
              Επιλέξτε τον τρόπο δημιουργίας του προγράμματος
            </p>
            
            <div className="grid gap-4">
              <Button
                variant="outline"
                className="h-auto p-3 sm:p-4 flex-col items-start text-left rounded-none hover:border-[#00ffba] hover:bg-[#00ffba]/5"
                onClick={() => setMode('ai')}
              >
                <div className="flex items-center gap-2 sm:gap-3 w-full">
                  <div className="p-1.5 sm:p-2 bg-[#00ffba]/10 rounded-none">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-[#00ffba]" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">AI Διατροφολόγος</div>
                    <div className="text-[10px] sm:text-xs text-gray-500">
                      Απαντήστε σε ερωτήσεις και το AI θα δημιουργήσει το πρόγραμμα
                    </div>
                  </div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto p-3 sm:p-4 flex-col items-start text-left rounded-none hover:border-[#cb8954] hover:bg-[#cb8954]/5"
                onClick={() => setMode('manual')}
              >
                <div className="flex items-center gap-2 sm:gap-3 w-full">
                  <div className="p-1.5 sm:p-2 bg-[#cb8954]/10 rounded-none">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-[#cb8954]" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">Χειροκίνητη Δημιουργία</div>
                    <div className="text-[10px] sm:text-xs text-gray-500">
                      Δημιουργήστε το πρόγραμμα βήμα-βήμα
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        )}

        {mode === 'ai' && (
          <AIQuestionnaireWizard
            onComplete={handleAIComplete}
            onCancel={() => setMode('select')}
            loading={loading}
          />
        )}

        {mode === 'manual' && (
          <NutritionDayBuilder
            onComplete={handleAIComplete}
            onCancel={() => setMode('select')}
            loading={loading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
