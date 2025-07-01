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

  const removeBlock = async (blockId: string, setProgramData: (data: any) => void) => {
    try {
      const { error } = await supabase
        .from('program_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      // Ενημέρωση του local state
      const updatedProgram = { ...programData };
      for (const week of updatedProgram.program_weeks || []) {
        for (const day of week.program_days || []) {
          day.program_blocks = day.program_blocks?.filter((block: any) => block.id !== blockId) || [];
        }
      }
      setProgramData(updatedProgram);

      toast.success('Το block διαγράφηκε!');
      
    } catch (error) {
      console.error('❌ Σφάλμα κατά τη διαγραφή block:', error);
      toast.error('Σφάλμα κατά τη διαγραφή block');
    }
  };

  const addExercise = async (blockId: string, exerciseId: string, setProgramData: (data: any) => void) => {
    try {
      const { data, error } = await supabase
        .from('program_exercises')
        .insert({
          block_id: blockId,
          exercise_id: exerciseId,
          sets: 1,
          reps: '8-12',
          kg: '',
          percentage_1rm: 0,
          tempo: '',
          rest: '60',
          notes: '',
          exercise_order: 1
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch exercise details
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();

      if (exerciseError) throw exerciseError;

      // Ενημέρωση του local state
      const updatedProgram = { ...programData };
      for (const week of updatedProgram.program_weeks || []) {
        for (const day of week.program_days || []) {
          const block = day.program_blocks?.find((b: any) => b.id === blockId);
          if (block) {
            if (!block.program_exercises) block.program_exercises = [];
            block.program_exercises.push({
              ...data,
              exercises: exerciseData
            });
          }
        }
      }
      setProgramData(updatedProgram);

      toast.success('Άσκηση προστέθηκε!');
      
    } catch (error) {
      console.error('❌ Σφάλμα κατά την προσθήκη άσκησης:', error);
      toast.error('Σφάλμα κατά την προσθήκη άσκησης');
    }
  };

  const removeExercise = async (exerciseId: string, setProgramData: (data: any) => void) => {
    try {
      const { error } = await supabase
        .from('program_exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;

      // Ενημέρωση του local state
      const updatedProgram = { ...programData };
      for (const week of updatedProgram.program_weeks || []) {
        for (const day of week.program_days || []) {
          for (const block of day.program_blocks || []) {
            block.program_exercises = block.program_exercises?.filter((ex: any) => ex.id !== exerciseId) || [];
          }
        }
      }
      setProgramData(updatedProgram);

      toast.success('Άσκηση διαγράφηκε!');
      
    } catch (error) {
      console.error('❌ Σφάλμα κατά τη διαγραφή άσκησης:', error);
      toast.error('Σφάλμα κατά τη διαγραφή άσκησης');
    }
  };

  const updateExercise = async (exerciseId: string, field: string, value: any, setProgramData: (data: any) => void) => {
    try {
      const { error } = await supabase
        .from('program_exercises')
        .update({
          [field]: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', exerciseId);

      if (error) throw error;

      // Ενημέρωση του local state
      const updatedProgram = { ...programData };
      for (const week of updatedProgram.program_weeks || []) {
        for (const day of week.program_days || []) {
          for (const block of day.program_blocks || []) {
            const exercise = block.program_exercises?.find((ex: any) => ex.id === exerciseId);
            if (exercise) {
              exercise[field] = value;
            }
          }
        }
      }
      setProgramData(updatedProgram);

    } catch (error) {
      console.error('❌ Σφάλμα κατά την ενημέρωση άσκησης:', error);
      toast.error('Σφάλμα κατά την ενημέρωση άσκησης');
    }
  };

  const reorderDays = async (weekId: string, oldIndex: number, newIndex: number, setProgramData: (data: any) => void) => {
    try {
      console.log('🔄 Αναδιάταξη ημερών...');
      
      // Ενημέρωση του local state
      const updatedProgram = { ...programData };
      const week = updatedProgram.program_weeks?.find((w: any) => w.id === weekId);
      
      if (week && week.program_days) {
        const days = [...week.program_days];
        const [movedDay] = days.splice(oldIndex, 1);
        days.splice(newIndex, 0, movedDay);
        
        // Ενημέρωση day_number για κάθε ημέρα
        days.forEach((day: any, index: number) => {
          day.day_number = index + 1;
        });
        
        week.program_days = days;
        setProgramData(updatedProgram);
        
        // Ενημέρωση στη βάση δεδομένων
        for (const day of days) {
          await supabase
            .from('program_days')
            .update({
              day_number: day.day_number,
              updated_at: new Date().toISOString()
            })
            .eq('id', day.id);
        }
        
        console.log('✅ Ημέρες αναδιατάχθηκαν επιτυχώς');
      }
      
    } catch (error) {
      console.error('❌ Σφάλμα κατά την αναδιάταξη ημερών:', error);
      toast.error('Σφάλμα κατά την αναδιάταξη ημερών');
    }
  };

  return {
    saveChanges,
    addNewBlock,
    removeBlock,
    addExercise,
    removeExercise,
    updateExercise,
    reorderDays
  };
};
