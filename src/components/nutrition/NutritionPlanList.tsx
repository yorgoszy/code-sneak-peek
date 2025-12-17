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

  const handleDelete = async (planId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα;')) return;

    try {
      const { error } = await supabase
        .from('nutrition_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      
      setPlans(prev => prev.filter(p => p.id !== planId));
      toast.success('Το πρόγραμμα διαγράφηκε');
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Σφάλμα κατά τη διαγραφή');
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="rounded-none hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="truncate">{plan.name}</span>
                {plan.goal && (
                  <Badge variant="outline" className="rounded-none text-xs">
                    {plan.goal}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-gray-500">
                {format(new Date(plan.created_at), 'dd/MM/yyyy')}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{plan.description}</p>
              )}
              
              {plan.total_daily_calories && (
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-gray-50 p-2 rounded-none">
                    <div className="font-semibold text-[#00ffba]">{plan.total_daily_calories}</div>
                    <div className="text-gray-500">kcal</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-none">
                    <div className="font-semibold text-blue-600">{plan.protein_target || 0}g</div>
                    <div className="text-gray-500">Πρωτ.</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-none">
                    <div className="font-semibold text-orange-600">{plan.carbs_target || 0}g</div>
                    <div className="text-gray-500">Υδατ.</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-none">
                    <div className="font-semibold text-yellow-600">{plan.fat_target || 0}g</div>
                    <div className="text-gray-500">Λίπη</div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(plan)}
                  className="rounded-none flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Προβολή
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssign(plan)}
                  className="rounded-none flex-1"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Ανάθεση
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(plan.id)}
                  className="rounded-none text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
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
    </>
  );
};
