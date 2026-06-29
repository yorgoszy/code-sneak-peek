import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PendingDrop {
  assignmentId: string;
  date: string;
  userName: string;
}

interface Props {
  onDeleted?: () => void;
}

export const BubbleTrashDropZone: React.FC<Props> = ({ onDeleted }) => {
  const [active, setActive] = useState(false);
  const [over, setOver] = useState(false);
  const [pending, setPending] = useState<PendingDrop | null>(null);

  useEffect(() => {
    const onStart = () => setActive(true);
    const onEnd = () => {
      setActive(false);
      setOver(false);
    };
    window.addEventListener('bubble-drag-start', onStart);
    window.addEventListener('bubble-drag-end', onEnd);
    return () => {
      window.removeEventListener('bubble-drag-start', onStart);
      window.removeEventListener('bubble-drag-end', onEnd);
    };
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/x-bubble');
    setActive(false);
    setOver(false);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as PendingDrop;
      setPending(data);
    } catch {
      // ignore
    }
  };

  const confirmDelete = async () => {
    if (!pending) return;
    try {
      const { data: assignment, error: fetchErr } = await supabase
        .from('program_assignments')
        .select('training_dates')
        .eq('id', pending.assignmentId)
        .single();
      if (fetchErr) throw fetchErr;

      const remaining = (assignment?.training_dates || []).filter(
        (d: string) => d !== pending.date
      );

      if (remaining.length === 0) {
        // Καμία ημέρα δεν απομένει - cancel assignment
        const { error } = await supabase
          .from('program_assignments')
          .update({ status: 'cancelled', training_dates: [] })
          .eq('id', pending.assignmentId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('program_assignments')
          .update({ training_dates: remaining })
          .eq('id', pending.assignmentId);
        if (error) throw error;
      }

      // Καθάρισε και τυχόν workout_completion για αυτή την ημέρα
      await supabase
        .from('workout_completions')
        .delete()
        .eq('assignment_id', pending.assignmentId)
        .eq('scheduled_date', pending.date);

      toast({ title: 'Διαγράφηκε', description: `${pending.userName} - ${pending.date}` });
      onDeleted?.();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Σφάλμα', description: err.message || 'Δεν διαγράφηκε', variant: 'destructive' });
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      {active && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={handleDrop}
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-none transition-all ${
            over
              ? 'w-56 h-56 bg-red-500/90 border-white text-white scale-110'
              : 'w-40 h-40 bg-black/80 border-red-500 text-red-500'
          }`}
        >
          <Trash2 className="w-12 h-12" />
          <span className="text-sm font-semibold">Σύρε εδώ για διαγραφή</span>
        </div>
      )}

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή προπόνησης;</AlertDialogTitle>
            <AlertDialogDescription>
              Θα αφαιρεθεί η προπόνηση του <strong>{pending?.userName}</strong> στις{' '}
              <strong>{pending?.date}</strong>. Αν είναι η μόνη ημέρα της ανάθεσης, η ανάθεση θα ακυρωθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 rounded-none"
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
