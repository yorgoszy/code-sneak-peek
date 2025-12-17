import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type QuickAssignProgramDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  defaultDate?: string; // yyyy-mm-dd
};

export const QuickAssignProgramDialog: React.FC<QuickAssignProgramDialogProps> = ({
  isOpen,
  onClose,
  userId,
  defaultDate = "2025-12-30",
}) => {
  const [date, setDate] = useState(defaultDate);
  const [name, setName] = useState("Full Body Δύναμη (Test-Based)");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const payload = useMemo(() => {
    return {
      action: "create_program" as const,
      name,
      description:
        "1 ημέρα προπόνησης δύναμης με έμφαση στη στάση/κορμό και βασικές άρσεις. (Auto assignment)",
      user_id: userId,
      training_dates: [date],
      weeks: [
        {
          name: "Εβδομάδα 1",
          days: [
            {
              name: "Ημέρα 1 - Full Body Δύναμη & Στάση",
              blocks: [
                {
                  name: "Pillar Prep",
                  training_type: "stability",
                  exercises: [
                    {
                      exercise_name: "Plank",
                      sets: 2,
                      reps: "30-45s",
                      rest: "45",
                      notes: "Σφιχτός κορμός, ουδέτερη σπονδυλική.",
                    },
                    {
                      exercise_name: "Face Pull",
                      sets: 2,
                      reps: "12-15",
                      rest: "45",
                      notes: "Έμφαση σε ωμοπλάτες/στάση.",
                    },
                  ],
                },
                {
                  name: "Primary Strength",
                  training_type: "str",
                  exercises: [
                    {
                      exercise_name: "SQ",
                      sets: 4,
                      reps: "5",
                      rest: "150",
                      tempo: "3.1.1.0",
                      notes: "RPE 7-8. Έλεγχος καθόδου.",
                    },
                    {
                      exercise_name: "Deadlift Trap Bar",
                      sets: 4,
                      reps: "4",
                      rest: "180",
                      tempo: "2.1.1.0",
                      notes: "RPE 7-8. Σταθερός κορμός.",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
  }, [date, name, userId]);

  const onSubmit = async () => {
    if (!date) {
      toast.error("Διάλεξε ημερομηνία");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Δημιουργία & ανάθεση προγράμματος...", { id: "quick-assign" });

    try {
      const { data, error } = await supabase.functions.invoke("ai-program-actions", {
        body: payload,
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Σφάλμα κατά τη δημιουργία/ανάθεση");
      }

      toast.success(data.message || "Έγινε δημιουργία & ανάθεση!", { id: "quick-assign" });

      // Πήγαινε στο dashboard ενεργών προγραμμάτων για να δεις το ProgramCard
      window.location.href = "/dashboard/active-programs";
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Άγνωστο σφάλμα";
      console.error("QuickAssignProgramDialog error:", e);
      toast.error(msg, { id: "quick-assign" });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle>Γρήγορη δημιουργία & ανάθεση</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="program-name">Όνομα προγράμματος</Label>
            <Input
              id="program-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="program-date">Ημερομηνία προπόνησης</Label>
            <Input
              id="program-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-none">
              Άκυρο
            </Button>
            <Button onClick={onSubmit} disabled={isSubmitting} className="rounded-none">
              Δημιουργία & Ανάθεση
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
