import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Utensils, Calendar, Eye, History, Loader2, ChefHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { NutritionPlanViewDialog } from "@/components/nutrition/NutritionPlanViewDialog";

interface NutritionAssignment {
  id: string;
  plan_id: string;
  start_date: string;
  end_date: string | null;
  status: string;
  notes: string | null;
  nutrition_plans: {
    id: string;
    name: string;
    description: string | null;
    total_daily_calories: number | null;
    protein_target: number | null;
    carbs_target: number | null;
    fat_target: number | null;
  } | null;
}

interface NutritionPlan {
  id: string;
  name: string;
  description: string | null;
  total_daily_calories: number | null;
  protein_target: number | null;
  carbs_target: number | null;
  fat_target: number | null;
  goal: string | null;
}

interface UserProfileNutritionProps {
  userId: string;
  userProfile: any;
}

// Έλεγχος αν ο χρήστης δημιουργήθηκε από coach
const isCoachCreatedUser = (userProfile: any) => !userProfile?.auth_user_id && userProfile?.coach_id;

export const UserProfileNutrition: React.FC<UserProfileNutritionProps> = ({ userId, userProfile }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [assignments, setAssignments] = useState<NutritionAssignment[]>([]);
  const [coachPlans, setCoachPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
    // Αν είναι coach-created user, φέρνουμε και τα πλάνα του coach
    if (isCoachCreatedUser(userProfile)) {
      fetchCoachPlans();
    }
  }, [userId, userProfile?.coach_id]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('nutrition_assignments')
        .select(`
          id,
          plan_id,
          start_date,
          end_date,
          status,
          notes,
          nutrition_plans (
            id,
            name,
            description,
            total_daily_calories,
            protein_target,
            carbs_target,
            fat_target
          )
        `)
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching nutrition assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachPlans = async () => {
    if (!userProfile?.coach_id) return;
    
    try {
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('id, name, description, total_daily_calories, protein_target, carbs_target, fat_target, goal')
        .eq('coach_id', userProfile.coach_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoachPlans(data || []);
    } catch (error) {
      console.error('Error fetching coach plans:', error);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  
  // Για coach-created users, τα πλάνα του coach που δεν είναι assigned εμφανίζονται ως "ενεργά"
  const assignedPlanIds = new Set(assignments.map(a => a.plan_id));
  const unassignedCoachPlans = isCoachCreatedUser(userProfile) 
    ? coachPlans.filter(plan => !assignedPlanIds.has(plan.id))
    : [];
  
  const activeAssignments = assignments.filter(a => 
    a.status === 'active' && 
    (!a.end_date || a.end_date >= today) &&
    a.start_date <= today
  );
  
  const historyAssignments = assignments.filter(a => 
    a.status !== 'active' || 
    (a.end_date && a.end_date < today)
  );

  const getStatusBadge = (assignment: NutritionAssignment) => {
    if (assignment.end_date && assignment.end_date < today) {
      return <Badge variant="secondary" className="rounded-none">Ολοκληρώθηκε</Badge>;
    }
    if (assignment.status === 'active') {
      return <Badge className="rounded-none bg-[#00ffba] text-black">Ενεργό</Badge>;
    }
    return <Badge variant="outline" className="rounded-none">{assignment.status}</Badge>;
  };

  const getGoalLabel = (goal: string | null) => {
    switch (goal) {
      case 'weight_loss': return 'Απώλεια Βάρους';
      case 'muscle_gain': return 'Αύξηση Μυϊκής Μάζας';
      case 'maintenance': return 'Διατήρηση';
      case 'performance': return 'Απόδοση';
      default: return goal || 'Γενικό';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#00ffba]" />
      </div>
    );
  }

  const renderAssignmentCard = (assignment: NutritionAssignment) => (
    <Card key={assignment.id} className="rounded-none">
      <CardContent className="p-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Utensils className="w-5 h-5 text-[#00ffba]" />
            <h3 className="font-medium">{assignment.nutrition_plans?.name || 'Πρόγραμμα Διατροφής'}</h3>
            {getStatusBadge(assignment)}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(assignment.start_date), 'dd MMM yyyy', { locale: el })}
              {assignment.end_date && (
                <> - {format(new Date(assignment.end_date), 'dd MMM yyyy', { locale: el })}</>
              )}
            </span>
          </div>
          
          {assignment.nutrition_plans && (
            <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
              <div className="bg-gray-50 p-2 rounded-none">
                <div className="font-semibold text-[#00ffba]">{assignment.nutrition_plans.total_daily_calories || '-'}</div>
                <div className="text-gray-500">kcal</div>
              </div>
              <div className="bg-gray-50 p-2 rounded-none">
                <div className="font-semibold text-blue-600">{assignment.nutrition_plans.protein_target || '-'}g</div>
                <div className="text-gray-500">Π</div>
              </div>
              <div className="bg-gray-50 p-2 rounded-none">
                <div className="font-semibold text-orange-600">{assignment.nutrition_plans.carbs_target || '-'}g</div>
                <div className="text-gray-500">Υ</div>
              </div>
              <div className="bg-gray-50 p-2 rounded-none">
                <div className="font-semibold text-yellow-600">{assignment.nutrition_plans.fat_target || '-'}g</div>
                <div className="text-gray-500">Λ</div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedPlanId(assignment.plan_id)}
              className="rounded-none"
              aria-label="Προβολή πλάνου διατροφής"
              title="Προβολή"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCoachPlanCard = (plan: NutritionPlan) => (
    <Card key={plan.id} className="rounded-none">
      <CardContent className="p-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <ChefHat className="w-5 h-5 text-[#cb8954]" />
            <h3 className="font-medium">{plan.name}</h3>
            <Badge variant="outline" className="rounded-none text-[10px]">
              {getGoalLabel(plan.goal)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
            <div className="bg-gray-50 p-2 rounded-none">
              <div className="font-semibold text-[#00ffba]">{plan.total_daily_calories || '-'}</div>
              <div className="text-gray-500">kcal</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-none">
              <div className="font-semibold text-blue-600">{plan.protein_target || '-'}g</div>
              <div className="text-gray-500">Π</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-none">
              <div className="font-semibold text-orange-600">{plan.carbs_target || '-'}g</div>
              <div className="text-gray-500">Υ</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-none">
              <div className="font-semibold text-yellow-600">{plan.fat_target || '-'}g</div>
              <div className="text-gray-500">Λ</div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedPlanId(plan.id)}
              className="rounded-none"
              aria-label="Προβολή πλάνου διατροφής"
              title="Προβολή"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Συνολικός αριθμός ενεργών (assignments + unassigned coach plans)
  const totalActive = activeAssignments.length + unassignedCoachPlans.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Διατροφή</h2>
          <p className="text-sm text-gray-500">Τα προγράμματα διατροφής σου</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-none">
          <TabsTrigger value="active" className="rounded-none">
            <Utensils className="w-4 h-4 mr-2" />
            Ενεργά ({totalActive})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-none">
            <History className="w-4 h-4 mr-2" />
            Ιστορικό ({historyAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-3">
          {totalActive === 0 ? (
            <Card className="rounded-none">
              <CardContent className="p-8 text-center">
                <Utensils className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Δεν υπάρχει ενεργό πρόγραμμα
                </h3>
                <p className="text-gray-500">
                  Επικοινωνήστε με τον προπονητή σας για να σας αναθέσει ένα πρόγραμμα διατροφής.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {activeAssignments.map(renderAssignmentCard)}
              {unassignedCoachPlans.map(renderCoachPlanCard)}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {historyAssignments.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="p-8 text-center">
                <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Δεν υπάρχει ιστορικό
                </h3>
                <p className="text-gray-500">
                  Τα ολοκληρωμένα προγράμματα διατροφής θα εμφανίζονται εδώ.
                </p>
              </CardContent>
            </Card>
          ) : (
            historyAssignments.map(renderAssignmentCard)
          )}
        </TabsContent>
      </Tabs>

      {selectedPlanId && (
        <NutritionPlanViewDialog
          planId={selectedPlanId}
          isOpen={!!selectedPlanId}
          onClose={() => setSelectedPlanId(null)}
        />
      )}
    </div>
  );
};