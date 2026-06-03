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
      console.log('🔄 Έναρξη αποθήκευσης αλλαγών προγράμματος...');
      
      // Συλλογή όλων των updates σε arrays
      const weekUpdates: any[] = [];
      const dayUpdates: any[] = [];
      const blockUpdates: any[] = [];
      const exerciseUpdates: any[] = [];

      // Προετοιμασία όλων των updates
      for (const week of programData.program_weeks || []) {
        weekUpdates.push({
          id: week.id,
          name: week.name,
          updated_at: new Date().toISOString()
        });

        for (const day of week.program_days || []) {
          dayUpdates.push({
            id: day.id,
            name: day.name,
            estimated_duration_minutes: day.estimated_duration_minutes,
            is_test_day: day.is_test_day ?? false,
            test_types: day.test_types ?? [],
            is_competition_day: day.is_competition_day ?? false,
            updated_at: new Date().toISOString()
          });

          for (const block of day.program_blocks || []) {
            blockUpdates.push({
              id: block.id,
              name: block.name,
              training_type: block.training_type,
              workout_format: block.workout_format,
              workout_duration: block.workout_duration,
              block_sets: block.block_sets,
              updated_at: new Date().toISOString()
            });

            for (const exercise of block.program_exercises || []) {
              exerciseUpdates.push({
                id: exercise.id,
                sets: exercise.sets,
                reps: exercise.reps,
                kg: exercise.kg,
                percentage_1rm: exercise.percentage_1rm,
                tempo: exercise.tempo,
                rest: exercise.rest,
                notes: exercise.notes,
                velocity_ms: exercise.velocity_ms,
                kg_mode: exercise.kg_mode,
                reps_mode: exercise.reps_mode,
                updated_at: new Date().toISOString()
              });
            }
          }
        }
      }

      // Εκτέλεση όλων των updates παράλληλα
      await Promise.all([
        // Program update
        supabase
          .from('programs')
          .update({
            name: programData.name,
            description: programData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', programData.id),

        // Batch week updates
        ...weekUpdates.map(week =>
          supabase
            .from('program_weeks')
            .update({ name: week.name, updated_at: week.updated_at })
            .eq('id', week.id)
        ),

        // Batch day updates
        ...dayUpdates.map(day =>
          supabase
            .from('program_days')
            .update({
              name: day.name,
              estimated_duration_minutes: day.estimated_duration_minutes,
              is_test_day: day.is_test_day,
              test_types: day.test_types,
              is_competition_day: day.is_competition_day,
              updated_at: day.updated_at
            })
            .eq('id', day.id)
        ),

        // Batch block updates
        ...blockUpdates.map(block =>
          supabase
            .from('program_blocks')
            .update({ 
              name: block.name,
              training_type: block.training_type,
              workout_format: block.workout_format,
              workout_duration: block.workout_duration,
              block_sets: block.block_sets,
              updated_at: block.updated_at 
            })
            .eq('id', block.id)
        ),

        // Batch exercise updates
        ...exerciseUpdates.map(exercise =>
          supabase
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
              kg_mode: exercise.kg_mode,
              reps_mode: exercise.reps_mode,
              updated_at: exercise.updated_at
            })
            .eq('id', exercise.id)
        )
      ]);

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

  const addNewBlock = async (dayId: string, setProgramData: (data: any) => void, trainingType?: string) => {
    try {
      // Βρες το μέγιστο block_order για αυτή την ημέρα
      const updatedProgram = { ...programData };
      const week = updatedProgram.program_weeks?.find((w: any) => 
        w.program_days?.some((d: any) => d.id === dayId)
      );
      const day = week?.program_days?.find((d: any) => d.id === dayId);
      const existingBlocks = day?.program_blocks || [];
      const maxOrder = existingBlocks.length > 0 
        ? Math.max(...existingBlocks.map((b: any) => b.block_order || 0)) 
        : 0;

      // Χρήση του training type για το όνομα
      const blockName = trainingType || 'str';
      
      const { data, error } = await supabase
        .from('program_blocks')
        .insert({
          day_id: dayId,
          name: blockName,
          training_type: blockName,
          block_order: maxOrder + 1
        })
        .select()
        .single();

      if (error) throw error;

      // Ενημέρωση του local state
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
          reps: '',
          kg: '',
          percentage_1rm: null,
          tempo: '',
          rest: '',
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

  const updateBlockTrainingType = async (blockId: string, trainingType: string, setProgramData: (data: any) => void) => {
    try {
      const { error } = await supabase
        .from('program_blocks')
        .update({
          training_type: trainingType,
          name: trainingType,
          updated_at: new Date().toISOString()
        })
        .eq('id', blockId);

      if (error) throw error;

      // Ενημέρωση του local state
      const updatedProgram = { ...programData };
      for (const week of updatedProgram.program_weeks || []) {
        for (const day of week.program_days || []) {
          const block = day.program_blocks?.find((b: any) => b.id === blockId);
          if (block) {
            block.training_type = trainingType;
            block.name = trainingType;
          }
        }
      }
      setProgramData(updatedProgram);

    } catch (error) {
      console.error('❌ Σφάλμα κατά την ενημέρωση training type:', error);
      toast.error('Σφάλμα κατά την ενημέρωση training type');
    }
  };

  const updateBlockFormat = async (blockId: string, format: string, setProgramData: (data: any) => void) => {
    try {
      const { error } = await supabase
        .from('program_blocks')
        .update({
          workout_format: format,
          updated_at: new Date().toISOString()
        })
        .eq('id', blockId);

      if (error) throw error;

      // Ενημέρωση του local state
      const updatedProgram = { ...programData };
      for (const week of updatedProgram.program_weeks || []) {
        for (const day of week.program_days || []) {
          const block = day.program_blocks?.find((b: any) => b.id === blockId);
          if (block) {
            block.workout_format = format;
          }
        }
      }
      setProgramData(updatedProgram);

    } catch (error) {
      console.error('❌ Σφάλμα κατά την ενημέρωση format:', error);
      toast.error('Σφάλμα κατά την ενημέρωση format');
    }
  };

  const updateBlockDuration = async (blockId: string, duration: string, setProgramData: (data: any) => void) => {
    try {
      const { error } = await supabase
        .from('program_blocks')
        .update({
          workout_duration: duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', blockId);

      if (error) throw error;

      // Ενημέρωση του local state
      const updatedProgram = { ...programData };
      for (const week of updatedProgram.program_weeks || []) {
        for (const day of week.program_days || []) {
          const block = day.program_blocks?.find((b: any) => b.id === blockId);
          if (block) {
            block.workout_duration = duration;
          }
        }
      }
      setProgramData(updatedProgram);

    } catch (error) {
      console.error('❌ Σφάλμα κατά την ενημέρωση duration:', error);
      toast.error('Σφάλμα κατά την ενημέρωση duration');
    }
  };

  const updateBlockSets = async (blockId: string, sets: number, setProgramData: (data: any) => void) => {
    try {
      const { error } = await supabase
        .from('program_blocks')
        .update({
          block_sets: sets,
          updated_at: new Date().toISOString()
        })
        .eq('id', blockId);

      if (error) throw error;

      // Ενημέρωση του local state
      const updatedProgram = { ...programData };
      for (const week of updatedProgram.program_weeks || []) {
        for (const day of week.program_days || []) {
          const block = day.program_blocks?.find((b: any) => b.id === blockId);
          if (block) {
            block.block_sets = sets;
          }
        }
      }
      setProgramData(updatedProgram);

    } catch (error) {
      console.error('❌ Σφάλμα κατά την ενημέρωση sets:', error);
      toast.error('Σφάλμα κατά την ενημέρωση sets');
    }
  };

  // ============ PASTE OPERATIONS ============

  // Εισάγει ένα block (με ασκήσεις) σε υπάρχουσα ημέρα
  const insertBlockIntoDay = async (dayId: string, sourceBlock: any, orderOffset: number) => {
    const { data: newBlock, error: blockErr } = await supabase
      .from('program_blocks')
      .insert({
        day_id: dayId,
        name: sourceBlock.name || sourceBlock.training_type || 'str',
        training_type: sourceBlock.training_type,
        workout_format: sourceBlock.workout_format,
        workout_duration: sourceBlock.workout_duration,
        block_sets: sourceBlock.block_sets,
        block_order: (sourceBlock.block_order ?? 0) + orderOffset,
      })
      .select()
      .single();
    if (blockErr) throw blockErr;

    const sourceExercises = sourceBlock.program_exercises || [];
    const insertedExercises: any[] = [];
    if (sourceExercises.length > 0) {
      const exerciseRows = sourceExercises.map((ex: any, idx: number) => ({
        block_id: newBlock.id,
        exercise_id: ex.exercise_id,
        sets: ex.sets ?? 1,
        reps: ex.reps ?? '',
        kg: ex.kg ?? '',
        percentage_1rm: ex.percentage_1rm ?? null,
        tempo: ex.tempo ?? '',
        rest: ex.rest ?? '',
        notes: ex.notes ?? '',
        velocity_ms: ex.velocity_ms ?? null,
        kg_mode: ex.kg_mode ?? null,
        reps_mode: ex.reps_mode ?? null,
        exercise_order: ex.exercise_order ?? idx + 1,
      }));
      const { data: newExercises, error: exErr } = await supabase
        .from('program_exercises')
        .insert(exerciseRows)
        .select();
      if (exErr) throw exErr;

      // attach exercises metadata for display
      const exerciseIds = Array.from(new Set(exerciseRows.map(r => r.exercise_id).filter(Boolean)));
      let exerciseDetails: Record<string, any> = {};
      if (exerciseIds.length > 0) {
        const { data: exData } = await supabase
          .from('exercises')
          .select('*')
          .in('id', exerciseIds);
        (exData || []).forEach((e: any) => { exerciseDetails[e.id] = e; });
      }
      (newExercises || []).forEach((ex: any) => {
        insertedExercises.push({ ...ex, exercises: exerciseDetails[ex.exercise_id] });
      });
    }

    return { ...newBlock, program_exercises: insertedExercises };
  };

  const pasteBlockToDay = async (dayId: string, sourceBlock: any, setProgramData: (data: any) => void) => {
    try {
      const updatedProgram = { ...programData };
      const day = updatedProgram.program_weeks
        ?.flatMap((w: any) => w.program_days || [])
        .find((d: any) => d.id === dayId);
      const existingBlocks = day?.program_blocks || [];
      const maxOrder = existingBlocks.length > 0
        ? Math.max(...existingBlocks.map((b: any) => b.block_order || 0))
        : 0;
      const newBlock = await insertBlockIntoDay(dayId, sourceBlock, maxOrder + 1 - (sourceBlock.block_order ?? 0));
      if (day) {
        day.program_blocks = [...existingBlocks, newBlock];
        setProgramData(updatedProgram);
      }
      toast.success('Block επικολλήθηκε');
    } catch (error: any) {
      console.error('❌ Σφάλμα paste block:', error);
      toast.error(`Σφάλμα paste block: ${error?.message || ''}`);
    }
  };

  const pasteDayContent = async (dayId: string, sourceDay: any, setProgramData: (data: any) => void) => {
    try {
      // Διαγραφή υπαρχόντων blocks (cascade σε exercises)
      const { error: delErr } = await supabase
        .from('program_blocks')
        .delete()
        .eq('day_id', dayId);
      if (delErr) throw delErr;

      const sourceBlocks = sourceDay.program_blocks || [];
      const newBlocks: any[] = [];
      for (let i = 0; i < sourceBlocks.length; i++) {
        const sb = sourceBlocks[i];
        const inserted = await insertBlockIntoDay(dayId, { ...sb, block_order: i + 1 }, 0);
        newBlocks.push(inserted);
      }

      const updatedProgram = { ...programData };
      const day = updatedProgram.program_weeks
        ?.flatMap((w: any) => w.program_days || [])
        .find((d: any) => d.id === dayId);
      if (day) {
        day.program_blocks = newBlocks;
        setProgramData(updatedProgram);
      }
      toast.success('Ημέρα επικολλήθηκε');
    } catch (error: any) {
      console.error('❌ Σφάλμα paste day:', error);
      toast.error(`Σφάλμα paste day: ${error?.message || ''}`);
    }
  };

  const pasteWeekContent = async (weekId: string, sourceWeek: any, setProgramData: (data: any) => void) => {
    try {
      const updatedProgram = { ...programData };
      const targetWeek = updatedProgram.program_weeks?.find((w: any) => w.id === weekId);
      if (!targetWeek) return;
      const targetDays = [...(targetWeek.program_days || [])].sort(
        (a: any, b: any) => (a.day_number || 0) - (b.day_number || 0)
      );
      const sourceDays = [...(sourceWeek.program_days || [])].sort(
        (a: any, b: any) => (a.day_number || 0) - (b.day_number || 0)
      );
      const pairs = Math.min(targetDays.length, sourceDays.length);
      for (let i = 0; i < pairs; i++) {
        await pasteDayContent(targetDays[i].id, sourceDays[i], setProgramData);
      }
      if (sourceDays.length > targetDays.length) {
        toast.info(`Η εβδομάδα-πηγή είχε ${sourceDays.length} ημέρες· επικολλήθηκαν μόνο οι πρώτες ${pairs}`);
      } else {
        toast.success('Εβδομάδα επικολλήθηκε');
      }
    } catch (error: any) {
      console.error('❌ Σφάλμα paste week:', error);
      toast.error(`Σφάλμα paste week: ${error?.message || ''}`);
    }
  };

  return {
    saveChanges,
    addNewBlock,
    removeBlock,
    addExercise,
    removeExercise,
    updateExercise,
    reorderDays,
    updateBlockTrainingType,
    updateBlockFormat,
    updateBlockDuration,
    updateBlockSets,
    pasteBlockToDay,
    pasteDayContent,
    pasteWeekContent,
  };
};
