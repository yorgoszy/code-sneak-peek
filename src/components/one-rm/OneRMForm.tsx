import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { OneRMRecord } from "./OneRMManagement";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OneRMFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: OneRMRecord | null;
}

interface User {
  id: string;
  name: string;
}

interface Exercise {
  id: string;
  name: string;
}

export const OneRMForm = ({ isOpen, onClose, onSuccess, record }: OneRMFormProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [formData, setFormData] = useState({
    user_id: "",
    exercise_id: "",
    weight: "",
    recorded_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchExercises();
      if (record) {
        setFormData({
          user_id: record.user_id,
          exercise_id: record.exercise_id,
          weight: record.weight.toString(),
          recorded_date: record.recorded_date,
          notes: record.notes || ""
        });
      } else {
        setFormData({
          user_id: "",
          exercise_id: "",
          weight: "",
          recorded_date: format(new Date(), 'yyyy-MM-dd'),
          notes: ""
        });
      }
    }
  }, [isOpen, record]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users' as any)
        .select('id, name')
        .order('name');

      if (error) throw error;
      setUsers((data as any) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Σφάλμα φόρτωσης χρηστών');
    }
  };

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises' as any)
        .select('id, name')
        .order('name');

      if (error) throw error;
      setExercises((data as any) || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error('Σφάλμα φόρτωσης ασκήσεων');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('No user found');

      const { data: appUser } = await supabase
        .from('app_users' as any)
        .select('id')
        .eq('auth_user_id', currentUser.user.id)
        .single() as { data: { id: string } | null };

      const payload = {
        user_id: formData.user_id,
        exercise_id: formData.exercise_id,
        weight: parseFloat(formData.weight),
        recorded_date: formData.recorded_date,
        notes: formData.notes || null,
        created_by: appUser?.id
      };

      if (record) {
        const { error } = await supabase
          .from('user_exercise_1rm' as any)
          .update(payload)
          .eq('id', record.id);

        if (error) throw error;
        toast.success('Η καταγραφή ενημερώθηκε επιτυχώς');
      } else {
        const { error } = await supabase
          .from('user_exercise_1rm' as any)
          .insert([payload]);

        if (error) throw error;
        toast.success('Η καταγραφή αποθηκεύτηκε επιτυχώς');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving 1RM record:', error);
      toast.error(error.message || 'Σφάλμα αποθήκευσης καταγραφής');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle>
            {record ? 'Επεξεργασία Καταγραφής 1RM' : 'Νέα Καταγραφή 1RM'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_id">Ασκούμενος</Label>
            <Select
              value={formData.user_id}
              onValueChange={(value) => setFormData({ ...formData, user_id: value })}
              required
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε ασκούμενο" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exercise_id">Άσκηση</Label>
            <Select
              value={formData.exercise_id}
              onValueChange={(value) => setFormData({ ...formData, exercise_id: value })}
              required
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε άσκηση" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Βάρος (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.5"
              min="0"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="rounded-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recorded_date">Ημερομηνία</Label>
            <Input
              id="recorded_date"
              type="date"
              value={formData.recorded_date}
              onChange={(e) => setFormData({ ...formData, recorded_date: e.target.value })}
              className="rounded-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Σημειώσεις (προαιρετικό)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-none"
            >
              Ακύρωση
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              {isLoading ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
