import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, Coffee, Sun, Moon, Apple, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NutritionPlanViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
}

const MEAL_ICONS: Record<string, React.ReactNode> = {
  breakfast: <Coffee className="w-4 h-4" />,
  morning_snack: <Apple className="w-4 h-4" />,
  lunch: <Sun className="w-4 h-4" />,
  afternoon_snack: <Apple className="w-4 h-4" />,
  dinner: <Moon className="w-4 h-4" />,
};

const MEAL_NAMES: Record<string, string> = {
  breakfast: 'Πρωινό',
  morning_snack: 'Δεκατιανό',
  lunch: 'Μεσημεριανό',
  afternoon_snack: 'Απογευματινό',
  dinner: 'Βραδινό',
};

export const NutritionPlanViewDialog: React.FC<NutritionPlanViewDialogProps> = ({
  isOpen,
  onClose,
  planId
}) => {
  const [plan, setPlan] = useState<any>(null);
  const [days, setDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    if (isOpen && planId) {
      fetchPlanDetails();
    }
  }, [isOpen, planId]);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);

      // Fetch plan
      const { data: planData, error: planError } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) throw planError;
      setPlan(planData);

      // Fetch days with meals and foods
      const { data: daysData, error: daysError } = await supabase
        .from('nutrition_plan_days')
        .select(`
          *,
          nutrition_meals (
            *,
            nutrition_meal_foods (*)
          )
        `)
        .eq('plan_id', planId)
        .order('day_number');

      if (daysError) throw daysError;

      // Sort meals by order
      const sortedDays = daysData?.map(day => ({
        ...day,
        nutrition_meals: day.nutrition_meals?.sort((a: any, b: any) => a.meal_order - b.meal_order) || []
      })) || [];

      setDays(sortedDays);
    } catch (error) {
      console.error('Error fetching plan details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl rounded-none">
          <div className="text-center py-8 text-gray-500">
            Φόρτωση προγράμματος...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!plan) return null;

  const selectedDay = days[selectedDayIndex];

  // Calculate day totals from meals/foods if not stored in DB
  const calculateDayTotals = (day: any) => {
    if (!day?.nutrition_meals) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    day.nutrition_meals.forEach((meal: any) => {
      if (meal.nutrition_meal_foods?.length > 0) {
        meal.nutrition_meal_foods.forEach((food: any) => {
          totals.calories += Number(food.calories) || 0;
          totals.protein += Number(food.protein) || 0;
          totals.carbs += Number(food.carbs) || 0;
          totals.fat += Number(food.fat) || 0;
        });
      }
    });
    
    return totals;
  };

  const dayTotals = selectedDay ? calculateDayTotals(selectedDay) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[85vh] sm:h-[80vh] flex flex-col rounded-none p-3 sm:p-4 overflow-hidden">
        {/* Fixed Header */}
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-[#00ffba]" />
            {plan.name}
          </DialogTitle>
        </DialogHeader>

        {/* Fixed Plan Summary */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 shrink-0">
          <Card className="rounded-none">
            <CardContent className="p-1.5 sm:p-2 text-center">
              <div className="text-sm sm:text-lg font-bold text-[#00ffba]">{plan.total_daily_calories || 0}</div>
              <div className="text-[8px] sm:text-xs text-gray-500">kcal</div>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardContent className="p-1.5 sm:p-2 text-center">
              <div className="text-sm sm:text-lg font-bold text-blue-600">{plan.protein_target || 0}g</div>
              <div className="text-[8px] sm:text-xs text-gray-500">Πρωτ.</div>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardContent className="p-1.5 sm:p-2 text-center">
              <div className="text-sm sm:text-lg font-bold text-orange-600">{plan.carbs_target || 0}g</div>
              <div className="text-[8px] sm:text-xs text-gray-500">Υδατ.</div>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardContent className="p-1.5 sm:p-2 text-center">
              <div className="text-sm sm:text-lg font-bold text-yellow-600">{plan.fat_target || 0}g</div>
              <div className="text-[8px] sm:text-xs text-gray-500">Λίπη</div>
            </CardContent>
          </Card>
        </div>

        {/* Days Content - Scrollable */}
        {days.length > 0 ? (
          <Tabs value={selectedDayIndex.toString()} onValueChange={(v) => setSelectedDayIndex(parseInt(v))} className="flex-1 flex flex-col min-h-0 mt-2">
            {/* Fixed Day Tabs */}
            <div className="overflow-x-auto shrink-0 -mx-3 px-3 sm:mx-0 sm:px-0">
              <TabsList className="rounded-none inline-flex sm:grid sm:grid-cols-7 w-auto sm:w-full min-w-max h-8">
                {days.map((day, index) => (
                  <TabsTrigger 
                    key={day.id} 
                    value={index.toString()} 
                    className="rounded-none text-[10px] sm:text-xs px-2 py-1"
                  >
                    {day.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Scrollable Day Content */}
            {selectedDay && (
              <TabsContent value={selectedDayIndex.toString()} className="flex-1 overflow-y-auto mt-2 -mx-1 px-1">
                {/* Day Summary */}
                <div className="grid grid-cols-4 gap-1 mb-2 text-center text-[10px] sticky top-0 bg-white z-10 py-1">
                  <div className="bg-gray-100 p-1 rounded-none">
                    <span className="font-bold text-[#00ffba]">{Math.round(dayTotals.calories)}</span>
                    <span className="text-gray-500 ml-0.5">kcal</span>
                  </div>
                  <div className="bg-gray-100 p-1 rounded-none">
                    <span className="font-bold text-blue-600">{Math.round(dayTotals.protein)}g</span>
                    <span className="text-gray-500 ml-0.5">Π</span>
                  </div>
                  <div className="bg-gray-100 p-1 rounded-none">
                    <span className="font-bold text-orange-600">{Math.round(dayTotals.carbs)}g</span>
                    <span className="text-gray-500 ml-0.5">Υ</span>
                  </div>
                  <div className="bg-gray-100 p-1 rounded-none">
                    <span className="font-bold text-yellow-600">{Math.round(dayTotals.fat)}g</span>
                    <span className="text-gray-500 ml-0.5">Λ</span>
                  </div>
                </div>

                {/* Meals */}
                <div className="space-y-2">
                  {selectedDay.nutrition_meals?.map((meal: any) => {
                    const mealCalories = meal.nutrition_meal_foods?.reduce((sum: number, f: any) => sum + (Number(f.calories) || 0), 0) || 0;
                    
                    return (
                      <Card key={meal.id} className="rounded-none">
                        <CardHeader className="p-2 pb-1">
                          <CardTitle className="text-xs flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {MEAL_ICONS[meal.meal_type]}
                              <span>{MEAL_NAMES[meal.meal_type] || meal.name}</span>
                            </div>
                            <Badge variant="outline" className="rounded-none text-[10px]">
                              {Math.round(mealCalories)} kcal
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 pt-0">
                          {meal.nutrition_meal_foods?.length > 0 ? (
                            <div className="space-y-1">
                              {meal.nutrition_meal_foods.map((food: any) => (
                                <div 
                                  key={food.id} 
                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-1.5 bg-gray-50 rounded-none text-[10px] sm:text-xs gap-0.5"
                                >
                                  <div className="flex items-center gap-1">
                                    <UtensilsCrossed className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span className="font-medium truncate">{food.food_name}</span>
                                    <span className="text-gray-400 text-[9px]">
                                      {food.quantity}{food.unit}
                                    </span>
                                  </div>
                                  <div className="flex gap-2 text-[9px] sm:text-[10px] pl-4 sm:pl-0">
                                    <span className="text-[#00ffba]">{Math.round(food.calories || 0)}</span>
                                    <span className="text-blue-600">{Math.round(food.protein || 0)}g</span>
                                    <span className="text-orange-600">{Math.round(food.carbs || 0)}g</span>
                                    <span className="text-yellow-600">{Math.round(food.fat || 0)}g</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">Δεν έχουν προστεθεί φαγητά</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Utensils className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm">Δεν υπάρχουν ημέρες</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
