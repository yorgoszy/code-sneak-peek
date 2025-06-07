
import { supabase } from "@/integrations/supabase/client";
import type { ProgramStructure } from '../hooks/useProgramBuilderState';

export const programService = {
  async saveProgram(program: ProgramStructure) {
    console.log('✅ Πρόγραμμα αποθηκεύτηκε:', program);

    const { data: savedProgram, error: programError } = await supabase
      .from('programs')
      .insert({
        name: program.name,
        description: program.description || '',
        status: 'active'
      })
      .select()
      .single();

    if (programError) {
      console.error('❌ Σφάλμα αποθήκευσης προγράμματος:', programError);
      throw new Error('Σφάλμα κατά την αποθήκευση του προγράμματος');
    }

    return savedProgram;
  },

  async saveProgramStructure(savedProgram: any, program: ProgramStructure) {
    for (const week of program.weeks || []) {
      const { data: savedWeek, error: weekError } = await supabase
        .from('program_weeks')
        .insert({
          program_id: savedProgram.id,
          name: week.name,
          week_number: week.week_number
        })
        .select()
        .single();

      if (weekError) {
        console.error('❌ Σφάλμα αποθήκευσης εβδομάδας:', weekError);
        continue;
      }

      for (const day of week.program_days || []) {
        const { data: savedDay, error: dayError } = await supabase
          .from('program_days')
          .insert({
            week_id: savedWeek.id,
            name: day.name,
            day_number: day.day_number,
            estimated_duration_minutes: 60
          })
          .select()
          .single();

        if (dayError) {
          console.error('❌ Σφάλμα αποθήκευσης ημέρας:', dayError);
          continue;
        }

        for (const block of day.program_blocks || []) {
          const { data: savedBlock, error: blockError } = await supabase
            .from('program_blocks')
            .insert({
              day_id: savedDay.id,
              name: block.name,
              block_order: block.block_order
            })
            .select()
            .single();

          if (blockError) {
            console.error('❌ Σφάλμα αποθήκευσης block:', blockError);
            continue;
          }

          for (const exercise of block.program_exercises || []) {
            const { error: exerciseError } = await supabase
              .from('program_exercises')
              .insert({
                block_id: savedBlock.id,
                exercise_id: exercise.exercise_id,
                sets: exercise.sets,
                reps: exercise.reps,
                kg: exercise.kg,
                percentage_1rm: exercise.percentage_1rm,
                velocity_ms: exercise.velocity_ms ? Number(exercise.velocity_ms) : null,
                tempo: exercise.tempo,
                rest: exercise.rest,
                notes: '',
                exercise_order: exercise.exercise_order
              });

            if (exerciseError) {
              console.error('❌ Σφάλμα αποθήκευσης άσκησης:', exerciseError);
            }
          }
        }
      }
    }
  }
};
