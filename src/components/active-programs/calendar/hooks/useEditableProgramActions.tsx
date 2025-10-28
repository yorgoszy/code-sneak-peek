import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

export const useEditableProgramActions = (
  programData: any,
  assignment: EnrichedAssignment | null,
  onRefresh?: () => void
) => {
  const saveChanges = async () => {
    if (!programData || !assignment) {
      console.error('❌ Δεν υπάρχουν δεδομένα για αποθήκευση');
      toast.error('Δεν υπάρχουν δεδομένα για αποθήκευση');
      return;
    }
    
    try {
      console.log('🔄 Έναρξη αποθήκευσης αλλαγών προγράμματος...', {
        programId: programData.id,
        programName: programData.name,
        weeks: programData.program_weeks?.length
      });
      
      // Ενημέρωση του προγράμματος στη βάση δεδομένων
      const { error: programError } = await supabase
        .from('programs')
        .update({
          name: programData.name,
          description: programData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', programData.id);

      if (programError) {
        console.error('❌ Σφάλμα στην ενημέρωση προγράμματος:', programError);
        throw programError;
      }

      console.log('✅ Πρόγραμμα ενημερώθηκε');

      // Ενημέρωση εβδομάδων, ημερών, blocks και ασκήσεων
      for (const week of programData.program_weeks || []) {
        await updateWeek(week);
      }

      console.log('✅ Όλες οι αλλαγές αποθηκεύτηκαν επιτυχώς!');
      toast.success('Οι αλλαγές αποθηκεύτηκαν επιτυχώς!');
      if (onRefresh) onRefresh();
      
    } catch (error: any) {
      console.error('❌ Σφάλμα κατά την αποθήκευση:', error);
      toast.error(`Σφάλμα: ${error?.message || 'Αποτυχία αποθήκευσης'}`);
      throw error;
    }
  };

  const updateWeek = async (week: any) => {
    try {
      console.log(`🔄 Ενημέρωση εβδομάδας: ${week.name} (${week.id})`);
      
      // Ενημέρωση εβδομάδας
      const { error: weekError } = await supabase
        .from('program_weeks')
        .update({
          name: week.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', week.id);

      if (weekError) {
        console.error('❌ Σφάλμα στην ενημέρωση εβδομάδας:', weekError);
        throw weekError;
      }

      // Ενημέρωση ημερών
      for (const day of week.program_days || []) {
        await updateDay(day);
      }
      
      console.log(`✅ Εβδομάδα ${week.name} ενημερώθηκε`);
    } catch (error) {
      console.error('❌ Σφάλμα κατά την ενημέρωση εβδομάδας:', error);
      throw error;
    }
  };

  const updateDay = async (day: any) => {
    try {
      console.log(`  🔄 Ενημέρωση ημέρας: ${day.name} (${day.id})`);
      
      // Ενημέρωση ημέρας
      const { error: dayError } = await supabase
        .from('program_days')
        .update({
          name: day.name,
          estimated_duration_minutes: day.estimated_duration_minutes,
          is_test_day: day.is_test_day ?? false,
          test_types: day.test_types ?? [],
          updated_at: new Date().toISOString()
        })
        .eq('id', day.id);

      if (dayError) {
        console.error('❌ Σφάλμα στην ενημέρωση ημέρας:', dayError);
        throw dayError;
      }

      // Ενημέρωση blocks
      for (const block of day.program_blocks || []) {
        await updateBlock(block);
      }
      
      console.log(`  ✅ Ημέρα ${day.name} ενημερώθηκε`);
    } catch (error) {
      console.error('❌ Σφάλμα κατά την ενημέρωση ημέρας:', error);
      throw error;
    }
  };

  const updateBlock = async (block: any) => {
    try {
      console.log(`    🔄 Ενημέρωση block: ${block.name} (${block.id})`);
      
      // Ενημέρωση block
      const { error: blockError } = await supabase
        .from('program_blocks')
        .update({
          name: block.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', block.id);

      if (blockError) {
        console.error('❌ Σφάλμα στην ενημέρωση block:', blockError);
        throw blockError;
      }

      // Ενημέρωση ασκήσεων
      for (const exercise of block.program_exercises || []) {
        console.log(`      🔄 Ενημέρωση άσκησης: ${exercise.exercises?.name} (${exercise.id})`);
        
        const { error: exerciseError } = await supabase
          .from('program_exercises')
          .update({
            sets: exercise.sets,
            reps: exercise.reps,
            kg: exercise.kg,
            percentage_1rm: exercise.percentage_1rm,
            tempo: exercise.tempo,
            rest: exercise.rest,
            notes: exercise.notes,
            velocity_ms: exercise.velocity_ms,
            updated_at: new Date().toISOString()
          })
          .eq('id', exercise.id);

        if (exerciseError) {
          console.error('❌ Σφάλμα στην ενημέρωση άσκησης:', exerciseError);
          throw exerciseError;
        }
        
        console.log(`      ✅ Άσκηση ${exercise.exercises?.name} ενημερώθηκε`);
      }
      
      console.log(`    ✅ Block ${block.name} ενημερώθηκε`);
    } catch (error) {
      console.error('❌ Σφάλμα κατά την ενημέρωση block:', error);
      throw error;
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
