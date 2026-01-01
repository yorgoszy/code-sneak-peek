import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Brain, Loader2, Plus, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AIQuestionnaireWizard } from "./AIQuestionnaireWizard";
import { NutritionDayBuilder } from "./NutritionDayBuilder";

// ... keep existing code (types, component)

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

      if (!planData?.days || !Array.isArray(planData.days) || planData.days.length === 0) {
        throw new Error('Το AI επέστρεψε κενό πλάνο');
      }

      const normalizeNumber = (v: any, fallback?: number) => {
        const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.'));
        return Number.isFinite(n) ? n : fallback;
      };

      const normalized = {
        ...planData,
        totalCalories: normalizeNumber(planData.totalCalories, 0),
        proteinTarget: normalizeNumber(planData.proteinTarget, 0),
        carbsTarget: normalizeNumber(planData.carbsTarget, 0),
        fatTarget: normalizeNumber(planData.fatTarget, 0),
        days: planData.days.map((day: any) => ({
          ...day,
          dayNumber: normalizeNumber(day.dayNumber ?? day.day_number, 1) ?? 1,
          totalCalories: normalizeNumber(day.totalCalories ?? day.total_calories, null),
          totalProtein: normalizeNumber(day.totalProtein ?? day.total_protein, null),
          totalCarbs: normalizeNumber(day.totalCarbs ?? day.total_carbs, null),
          totalFat: normalizeNumber(day.totalFat ?? day.total_fat, null),
          meals: (day.meals ?? []).map((meal: any, idx: number) => ({
            ...meal,
            order: normalizeNumber(meal.order ?? meal.meal_order, idx + 1) ?? (idx + 1),
            totalCalories: normalizeNumber(meal.totalCalories ?? meal.total_calories, null),
            totalProtein: normalizeNumber(meal.totalProtein ?? meal.total_protein, null),
            totalCarbs: normalizeNumber(meal.totalCarbs ?? meal.total_carbs, null),
            totalFat: normalizeNumber(meal.totalFat ?? meal.total_fat, null),
            foods: (meal.foods ?? []).map((food: any) => ({
              ...food,
              quantity: normalizeNumber(food.quantity, 0) ?? 0,
              calories: normalizeNumber(food.calories, null),
              protein: normalizeNumber(food.protein, null),
              carbs: normalizeNumber(food.carbs, null),
              fat: normalizeNumber(food.fat, null),
            })),
          })),
        })),
      };

      // Create nutrition plan
      const { data: plan, error: planError } = await supabase
        .from('nutrition_plans')
        .insert([
          {
            name: normalized.name,
            description: normalized.description,
            goal: normalized.goal,
            total_daily_calories: normalized.totalCalories,
            protein_target: normalized.proteinTarget,
            carbs_target: normalized.carbsTarget,
            fat_target: normalized.fatTarget,
            coach_id: normalized.coachId,
          },
        ])
        .select()
        .single();

      if (planError) throw planError;

      // Create days and meals
      for (const day of normalized.days) {
        const { data: dayData, error: dayError } = await supabase
          .from('nutrition_plan_days')
          .insert([
            {
              plan_id: plan.id,
              day_number: day.dayNumber,
              name: day.name,
              total_calories: day.totalCalories,
              total_protein: day.totalProtein,
              total_carbs: day.totalCarbs,
              total_fat: day.totalFat,
            },
          ])
          .select()
          .single();

        if (dayError) throw dayError;

        // Create meals for this day
        for (const meal of day.meals) {
          // Map meal type to valid DB values (same logic as admin QuickAssignNutritionDialog)
          const validMealTypes = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner'];
          let mealType = String(meal.type || meal.mealType || 'lunch').toLowerCase();

          const mealTypeMap: Record<string, string> = {
            'πρωινό': 'breakfast',
            'πρωινο': 'breakfast',
            breakfast: 'breakfast',

            morning_snack: 'morning_snack',
            'δεκατιανό': 'morning_snack',
            'δεκατιανο': 'morning_snack',
            snack: 'morning_snack',

            'μεσημεριανό': 'lunch',
            'μεσημεριανο': 'lunch',
            lunch: 'lunch',

            'απογευματινό': 'afternoon_snack',
            'απογευματινο': 'afternoon_snack',
            afternoon_snack: 'afternoon_snack',

            'βραδινό': 'dinner',
            'βραδινο': 'dinner',
            dinner: 'dinner',
          };

          mealType = mealTypeMap[mealType] || (validMealTypes.includes(mealType) ? mealType : 'lunch');

          const { data: mealData, error: mealError } = await supabase
            .from('nutrition_meals')
            .insert([
              {
                day_id: dayData.id,
                meal_type: mealType,
                meal_order: meal.order,
                name: String(meal.name ?? ''),
                description: meal.description ?? null,
                total_calories: meal.totalCalories,
                total_protein: meal.totalProtein,
                total_carbs: meal.totalCarbs,
                total_fat: meal.totalFat,
              },
            ])
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
              food_order: index,
            }));

            const { error: foodsError } = await supabase
              .from('nutrition_meal_foods')
              .insert(foodsToInsert);

            if (foodsError) throw foodsError;
          }
        }
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error creating nutrition plan:', error);
      toast.error(error?.message || 'Σφάλμα κατά τη δημιουργία του προγράμματος');
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
        className={cn(
          "rounded-none flex flex-col p-0 gap-0",
          mode === 'select'
            ? "w-[95vw] max-w-sm"
            : "fixed inset-0 left-0 top-0 translate-x-0 translate-y-0 w-[100vw] h-[100vh] max-w-none sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-[95vw] sm:max-w-5xl sm:h-auto sm:max-h-[90vh]"
        )}
      >
        <DialogHeader className="p-4 pb-2 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Utensils className="w-4 h-4 text-[#00ffba]" />
            {mode === 'select' && 'Νέο Πρόγραμμα'}
            {mode === 'ai' && 'AI Διατροφολόγος'}
            {mode === 'manual' && 'Χειροκίνητη Δημιουργία'}
          </DialogTitle>
        </DialogHeader>

        <div className={mode === 'select' ? 'p-4' : 'flex-1 overflow-y-auto p-4'}>

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
