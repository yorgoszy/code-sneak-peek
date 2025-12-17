import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NutritionDayBuilderProps {
  onComplete: (planData: any) => void;
  onCancel: () => void;
  loading: boolean;
}

const DAY_NAMES = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];

const MEAL_TYPES = [
  { type: 'breakfast', name: 'Πρωινό', order: 1 },
  { type: 'morning_snack', name: 'Δεκατιανό', order: 2 },
  { type: 'lunch', name: 'Μεσημεριανό', order: 3 },
  { type: 'afternoon_snack', name: 'Απογευματινό', order: 4 },
  { type: 'dinner', name: 'Βραδινό', order: 5 },
];

interface Food {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  type: string;
  name: string;
  order: number;
  description: string;
  foods: Food[];
}

interface Day {
  dayNumber: number;
  name: string;
  meals: Meal[];
}

export const NutritionDayBuilder: React.FC<NutritionDayBuilderProps> = ({
  onComplete,
  onCancel,
  loading
}) => {
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  const [days, setDays] = useState<Day[]>(
    DAY_NAMES.map((name, index) => ({
      dayNumber: index + 1,
      name,
      meals: MEAL_TYPES.map(mt => ({
        type: mt.type,
        name: mt.name,
        order: mt.order,
        description: '',
        foods: []
      }))
    }))
  );

  const addFood = (dayIndex: number, mealIndex: number) => {
    setDays(prev => {
      const newDays = [...prev];
      newDays[dayIndex].meals[mealIndex].foods.push({
        name: '',
        quantity: 100,
        unit: 'g',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      });
      return newDays;
    });
  };

  const updateFood = (dayIndex: number, mealIndex: number, foodIndex: number, field: string, value: any) => {
    setDays(prev => {
      const newDays = [...prev];
      (newDays[dayIndex].meals[mealIndex].foods[foodIndex] as any)[field] = value;
      return newDays;
    });
  };

  const removeFood = (dayIndex: number, mealIndex: number, foodIndex: number) => {
    setDays(prev => {
      const newDays = [...prev];
      newDays[dayIndex].meals[mealIndex].foods.splice(foodIndex, 1);
      return newDays;
    });
  };

  const calculateMealTotals = (meal: Meal) => {
    return meal.foods.reduce((acc, food) => ({
      calories: acc.calories + (food.calories || 0),
      protein: acc.protein + (food.protein || 0),
      carbs: acc.carbs + (food.carbs || 0),
      fat: acc.fat + (food.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const calculateDayTotals = (day: Day) => {
    return day.meals.reduce((acc, meal) => {
      const mealTotals = calculateMealTotals(meal);
      return {
        calories: acc.calories + mealTotals.calories,
        protein: acc.protein + mealTotals.protein,
        carbs: acc.carbs + mealTotals.carbs,
        fat: acc.fat + mealTotals.fat
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const handleSubmit = () => {
    if (!planName.trim()) {
      toast.error('Εισάγετε όνομα προγράμματος');
      return;
    }

    const dayTotals = days.map(day => calculateDayTotals(day));
    const avgCalories = Math.round(dayTotals.reduce((sum, d) => sum + d.calories, 0) / 7);
    const avgProtein = Math.round(dayTotals.reduce((sum, d) => sum + d.protein, 0) / 7);
    const avgCarbs = Math.round(dayTotals.reduce((sum, d) => sum + d.carbs, 0) / 7);
    const avgFat = Math.round(dayTotals.reduce((sum, d) => sum + d.fat, 0) / 7);

    const planData = {
      name: planName,
      description: planDescription,
      goal: goal || null,
      totalCalories: avgCalories,
      proteinTarget: avgProtein,
      carbsTarget: avgCarbs,
      fatTarget: avgFat,
      days: days.map(day => {
        const totals = calculateDayTotals(day);
        return {
          ...day,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFat: totals.fat,
          meals: day.meals.map(meal => {
            const mealTotals = calculateMealTotals(meal);
            return {
              ...meal,
              totalCalories: mealTotals.calories,
              totalProtein: mealTotals.protein,
              totalCarbs: mealTotals.carbs,
              totalFat: mealTotals.fat
            };
          })
        };
      })
    };

    onComplete(planData);
  };

  const selectedDay = days[selectedDayIndex];
  const dayTotals = calculateDayTotals(selectedDay);

  return (
    <div className="space-y-4">
      {/* Plan Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Όνομα Προγράμματος *</Label>
          <Input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="π.χ. Πρόγραμμα Απώλειας Βάρους"
            className="rounded-none"
          />
        </div>
        <div className="space-y-2">
          <Label>Στόχος</Label>
          <Input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="π.χ. Απώλεια βάρους"
            className="rounded-none"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Περιγραφή</Label>
        <Textarea
          value={planDescription}
          onChange={(e) => setPlanDescription(e.target.value)}
          placeholder="Προαιρετική περιγραφή του προγράμματος..."
          className="rounded-none"
        />
      </div>

      {/* Day Tabs */}
      <Tabs value={selectedDayIndex.toString()} onValueChange={(v) => setSelectedDayIndex(parseInt(v))}>
        <TabsList className="rounded-none grid grid-cols-7 w-full">
          {DAY_NAMES.map((day, index) => (
            <TabsTrigger 
              key={index} 
              value={index.toString()} 
              className="rounded-none text-xs px-1"
            >
              {day.slice(0, 3)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedDayIndex.toString()} className="mt-4 space-y-4">
          {/* Day Summary */}
          <Card className="rounded-none bg-gray-50">
            <CardContent className="p-3">
              <div className="grid grid-cols-4 gap-4 text-center text-sm">
                <div>
                  <div className="font-bold text-[#00ffba]">{dayTotals.calories}</div>
                  <div className="text-xs text-gray-500">kcal</div>
                </div>
                <div>
                  <div className="font-bold text-blue-600">{dayTotals.protein}g</div>
                  <div className="text-xs text-gray-500">Πρωτεΐνη</div>
                </div>
                <div>
                  <div className="font-bold text-orange-600">{dayTotals.carbs}g</div>
                  <div className="text-xs text-gray-500">Υδατάνθρακες</div>
                </div>
                <div>
                  <div className="font-bold text-yellow-600">{dayTotals.fat}g</div>
                  <div className="text-xs text-gray-500">Λίπη</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meals */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {selectedDay.meals.map((meal, mealIndex) => {
              const mealTotals = calculateMealTotals(meal);
              return (
                <Card key={meal.type} className="rounded-none">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{meal.name}</span>
                      <span className="text-xs font-normal text-gray-500">
                        {mealTotals.calories} kcal | {mealTotals.protein}g Π | {mealTotals.carbs}g Υ | {mealTotals.fat}g Λ
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    {meal.foods.map((food, foodIndex) => (
                      <div key={foodIndex} className="grid grid-cols-12 gap-2 items-center">
                        <Input
                          value={food.name}
                          onChange={(e) => updateFood(selectedDayIndex, mealIndex, foodIndex, 'name', e.target.value)}
                          placeholder="Όνομα φαγητού"
                          className="col-span-3 rounded-none text-xs h-8"
                        />
                        <Input
                          type="number"
                          value={food.quantity}
                          onChange={(e) => updateFood(selectedDayIndex, mealIndex, foodIndex, 'quantity', parseFloat(e.target.value))}
                          placeholder="Ποσ."
                          className="col-span-1 rounded-none text-xs h-8"
                        />
                        <Input
                          type="number"
                          value={food.calories}
                          onChange={(e) => updateFood(selectedDayIndex, mealIndex, foodIndex, 'calories', parseFloat(e.target.value))}
                          placeholder="kcal"
                          className="col-span-2 rounded-none text-xs h-8"
                        />
                        <Input
                          type="number"
                          value={food.protein}
                          onChange={(e) => updateFood(selectedDayIndex, mealIndex, foodIndex, 'protein', parseFloat(e.target.value))}
                          placeholder="Πρωτ."
                          className="col-span-2 rounded-none text-xs h-8"
                        />
                        <Input
                          type="number"
                          value={food.carbs}
                          onChange={(e) => updateFood(selectedDayIndex, mealIndex, foodIndex, 'carbs', parseFloat(e.target.value))}
                          placeholder="Υδατ."
                          className="col-span-2 rounded-none text-xs h-8"
                        />
                        <Input
                          type="number"
                          value={food.fat}
                          onChange={(e) => updateFood(selectedDayIndex, mealIndex, foodIndex, 'fat', parseFloat(e.target.value))}
                          placeholder="Λίπη"
                          className="col-span-1 rounded-none text-xs h-8"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFood(selectedDayIndex, mealIndex, foodIndex)}
                          className="col-span-1 rounded-none h-8 w-8 p-0 text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addFood(selectedDayIndex, mealIndex)}
                      className="rounded-none w-full mt-2"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Προσθήκη Φαγητού
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onCancel} className="rounded-none">
          Ακύρωση
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !planName.trim()}
          className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Αποθήκευση...
            </>
          ) : (
            'Δημιουργία Προγράμματος'
          )}
        </Button>
      </div>
    </div>
  );
};
