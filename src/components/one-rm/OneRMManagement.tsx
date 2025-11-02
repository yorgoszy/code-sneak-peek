import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, RefreshCw } from "lucide-react";
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
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleSyncFromForceVelocity = async () => {
    setIsSyncing(true);
    try {
      // Φέρνω όλες τις καταγραφές από strength_test_attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('strength_test_attempts')
        .select(`
          id,
          weight_kg,
          test_session_id,
          exercise_id,
          strength_test_sessions!inner(
            user_id,
            test_date
          )
        `)
        .order('test_date', { ascending: false });

      if (attemptsError) throw attemptsError;

      if (!attempts || attempts.length === 0) {
        toast.info('Δεν βρέθηκαν καταγραφές Force/Velocity');
        return;
      }

      // Βρίσκω τον τρέχοντα χρήστη για το created_by
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('No user found');

      const { data: appUser } = await supabase
        .from('app_users' as any)
        .select('id')
        .eq('auth_user_id', currentUser.user.id)
        .single() as { data: { id: string } | null };

      // Οργανώνω τα δεδομένα: για κάθε user_id + exercise_id, κρατώ το μέγιστο βάρος με την πιο πρόσφατη ημερομηνία
      const userExerciseMap = new Map<string, {
        user_id: string;
        exercise_id: string;
        max_weight: number;
        recorded_date: string;
      }>();

      attempts.forEach((attempt: any) => {
        const userId = attempt.strength_test_sessions.user_id;
        const exerciseId = attempt.exercise_id;
        const weight = attempt.weight_kg;
        const date = attempt.strength_test_sessions.test_date;
        
        const key = `${userId}_${exerciseId}`;
        const existing = userExerciseMap.get(key);

        if (!existing || weight > existing.max_weight || 
           (weight === existing.max_weight && date > existing.recorded_date)) {
          userExerciseMap.set(key, {
            user_id: userId,
            exercise_id: exerciseId,
            max_weight: weight,
            recorded_date: date
          });
        }
      });

      // Για κάθε συνδυασμό, ελέγχω αν υπάρχει ήδη καταγραφή 1RM
      let created = 0;
      let updated = 0;

      for (const [key, data] of userExerciseMap.entries()) {
        // Ελέγχω αν υπάρχει ήδη καταγραφή
        const { data: existingRecords, error: checkError } = await supabase
          .from('user_exercise_1rm' as any)
          .select('*')
          .eq('user_id', data.user_id)
          .eq('exercise_id', data.exercise_id)
          .order('recorded_date', { ascending: false })
          .limit(1);

        if (checkError) {
          console.error('Error checking existing record:', checkError);
          continue;
        }

        const existingRecord = existingRecords?.[0] as any;

        // Αν δεν υπάρχει ή το νέο βάρος είναι μεγαλύτερο, ενημερώνω/δημιουργώ
        if (!existingRecord || data.max_weight > existingRecord.weight) {
          if (existingRecord) {
            // Ενημέρωση
            const { error: updateError } = await supabase
              .from('user_exercise_1rm' as any)
              .update({
                weight: data.max_weight,
                recorded_date: data.recorded_date,
                notes: 'Αυτόματη ενημέρωση από Force/Velocity tests',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingRecord.id);

            if (updateError) {
              console.error('Error updating record:', updateError);
            } else {
              updated++;
            }
          } else {
            // Δημιουργία
            const { error: insertError } = await supabase
              .from('user_exercise_1rm' as any)
              .insert({
                user_id: data.user_id,
                exercise_id: data.exercise_id,
                weight: data.max_weight,
                recorded_date: data.recorded_date,
                notes: 'Αυτόματη καταγραφή από Force/Velocity tests',
                created_by: appUser?.id
              });

            if (insertError) {
              console.error('Error inserting record:', insertError);
            } else {
              created++;
            }
          }
        }
      }

      toast.success(`Συγχρονισμός ολοκληρώθηκε! ${created} νέες καταγραφές, ${updated} ενημερώσεις`);
      fetchRecords();
    } catch (error) {
      console.error('Error syncing from Force/Velocity:', error);
      toast.error('Σφάλμα συγχρονισμού δεδομένων');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">1RM - Μέγιστη Επανάληψη</h1>
          <p className="text-gray-600 mt-1">Διαχείριση 1RM ανά ασκούμενο και άσκηση</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSyncFromForceVelocity}
            disabled={isSyncing}
            variant="outline"
            className="rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Συγχρονισμός...' : 'Συγχρονισμός από Force/Velocity'}
          </Button>
          <Button
            onClick={handleAddNew}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Νέα Καταγραφή
          </Button>
        </div>
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
