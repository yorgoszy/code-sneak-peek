import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, User, Utensils, Loader2 } from "lucide-react";
import { addDays, format } from "date-fns";

export interface AINutritionData {
  name: string;
  description?: string;
  goal?: string;
  totalCalories?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
  days?: any[];
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

type QuickAssignNutritionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  nutritionData?: AINutritionData | null;
  defaultUserId?: string;
};

export const QuickAssignNutritionDialog: React.FC<QuickAssignNutritionDialogProps> = ({
  isOpen,
  onClose,
  nutritionData,
  defaultUserId,
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [name, setName] = useState(nutritionData?.name || "Πρόγραμμα Διατροφής");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User selection
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (nutritionData) {
        setName(nutritionData.name || "Πρόγραμμα Διατροφής");
      }
    }
  }, [isOpen, nutritionData]);

  useEffect(() => {
    if (defaultUserId && users.length > 0) {
      const user = users.find(u => u.id === defaultUserId);
      if (user) setSelectedUser(user);
    }
  }, [defaultUserId, users]);

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
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email, avatar_url')
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

  // Generate training dates between start and end
  const generateTrainingDates = (start: string, end: string): string[] => {
    const dates: string[] = [];
    let current = new Date(start);
    const endD = new Date(end);
    
    while (current <= endD) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current = addDays(current, 1);
    }
    return dates;
  };

  const onSubmit = async () => {
    if (!selectedUser) {
      toast.error("Επιλέξτε χρήστη");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Επιλέξτε ημερομηνίες");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Δημιουργία & ανάθεση διατροφής...", { id: "quick-assign-nutrition" });

    try {
      // 1. Create nutrition plan
      const { data: plan, error: planError } = await supabase
        .from('nutrition_plans')
        .insert([{
          name: name,
          description: nutritionData?.description || `Πρόγραμμα διατροφής δημιουργημένο από RidAI`,
          goal: nutritionData?.goal || null,
          total_daily_calories: nutritionData?.totalCalories || null,
          protein_target: nutritionData?.proteinTarget || null,
          carbs_target: nutritionData?.carbsTarget || null,
          fat_target: nutritionData?.fatTarget || null
        }])
        .select()
        .single();

      if (planError) throw planError;

      // 2. Create days if provided
      if (nutritionData?.days && nutritionData.days.length > 0) {
        for (const day of nutritionData.days) {
          const { data: dayData, error: dayError } = await supabase
            .from('nutrition_plan_days')
            .insert([{
              plan_id: plan.id,
              day_number: day.dayNumber || 1,
              name: day.name || `Ημέρα ${day.dayNumber || 1}`,
              total_calories: day.totalCalories || null,
              total_protein: day.totalProtein || null,
              total_carbs: day.totalCarbs || null,
              total_fat: day.totalFat || null
            }])
            .select()
            .single();

          if (dayError) throw dayError;

          // 3. Create meals for this day
          if (day.meals && day.meals.length > 0) {
            for (const meal of day.meals) {
              const { data: mealData, error: mealError } = await supabase
                .from('nutrition_meals')
                .insert([{
                  day_id: dayData.id,
                  meal_type: meal.type || 'lunch',
                  meal_order: meal.order || 1,
                  name: meal.name || 'Γεύμα',
                  description: meal.description || null,
                  total_calories: meal.totalCalories || null,
                  total_protein: meal.totalProtein || null,
                  total_carbs: meal.totalCarbs || null,
                  total_fat: meal.totalFat || null
                }])
                .select()
                .single();

              if (mealError) throw mealError;

              // 4. Create foods for this meal
              if (meal.foods && meal.foods.length > 0) {
                const foodsToInsert = meal.foods.map((food: any, index: number) => ({
                  meal_id: mealData.id,
                  food_id: food.foodId || null,
                  food_name: food.name || 'Τροφή',
                  quantity: food.quantity || 100,
                  unit: food.unit || 'g',
                  calories: food.calories || 0,
                  protein: food.protein || 0,
                  carbs: food.carbs || 0,
                  fat: food.fat || 0,
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
        }
      }

      // 5. Create assignment
      const trainingDates = generateTrainingDates(startDate, endDate);
      const { error: assignError } = await supabase
        .from('nutrition_assignments')
        .insert([{
          plan_id: plan.id,
          user_id: selectedUser.id,
          start_date: startDate,
          end_date: endDate,
          training_dates: trainingDates,
          status: 'active'
        }]);

      if (assignError) throw assignError;

      toast.success("Δημιουργήθηκε & ανατέθηκε επιτυχώς!", { id: "quick-assign-nutrition" });
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Άγνωστο σφάλμα";
      console.error("QuickAssignNutritionDialog error:", e);
      toast.error(msg, { id: "quick-assign-nutrition" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate stats
  const nutritionStats = useMemo(() => {
    if (!nutritionData) return null;
    return {
      totalCalories: nutritionData.totalCalories || 0,
      protein: nutritionData.proteinTarget || 0,
      carbs: nutritionData.carbsTarget || 0,
      fat: nutritionData.fatTarget || 0,
      daysCount: nutritionData.days?.length || 0
    };
  }, [nutritionData]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#00ffba]" />
            {nutritionData ? "Ανάθεση AI Διατροφής" : "Γρήγορη ανάθεση διατροφής"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Χρήστης *
            </Label>
            {selectedUser ? (
              <div className="flex items-center gap-2 p-2 border border-[#00ffba] bg-[#00ffba]/5 rounded-none">
                <Avatar className="w-8 h-8 rounded-none">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback className="rounded-none bg-gray-200 text-xs">
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
                        <Avatar className="w-6 h-6 rounded-none">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="rounded-none bg-gray-200 text-xs">
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

          <div className="space-y-2">
            <Label>Όνομα προγράμματος</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Ημ. έναρξης</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Ημ. λήξης</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-none"
              />
            </div>
          </div>

          {/* Stats from AI */}
          {nutritionStats && (
            <div className="bg-muted/50 p-3 rounded-none">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <div className="font-bold text-[#00ffba]">{nutritionStats.totalCalories}</div>
                  <div className="text-gray-500">kcal</div>
                </div>
                <div>
                  <div className="font-bold text-blue-600">{nutritionStats.protein}g</div>
                  <div className="text-gray-500">Πρωτ.</div>
                </div>
                <div>
                  <div className="font-bold text-orange-600">{nutritionStats.carbs}g</div>
                  <div className="text-gray-500">Υδατ.</div>
                </div>
                <div>
                  <div className="font-bold text-yellow-600">{nutritionStats.fat}g</div>
                  <div className="text-gray-500">Λίπη</div>
                </div>
              </div>
              {nutritionData?.description && (
                <p className="text-muted-foreground mt-2 text-xs">
                  {nutritionData.description}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-none">
              Άκυρο
            </Button>
            <Button 
              onClick={onSubmit} 
              disabled={isSubmitting || !selectedUser} 
              className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Αποθήκευση...
                </>
              ) : (
                'Ανάθεση'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
