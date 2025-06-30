
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

export const useEditableProgramActions = (
  programData: any,
  assignment: EnrichedAssignment | null,
  onRefresh?: () => void
) => {
  const saveChanges = async () => {
    if (!programData || !assignment) return;
    
    try {
      console.log('🔄 Αποθήκευση αλλαγών προγράμματος...');
      
      // Ενημέρωση του προγράμματος στη βάση δεδομένων
      const { error } = await supabase
        .from('programs')
        .update({
          name: programData.name,
          description: programData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', programData.id);

      if (error) throw error;

      // Ενημέρωση εβδομάδων, ημερών, blocks και ασκήσεων
      for (const week of programData.program_weeks || []) {
        await updateWeek(week);
      }

      toast.success('Οι αλλαγές αποθηκεύτηκαν επιτυχώς!');
      if (onRefresh) onRefresh();
      
    } catch (error) {
      console.error('❌ Σφάλμα κατά την αποθήκευση:', error);
      toast.error('Σφάλμα κατά την αποθήκευση των αλλαγών');
    }
  };

  const updateWeek = async (week: any) => {
    // Ενημέρωση εβδομάδας
    await supabase
      .from('program_weeks')
      .update({
        name: week.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', week.id);

    // Ενημέρωση ημερών
    for (const day of week.program_days || []) {
      await updateDay(day);
    }
  };

  const updateDay = async (day: any) => {
    // Ενημέρωση ημέρας
    await supabase
      .from('program_days')
      .update({
        name: day.name,
        estimated_duration_minutes: day.estimated_duration_minutes,
        updated_at: new Date().toISOString()
      })
      .eq('id', day.id);

    // Ενημέρωση blocks
    for (const block of day.program_blocks || []) {
      await updateBlock(block);
    }
  };

  const updateBlock = async (block: any) => {
    // Ενημέρωση block
    await supabase
      .from('program_blocks')
      .update({
        name: block.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', block.id);

    // Ενημέρωση ασκήσεων
    for (const exercise of block.program_exercises || []) {
      await supabase
        .from('program_exercises')
        .update({
          sets: exercise.sets,
          reps: exercise.reps,
          kg: exercise.kg,
          percentage_1rm: exercise.percentage_1rm,
          tempo: exercise.tempo,
          rest: exercise.rest,
          notes: exercise.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', exercise.id);
    }
  };

  const addNewBlock = async (dayId: string, setProgramData: (data: any) => void) => {
    try {
      const { data, error } = await supabase
        .from('program_blocks')
        .insert({
          day_id: dayId,
          name: 'Νέο Block',
          block_order: 1
        })
        .select()
        .single();

      if (error) throw error;

      // Ενημέρωση του local state
      const updatedProgram = { ...programData };
      const week = updatedProgram.program_weeks?.find((w: any) => 
        w.program_days?.some((d: any) => d.id === dayId)
      );
      const day = week?.program_days?.find((d: any) => d.id === dayId);
      
      if (day) {
        if (!day.program_blocks) day.program_blocks = [];
        day.program_blocks.push({
          ...data,
          program_exercises: []
        });
        setProgramData(updatedProgram);
      }

      toast.success('Νέο block προστέθηκε!');
      
    } catch (error) {
      console.error('❌ Σφάλμα κατά την προσθήκη block:', error);
      toast.error('Σφάλμα κατά την προσθήκη block');
    }
  };

  return {
    saveChanges,
    addNewBlock
  };
};
