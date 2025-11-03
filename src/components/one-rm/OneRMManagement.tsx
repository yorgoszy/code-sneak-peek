import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OneRMForm } from "./OneRMForm";
import { OneRMList } from "./OneRMList";

export interface OneRMRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  weight: number;
  recorded_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  app_users?: {
    name: string;
  };
  exercises?: {
    name: string;
  };
}

export const OneRMManagement = () => {
  const [records, setRecords] = useState<OneRMRecord[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OneRMRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_exercise_1rm' as any)
        .select(`
          *,
          app_users!user_exercise_1rm_user_id_fkey(name),
          exercises(name)
        `)
        .order('recorded_date', { ascending: false });

      if (error) throw error;
      setRecords((data as any) || []);
    } catch (error) {
      console.error('Error fetching 1RM records:', error);
      toast.error('Σφάλμα φόρτωσης καταγραφών 1RM');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedRecord(null);
    setIsFormOpen(true);
  };

  const handleEdit = (record: OneRMRecord) => {
    setSelectedRecord(record);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_exercise_1rm' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Η καταγραφή διαγράφηκε επιτυχώς');
      fetchRecords();
    } catch (error) {
      console.error('Error deleting 1RM record:', error);
      toast.error('Σφάλμα διαγραφής καταγραφής');
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedRecord(null);
    fetchRecords();
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">1RM - Μέγιστη Επανάληψη</h1>
          <p className="text-gray-600 mt-1">Διαχείριση 1RM ανά ασκούμενο και άσκηση</p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Νέα Καταγραφή
        </Button>
      </div>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#cb8954]" />
            Καταγραφές 1RM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OneRMList
            records={records}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <OneRMForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedRecord(null);
        }}
        onSuccess={handleFormSuccess}
        record={selectedRecord}
      />
    </div>
  );
};
