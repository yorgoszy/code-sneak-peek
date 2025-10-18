import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
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

interface AnthropometricHistoryProps {
  userId: string;
  refreshKey?: number;
}

export const AnthropometricHistory: React.FC<AnthropometricHistoryProps> = ({ 
  userId, 
  refreshKey 
}) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [userId, refreshKey]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('anthropometric_test_sessions')
        .select(`
          id,
          test_date,
          created_at,
          anthropometric_test_data (
            id,
            weight,
            height,
            body_fat_percentage,
            muscle_mass_percentage,
            chest_circumference,
            waist_circumference,
            hip_circumference,
            arm_circumference,
            thigh_circumference
          )
        `)
        .eq('user_id', userId)
        .order('test_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;

    try {
      const { error } = await supabase
        .from('anthropometric_test_sessions')
        .delete()
        .eq('id', sessionToDelete);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Η καταγραφή διαγράφηκε επιτυχώς",
      });

      fetchHistory();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία διαγραφής καταγραφής",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const openDeleteDialog = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Φόρτωση...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Δεν υπάρχουν καταγραφές
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sessions.map((session) => {
          const data = session.anthropometric_test_data?.[0];
          if (!data) return null;

          return (
            <Card key={session.id} className="rounded-none">
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm">
                      {format(new Date(session.test_date), 'dd/MM/yyyy')}
                    </CardTitle>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openDeleteDialog(session.id)}
                    className="rounded-none h-6 w-6 p-0 hover:bg-red-100"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {data.weight && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Βάρος:</span>
                      <span className="font-semibold">{data.weight} kg</span>
                    </div>
                  )}
                  {data.height && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ύψος:</span>
                      <span className="font-semibold">{data.height} cm</span>
                    </div>
                  )}
                  {data.body_fat_percentage && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Λίπος:</span>
                      <span className="font-semibold">{data.body_fat_percentage}%</span>
                    </div>
                  )}
                  {data.muscle_mass_percentage && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Μυϊκή Μάζα:</span>
                      <span className="font-semibold">{data.muscle_mass_percentage}%</span>
                    </div>
                  )}
                  {data.chest_circumference && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Στήθος:</span>
                      <span className="font-semibold">{data.chest_circumference} cm</span>
                    </div>
                  )}
                  {data.waist_circumference && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Μέση:</span>
                      <span className="font-semibold">{data.waist_circumference} cm</span>
                    </div>
                  )}
                  {data.hip_circumference && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Γοφοί:</span>
                      <span className="font-semibold">{data.hip_circumference} cm</span>
                    </div>
                  )}
                  {data.arm_circumference && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Μπράτσο:</span>
                      <span className="font-semibold">{data.arm_circumference} cm</span>
                    </div>
                  )}
                  {data.thigh_circumference && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Μηρός:</span>
                      <span className="font-semibold">{data.thigh_circumference} cm</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή Καταγραφής</AlertDialogTitle>
            <AlertDialogDescription>
              Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την καταγραφή; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-none bg-red-600 hover:bg-red-700"
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
