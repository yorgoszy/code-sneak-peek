import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, UserPlus, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { NutritionPlanViewDialog } from "./NutritionPlanViewDialog";
import { NutritionAssignDialog } from "./NutritionAssignDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NutritionPlan {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  total_daily_calories: number | null;
  protein_target: number | null;
  carbs_target: number | null;
  fat_target: number | null;
  created_at: string;
}

export const NutritionPlanList: React.FC = () => {
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<NutritionPlan | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching nutrition plans:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των προγραμμάτων');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (planId: string) => {
    setPlanToDelete(planId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    try {
      const { error } = await supabase
        .from('nutrition_plans')
        .delete()
        .eq('id', planToDelete);

      if (error) throw error;
      
      setPlans(prev => prev.filter(p => p.id !== planToDelete));
      toast.success('Το πρόγραμμα διαγράφηκε');
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Σφάλμα κατά τη διαγραφή');
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleView = (plan: NutritionPlan) => {
    setSelectedPlan(plan);
    setIsViewDialogOpen(true);
  };

  const handleAssign = (plan: NutritionPlan) => {
    setSelectedPlan(plan);
    setIsAssignDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Φόρτωση προγραμμάτων...
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-8 text-center">
          <Utensils className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Δεν υπάρχουν προγράμματα διατροφής
          </h3>
          <p className="text-gray-500">
            Δημιουργήστε το πρώτο σας πρόγραμμα διατροφής
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="rounded-none hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs sm:text-sm truncate">{plan.name}</h4>
                  <p className="text-[10px] text-gray-500">
                    {format(new Date(plan.created_at), 'dd/MM/yyyy')}
                  </p>
                </div>
                {plan.goal && (
                  <Badge variant="outline" className="rounded-none text-[10px] shrink-0">
                    {plan.goal}
                  </Badge>
                )}
              </div>
              
              {plan.total_daily_calories && (
                <div className="grid grid-cols-4 gap-1 text-center text-[10px] mb-2">
                  <div className="bg-gray-50 p-1 rounded-none">
                    <div className="font-semibold text-[#00ffba]">{plan.total_daily_calories}</div>
                    <div className="text-gray-500">kcal</div>
                  </div>
                  <div className="bg-gray-50 p-1 rounded-none">
                    <div className="font-semibold text-blue-600">{plan.protein_target || 0}g</div>
                    <div className="text-gray-500">Π</div>
                  </div>
                  <div className="bg-gray-50 p-1 rounded-none">
                    <div className="font-semibold text-orange-600">{plan.carbs_target || 0}g</div>
                    <div className="text-gray-500">Υ</div>
                  </div>
                  <div className="bg-gray-50 p-1 rounded-none">
                    <div className="font-semibold text-yellow-600">{plan.fat_target || 0}g</div>
                    <div className="text-gray-500">Λ</div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(plan)}
                  className="rounded-none flex-1 h-7 text-[10px] sm:text-xs px-1"
                >
                  <Eye className="w-3 h-3 mr-0.5" />
                  Προβολή
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssign(plan)}
                  className="rounded-none flex-1 h-7 text-[10px] sm:text-xs px-1"
                >
                  <UserPlus className="w-3 h-3 mr-0.5" />
                  Ανάθεση
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(plan.id)}
                  className="rounded-none text-red-500 hover:text-red-700 h-7 w-7 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlan && (
        <>
          <NutritionPlanViewDialog
            isOpen={isViewDialogOpen}
            onClose={() => setIsViewDialogOpen(false)}
            planId={selectedPlan.id}
          />
          <NutritionAssignDialog
            isOpen={isAssignDialogOpen}
            onClose={() => setIsAssignDialogOpen(false)}
            plan={selectedPlan}
            onSuccess={fetchPlans}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 rounded-none">
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
