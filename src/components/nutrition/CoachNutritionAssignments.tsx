import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Trash2, Calendar, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { NutritionPlanViewDialog } from "./NutritionPlanViewDialog";
import { useRoleCheck } from "@/hooks/useRoleCheck";
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

interface NutritionAssignment {
  id: string;
  plan_id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  status: string;
  created_at: string;
  assigned_by: string | null;
  nutrition_plans: {
    name: string;
    goal: string | null;
    total_daily_calories: number | null;
  };
  app_users: {
    name: string;
    photo_url: string | null;
  };
}

export const CoachNutritionAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<NutritionAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const { userProfile } = useRoleCheck();

  useEffect(() => {
    if (userProfile?.id) {
      fetchAssignments();
    }
  }, [userProfile?.id]);

  const fetchAssignments = async () => {
    if (!userProfile?.id) return;
    
    try {
      // First get the coach's athletes
      const { data: coachAthletes, error: athletesError } = await supabase
        .from('app_users')
        .select('id')
        .eq('coach_id', userProfile.id);

      if (athletesError) throw athletesError;
      
      const athleteIds = coachAthletes?.map(a => a.id) || [];
      
      if (athleteIds.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      // Fetch assignments for the coach's athletes
      const { data, error } = await supabase
        .from('nutrition_assignments')
        .select(`
          *,
          nutrition_plans (name, goal, total_daily_calories),
          app_users!nutrition_assignments_user_id_fkey (name, photo_url)
        `)
        .in('user_id', athleteIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των αναθέσεων');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (assignmentId: string) => {
    setAssignmentToDelete(assignmentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assignmentToDelete) return;

    try {
      const { error } = await supabase
        .from('nutrition_assignments')
        .delete()
        .eq('id', assignmentToDelete);

      if (error) throw error;
      
      setAssignments(prev => prev.filter(a => a.id !== assignmentToDelete));
      toast.success('Η ανάθεση διαγράφηκε');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Σφάλμα κατά τη διαγραφή');
    } finally {
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    }
  };

  const handleViewPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setIsViewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ενεργό';
      case 'completed': return 'Ολοκληρωμένο';
      case 'paused': return 'Σε παύση';
      case 'cancelled': return 'Ακυρωμένο';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Φόρτωση αναθέσεων...
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Δεν υπάρχουν αναθέσεις
          </h3>
          <p className="text-gray-500">
            Αναθέστε ένα πρόγραμμα διατροφής στους αθλητές σας
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="rounded-none bg-white">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Utensils className="w-4 h-4 text-[#00ffba] shrink-0" />
                  <Avatar className="h-8 w-8 shrink-0 rounded-full">
                    <AvatarImage src={assignment.app_users?.photo_url || ''} />
                    <AvatarFallback className="bg-[#cb8954] text-white text-xs rounded-full">
                      {assignment.app_users?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm truncate">{assignment.app_users?.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{assignment.nutrition_plans?.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right text-[10px] hidden sm:block">
                    <p className="text-gray-500">
                      {format(new Date(assignment.start_date), 'dd/MM/yy')}
                    </p>
                    {assignment.nutrition_plans?.total_daily_calories && (
                      <p className="text-[#00ffba] font-medium">
                        {assignment.nutrition_plans.total_daily_calories} kcal
                      </p>
                    )}
                  </div>
                  
                  <Badge className={`rounded-none text-[10px] px-1.5 ${getStatusColor(assignment.status)}`}>
                    {getStatusLabel(assignment.status)}
                  </Badge>
                  
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewPlan(assignment.plan_id)}
                      className="rounded-none h-7 w-7 p-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(assignment.id)}
                      className="rounded-none h-7 w-7 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlanId && (
        <NutritionPlanViewDialog
          isOpen={isViewDialogOpen}
          onClose={() => setIsViewDialogOpen(false)}
          planId={selectedPlanId}
        />
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