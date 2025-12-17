import React, { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Interface για τα δεδομένα προγράμματος από AI
export interface AIProgramData {
  name: string;
  description?: string;
  training_dates: string[];
  weeks: any[];
}

type QuickAssignProgramDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  programData?: AIProgramData | null; // Δεδομένα από AI συζήτηση
};

export const QuickAssignProgramDialog: React.FC<QuickAssignProgramDialogProps> = ({
  isOpen,
  onClose,
  userId,
  programData,
}) => {
  // Αν υπάρχουν δεδομένα από AI, χρησιμοποίησέ τα, αλλιώς default σημερινή ημερομηνία
  const today = new Date().toISOString().split('T')[0];
  
  const [date, setDate] = useState(programData?.training_dates?.[0] || today);
  const [name, setName] = useState(programData?.name || "Πρόγραμμα Προπόνησης");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper για κωδικοποιημένη ονομασία
  const generateCodedName = (description?: string, programName?: string): string => {
    const text = (description || programName || '').toLowerCase();
    const codes: string[] = [];
    
    // Strength variations
    if (text.includes('strength') || text.includes('δύναμη') || text.includes('δύναμης')) {
      codes.push('STR');
    }
    // Endurance variations
    if (text.includes('endurance') || text.includes('αντοχή') || text.includes('αντοχής')) {
      codes.push('END');
    }
    // Power
    if (text.includes('power') || text.includes('ισχύς') || text.includes('εκρηκτικ')) {
      codes.push('PWR');
    }
    // Hypertrophy
    if (text.includes('hypertrophy') || text.includes('υπερτροφία') || text.includes('μυϊκή')) {
      codes.push('HYP');
    }
    // Speed
    if (text.includes('speed') || text.includes('ταχύτητα')) {
      codes.push('SPD');
    }
    // Mobility
    if (text.includes('mobility') || text.includes('κινητικότητα')) {
      codes.push('MOB');
    }
    // Core
    if (text.includes('core') || text.includes('κορμό') || text.includes('pillar')) {
      codes.push('CORE');
    }
    // Conditioning
    if (text.includes('conditioning') || text.includes('φυσική κατάσταση')) {
      codes.push('COND');
    }
    
    if (codes.length === 0) {
      codes.push('PROG');
    }
    
    return codes.join('/');
  };

  // Ενημέρωση όταν αλλάζουν τα programData
  useEffect(() => {
    if (programData) {
      const code = generateCodedName(programData.description, programData.name);
      const dateStr = programData.training_dates?.[0] || today;
      setName(`${code} - ${dateStr}`);
      setDate(dateStr);
    }
  }, [programData, today]);

  const payload = useMemo(() => {
    // Αν υπάρχουν δεδομένα από AI, χρησιμοποίησέ τα
    if (programData && programData.weeks && programData.weeks.length > 0) {
      return {
        action: "create_program" as const,
        name,
        description: programData.description || `Πρόγραμμα προπόνησης δημιουργημένο από AI`,
        user_id: userId,
        training_dates: [date],
        weeks: programData.weeks,
      };
    }
    
    // Default πρόγραμμα αν δεν υπάρχουν δεδομένα AI
    return {
      action: "create_program" as const,
      name,
      description: "Πρόγραμμα προπόνησης",
      user_id: userId,
      training_dates: [date],
      weeks: [
        {
          name: "Εβδομάδα 1",
          days: [
            {
              name: "Ημέρα 1",
              blocks: [
                {
                  name: "pillar prep",
                  training_type: "pillar prep",
                  exercises: [
                    {
                      exercise_name: "Plank",
                      sets: 3,
                      reps: "30",
                      reps_mode: "time",
                      rest: "30",
                      notes: "Σφιχτός κορμός",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
  }, [date, name, userId, programData]);

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

  // Υπολογισμός στατιστικών προγράμματος
  const programStats = useMemo(() => {
    if (!programData?.weeks) return null;
    
    let totalExercises = 0;
    let totalBlocks = 0;
    
    programData.weeks.forEach(week => {
      week.days?.forEach((day: any) => {
        day.blocks?.forEach((block: any) => {
          totalBlocks++;
          totalExercises += block.exercises?.length || 0;
        });
      });
    });
    
    return { totalExercises, totalBlocks };
  }, [programData]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle>
            {programData ? "Ανάθεση AI Προγράμματος" : "Γρήγορη δημιουργία & ανάθεση"}
          </DialogTitle>
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

          {/* Εμφάνιση στατιστικών αν υπάρχουν δεδομένα AI */}
          {programStats && (
            <div className="bg-muted/50 p-3 rounded-none text-sm">
              <p className="text-muted-foreground">
                <strong>Blocks:</strong> {programStats.totalBlocks} | 
                <strong> Ασκήσεις:</strong> {programStats.totalExercises}
              </p>
              {programData?.description && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {programData.description}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-none">
              Άκυρο
            </Button>
            <Button onClick={onSubmit} disabled={isSubmitting} className="rounded-none">
              {programData ? "Ανάθεση" : "Δημιουργία & Ανάθεση"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
