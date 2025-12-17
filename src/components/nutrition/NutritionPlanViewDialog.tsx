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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#00ffba]" />
            {plan.name}
          </DialogTitle>
          {plan.description && (
            <p className="text-sm text-gray-500">{plan.description}</p>
          )}
        </DialogHeader>

        {/* Plan Summary */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card className="rounded-none">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-[#00ffba]">{plan.total_daily_calories || 0}</div>
              <div className="text-xs text-gray-500">kcal/ημέρα</div>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{plan.protein_target || 0}g</div>
              <div className="text-xs text-gray-500">Πρωτεΐνη</div>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{plan.carbs_target || 0}g</div>
              <div className="text-xs text-gray-500">Υδατάνθρακες</div>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{plan.fat_target || 0}g</div>
              <div className="text-xs text-gray-500">Λίπη</div>
            </CardContent>
          </Card>
        </div>

        {/* Days Tabs */}
        {days.length > 0 && (
          <Tabs value={selectedDayIndex.toString()} onValueChange={(v) => setSelectedDayIndex(parseInt(v))}>
            <TabsList className="rounded-none grid grid-cols-7 w-full">
              {days.map((day, index) => (
                <TabsTrigger 
                  key={day.id} 
                  value={index.toString()} 
                  className="rounded-none text-xs"
                >
                  {day.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {selectedDay && (
              <TabsContent value={selectedDayIndex.toString()} className="mt-4">
                {/* Day Summary */}
                <div className="grid grid-cols-4 gap-2 mb-4 text-center text-xs">
                  <div className="bg-gray-50 p-2 rounded-none">
                    <span className="font-bold text-[#00ffba]">{selectedDay.total_calories || 0}</span>
                    <span className="text-gray-500 ml-1">kcal</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-none">
                    <span className="font-bold text-blue-600">{selectedDay.total_protein || 0}g</span>
                    <span className="text-gray-500 ml-1">Π</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-none">
                    <span className="font-bold text-orange-600">{selectedDay.total_carbs || 0}g</span>
                    <span className="text-gray-500 ml-1">Υ</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-none">
                    <span className="font-bold text-yellow-600">{selectedDay.total_fat || 0}g</span>
                    <span className="text-gray-500 ml-1">Λ</span>
                  </div>
                </div>

                {/* Meals */}
                <div className="space-y-3">
                  {selectedDay.nutrition_meals?.map((meal: any) => (
                    <Card key={meal.id} className="rounded-none">
                      <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {MEAL_ICONS[meal.meal_type]}
                            <span>{MEAL_NAMES[meal.meal_type] || meal.name}</span>
                          </div>
                          <Badge variant="outline" className="rounded-none text-xs">
                            {meal.total_calories || 0} kcal
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        {meal.description && (
                          <p className="text-sm text-gray-600 mb-2">{meal.description}</p>
                        )}
                        
                        {meal.nutrition_meal_foods?.length > 0 ? (
                          <div className="space-y-2">
                            {meal.nutrition_meal_foods.map((food: any) => (
                              <div 
                                key={food.id} 
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-none text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <UtensilsCrossed className="w-3 h-3 text-gray-400" />
                                  <span>{food.food_name}</span>
                                  <span className="text-gray-400 text-xs">
                                    {food.quantity}{food.unit}
                                  </span>
                                </div>
                                <div className="flex gap-3 text-xs">
                                  <span className="text-[#00ffba]">{food.calories}kcal</span>
                                  <span className="text-blue-600">{food.protein}g Π</span>
                                  <span className="text-orange-600">{food.carbs}g Υ</span>
                                  <span className="text-yellow-600">{food.fat}g Λ</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Δεν έχουν προστεθεί φαγητά</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}

        {days.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Utensils className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>Δεν υπάρχουν ημέρες σε αυτό το πρόγραμμα</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
