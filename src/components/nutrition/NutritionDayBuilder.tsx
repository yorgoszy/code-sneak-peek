import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2, Loader2, Search, User, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffectiveCoachId } from "@/hooks/useEffectiveCoachId";

interface NutritionDayBuilderProps {
  onComplete: (planData: any) => void;
  onCancel: () => void;
  loading: boolean;
}

const DAY_NAMES = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];
const DAY_SHORT = ['Δευ', 'Τρι', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ', 'Κυρ'];

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

interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  photo_url?: string;
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

  const { effectiveCoachId, loading: rolesLoading } = useEffectiveCoachId();
  
  // User selection
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
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

  useEffect(() => {
    if (rolesLoading) return;
    fetchUsers();
  }, [rolesLoading, effectiveCoachId]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowUserDropdown(true);
    } else {
      setFilteredUsers([]);
      setShowUserDropdown(false);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      if (!effectiveCoachId) {
        setUsers([]);
        return;
      }

      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email, avatar_url, photo_url')
        .eq('coach_id', effectiveCoachId)
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSelectUser = (user: AppUser) => {
    setSelectedUser(user);
    setSearchTerm('');
    setShowUserDropdown(false);
  };

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

    if (!selectedUser) {
      toast.error('Επιλέξτε χρήστη');
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
      userId: selectedUser.id,
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
      {/* User Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Χρήστης *
        </Label>
          {selectedUser ? (
            <div className="flex items-center gap-2 p-2 border border-[#00ffba] bg-[#00ffba]/5 rounded-none">
              <Avatar className="w-8 h-8 rounded-full">
                <AvatarImage src={selectedUser.photo_url || selectedUser.avatar_url} className="rounded-full" />
                <AvatarFallback className="rounded-full bg-[#cb8954] text-white text-xs">
                  {selectedUser.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUser(null)}
              className="rounded-none h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Αναζήτηση χρήστη..."
                className="rounded-none pl-8"
              />
            </div>
            {showUserDropdown && filteredUsers.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 text-left"
                  >
                    <Avatar className="w-6 h-6 rounded-full">
                      <AvatarImage src={user.photo_url || user.avatar_url} className="rounded-full" />
                      <AvatarFallback className="rounded-full bg-[#cb8954] text-white text-[10px]">
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plan Info - Responsive grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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

      {/* Day Tabs - Responsive */}
      <Tabs value={selectedDayIndex.toString()} onValueChange={(v) => setSelectedDayIndex(parseInt(v))}>
        <TabsList className="rounded-none w-full flex flex-wrap h-auto gap-1 p-1">
          {DAY_SHORT.map((day, index) => (
            <TabsTrigger 
              key={index} 
              value={index.toString()} 
              className="rounded-none text-xs px-2 py-1.5 flex-1 min-w-[40px]"
            >
              {day}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedDayIndex.toString()} className="mt-4 space-y-4">
          {/* Day Summary - Responsive */}
          <Card className="rounded-none bg-gray-50">
            <CardContent className="p-2 sm:p-3">
              <div className="grid grid-cols-4 gap-1 sm:gap-4 text-center text-xs sm:text-sm">
                <div>
                  <div className="font-bold text-[#00ffba]">{dayTotals.calories}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">kcal</div>
                </div>
                <div>
                  <div className="font-bold text-blue-600">{dayTotals.protein}g</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Πρωτ.</div>
                </div>
                <div>
                  <div className="font-bold text-orange-600">{dayTotals.carbs}g</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Υδατ.</div>
                </div>
                <div>
                  <div className="font-bold text-yellow-600">{dayTotals.fat}g</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Λίπη</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meals - Responsive */}
          <div className="space-y-4 max-h-[350px] sm:max-h-[400px] overflow-y-auto">
            {selectedDay.meals.map((meal, mealIndex) => {
              const mealTotals = calculateMealTotals(meal);
              return (
                <Card key={meal.type} className="rounded-none">
                  <CardHeader className="p-2 sm:p-3 pb-1 sm:pb-2">
                    <CardTitle className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span>{meal.name}</span>
                      <span className="text-[10px] sm:text-xs font-normal text-gray-500">
                        {mealTotals.calories} kcal | {mealTotals.protein}g Π | {mealTotals.carbs}g Υ | {mealTotals.fat}g Λ
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-3 pt-0 space-y-2">
                    {meal.foods.map((food, foodIndex) => (
                      <div key={foodIndex} className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center border-b sm:border-0 pb-2 sm:pb-0">
                        {/* Mobile: stacked layout */}
                        <Input
                          value={food.name}
                          onChange={(e) => updateFood(selectedDayIndex, mealIndex, foodIndex, 'name', e.target.value)}
                          placeholder="Όνομα φαγητού"
                          className="sm:col-span-3 rounded-none text-xs h-8"
                        />
                        <div className="grid grid-cols-6 gap-1 sm:contents">
                          <Input
                            type="number"
                            value={food.quantity}
                            onChange={(e) => updateFood(selectedDayIndex, mealIndex, foodIndex, 'quantity', parseFloat(e.target.value))}
                            placeholder="Ποσ."
                            className="col-span-1 sm:col-span-1 rounded-none text-xs h-8"
                          />
                          <Input
                            type="number"
                            value={food.calories}
                            onChange={(e) => updateFood(selectedDayIndex, mealIndex, foodIndex, 'calories', parseFloat(e.target.value))}
                            placeholder="kcal"
                            className="col-span-1 sm:col-span-2 rounded-none text-xs h-8"
                          />
                          <Input
                            type="number"
                            value={food.protein}
                            onChange={(e) => updateFood(selectedDayIndex, mealIndex, foodIndex, 'protein', parseFloat(e.target.value))}
                            placeholder="Πρωτ."
                            className="col-span-1 sm:col-span-2 rounded-none text-xs h-8"
                          />
                          <Input
                            type="number"
                            value={food.carbs}
                            onChange={(e) => updateFood(selectedDayIndex, mealIndex, foodIndex, 'carbs', parseFloat(e.target.value))}
                            placeholder="Υδατ."
                            className="col-span-1 sm:col-span-2 rounded-none text-xs h-8"
                          />
                          <Input
                            type="number"
                            value={food.fat}
                            onChange={(e) => updateFood(selectedDayIndex, mealIndex, foodIndex, 'fat', parseFloat(e.target.value))}
                            placeholder="Λίπη"
                            className="col-span-1 sm:col-span-1 rounded-none text-xs h-8"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFood(selectedDayIndex, mealIndex, foodIndex)}
                            className="col-span-1 sm:col-span-1 rounded-none h-8 w-full sm:w-8 p-0 text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addFood(selectedDayIndex, mealIndex)}
                      className="rounded-none w-full mt-2 text-xs"
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

      {/* Actions - Responsive */}
      <div className="sticky bottom-0 bg-background pt-3 pb-2 border-t flex flex-col sm:flex-row justify-between gap-2">
        <Button variant="outline" onClick={onCancel} className="rounded-none order-2 sm:order-1">
          Ακύρωση
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !planName.trim() || !selectedUser}
          className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black order-1 sm:order-2"
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
