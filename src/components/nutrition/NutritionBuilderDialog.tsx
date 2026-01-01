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
      <DialogContent
        className={`rounded-none p-0 gap-0 ${
          mode === 'select'
            ? 'w-[95vw] max-w-sm h-auto'
            : 'fixed inset-0 w-full h-full max-w-none sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-[95vw] sm:max-w-5xl sm:h-auto sm:max-h-[90vh]'
        }`}
      >
        <DialogHeader className="p-4 pb-2 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Utensils className="w-4 h-4 text-[#00ffba]" />
            {mode === 'select' && 'Νέο Πρόγραμμα'}
            {mode === 'ai' && 'AI Διατροφολόγος'}
            {mode === 'manual' && 'Χειροκίνητη Δημιουργία'}
          </DialogTitle>
        </DialogHeader>

        <div className={`${mode === 'select' ? 'p-4' : 'flex-1 overflow-y-auto p-4'}`}>

          {mode === 'select' && (
            <div className="space-y-3">
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  className="h-auto p-3 flex items-start text-left rounded-none hover:border-[#00ffba] hover:bg-[#00ffba]/5"
                  onClick={() => setMode('ai')}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-1.5 bg-[#00ffba]/10 rounded-none">
                      <Brain className="w-5 h-5 text-[#00ffba]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">AI Διατροφολόγος</div>
                      <div className="text-[10px] text-gray-500">
                        Ερωτηματολόγιο + AI δημιουργία
                      </div>
                    </div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-3 flex items-start text-left rounded-none hover:border-[#cb8954] hover:bg-[#cb8954]/5"
                  onClick={() => setMode('manual')}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-1.5 bg-[#cb8954]/10 rounded-none">
                      <Plus className="w-5 h-5 text-[#cb8954]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Χειροκίνητη</div>
                      <div className="text-[10px] text-gray-500">
                        Δημιουργία βήμα-βήμα
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
