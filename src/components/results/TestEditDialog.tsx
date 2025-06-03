
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TestResult } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TestEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestResult | null;
  onSave: () => void;
}

export const TestEditDialog = ({ isOpen, onClose, test, onSave }: TestEditDialogProps) => {
  const [testDate, setTestDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (test) {
      setTestDate(test.test_date);
      setNotes(test.notes || "");
    }
  }, [test]);

  const handleSave = async () => {
    if (!test) return;

    try {
      setSaving(true);
      
      let error;
      const updateData = {
        test_date: testDate,
        notes: notes
      };

      if (test.table_name === 'strength_test_sessions') {
        const result = await supabase
          .from('strength_test_sessions')
          .update(updateData)
          .eq('id', test.id);
        error = result.error;
      } else if (test.table_name === 'anthropometric_test_sessions') {
        const result = await supabase
          .from('anthropometric_test_sessions')
          .update(updateData)
          .eq('id', test.id);
        error = result.error;
      } else if (test.table_name === 'functional_test_sessions') {
        const result = await supabase
          .from('functional_test_sessions')
          .update(updateData)
          .eq('id', test.id);
        error = result.error;
      } else if (test.table_name === 'endurance_test_sessions') {
        const result = await supabase
          .from('endurance_test_sessions')
          .update(updateData)
          .eq('id', test.id);
        error = result.error;
      } else if (test.table_name === 'jump_test_sessions') {
        const result = await supabase
          .from('jump_test_sessions')
          .update(updateData)
          .eq('id', test.id);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Το τεστ ενημερώθηκε επιτυχώς"
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating test:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την ενημέρωση του τεστ",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!test) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle>Επεξεργασία Τεστ</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Ημερομηνία Τεστ</Label>
            <Input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="rounded-none"
            />
          </div>
          
          <div>
            <Label>Σημειώσεις</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Προσθέστε σημειώσεις..."
              className="rounded-none"
              rows={3}
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-none"
            >
              Ακύρωση
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-none"
            >
              {saving ? "Αποθήκευση..." : "Αποθήκευση"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
