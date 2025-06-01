
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { ProgramStructure } from "@/components/programs/types";

export const useProgramSave = () => {
  const [loading, setLoading] = useState(false);

  const saveProgram = async (programData: ProgramStructure): Promise<void> => {
    try {
      setLoading(true);
      console.log('💾 Starting program save...', programData);

      // Prepare program data for database
      const programPayload = {
        name: programData.name,
        description: programData.description || null,
        user_id: programData.user_id || null,
        start_date: programData.start_date ? programData.start_date.toISOString().split('T')[0] : null,
        status: programData.status || 'draft'
      };

      let programId: string;

      if (programData.id) {
        // Update existing program
        console.log('🔄 Updating existing program:', programData.id);
        const { error: updateError } = await supabase
          .from('programs')
          .update(programPayload)
          .eq('id', programData.id);

        if (updateError) {
          console.error('❌ Error updating program:', updateError);
          throw updateError;
        }
        programId = programData.id;
      } else {
        // Create new program
        console.log('➕ Creating new program');
        const { data: newProgram, error: insertError } = await supabase
          .from('programs')
          .insert(programPayload)
          .select('id')
          .single();

        if (insertError || !newProgram) {
          console.error('❌ Error creating program:', insertError);
          throw insertError;
        }
        programId = newProgram.id;
      }

      console.log('✅ Program saved with ID:', programId);

      // Save weeks structure if provided
      if (programData.weeks && programData.weeks.length > 0) {
        await saveWeeksStructure(programId, programData.weeks);
      }

      // Handle program assignments with training dates
      if (programData.training_dates && programData.training_dates.length > 0 && programData.user_id) {
        await handleProgramAssignment(programId, programData.user_id, programData.training_dates);
      }

      console.log('✅ Program saved successfully');
    } catch (error) {
      console.error('❌ Error saving program:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveWeeksStructure = async (programId: string, weeks: any[]) => {
    console.log('💾 Saving weeks structure for program:', programId);

    // Delete existing weeks and their children
    const { error: deleteError } = await supabase
      .from('program_weeks')
      .delete()
      .eq('program_id', programId);

    if (deleteError) {
      console.error('❌ Error deleting existing weeks:', deleteError);
      throw deleteError;
    }

    // Save new weeks
    for (const week of weeks) {
      const { data: savedWeek, error: weekError } = await supabase
        .from('program_weeks')
        .insert({
          program_id: programId,
          name: week.name,
          week_number: week.week_number
        })
        .select('id')
        .single();

      if (weekError || !savedWeek) {
        console.error('❌ Error saving week:', weekError);
        throw weekError;
      }

      // Save days for this week
      if (week.program_days && week.program_days.length > 0) {
        await saveDaysStructure(savedWeek.id, week.program_days);
      }
    }
  };

  const saveDaysStructure = async (weekId: string, days: any[]) => {
    for (const day of days) {
      const { data: savedDay, error: dayError } = await supabase
        .from('program_days')
        .insert({
          week_id: weekId,
          name: day.name,
          day_number: day.day_number
        })
        .select('id')
        .single();

      if (dayError || !savedDay) {
        console.error('❌ Error saving day:', dayError);
        throw dayError;
      }

      // Save blocks for this day
      if (day.program_blocks && day.program_blocks.length > 0) {
        await saveBlocksStructure(savedDay.id, day.program_blocks);
      }
    }
  };

  const saveBlocksStructure = async (dayId: string, blocks: any[]) => {
    for (const block of blocks) {
      const { data: savedBlock, error: blockError } = await supabase
        .from('program_blocks')
        .insert({
          day_id: dayId,
          name: block.name,
          block_order: block.block_order
        })
        .select('id')
        .single();

      if (blockError || !savedBlock) {
        console.error('❌ Error saving block:', blockError);
        throw blockError;
      }

      // Save exercises for this block
      if (block.program_exercises && block.program_exercises.length > 0) {
        await saveExercisesStructure(savedBlock.id, block.program_exercises);
      }
    }
  };

  const saveExercisesStructure = async (blockId: string, exercises: any[]) => {
    for (const exercise of exercises) {
      const { error: exerciseError } = await supabase
        .from('program_exercises')
        .insert({
          block_id: blockId,
          exercise_id: exercise.exercise_id,
          sets: exercise.sets,
          reps: exercise.reps || null,
          kg: exercise.kg || null,
          percentage_1rm: exercise.percentage_1rm || null,
          velocity_ms: exercise.velocity_ms || null,
          tempo: exercise.tempo || null,
          rest: exercise.rest || null,
          notes: exercise.notes || null,
          exercise_order: exercise.exercise_order
        });

      if (exerciseError) {
        console.error('❌ Error saving exercise:', exerciseError);
        throw exerciseError;
      }
    }
  };

  const handleProgramAssignment = async (programId: string, userId: string, trainingDates: string[]) => {
    console.log('📅 Handling program assignment with training dates:', trainingDates);

    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('program_assignments')
      .select('id')
      .eq('program_id', programId)
      .eq('user_id', userId)
      .single();

    const assignmentData = {
      program_id: programId,
      user_id: userId,
      status: 'active',
      training_dates: trainingDates,
      start_date: trainingDates.length > 0 ? trainingDates[0] : null,
      end_date: trainingDates.length > 0 ? trainingDates[trainingDates.length - 1] : null
    };

    if (existingAssignment) {
      // Update existing assignment
      const { error: updateError } = await supabase
        .from('program_assignments')
        .update(assignmentData)
        .eq('id', existingAssignment.id);

      if (updateError) {
        console.error('❌ Error updating program assignment:', updateError);
        throw updateError;
      }
    } else {
      // Create new assignment
      const { error: insertError } = await supabase
        .from('program_assignments')
        .insert(assignmentData);

      if (insertError) {
        console.error('❌ Error creating program assignment:', insertError);
        throw insertError;
      }
    }

    console.log('✅ Program assignment saved successfully');
  };

  return {
    loading,
    saveProgram
  };
};
