import { sanitizeSetsForDb } from '@/utils/setsSanitize';

import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Program } from '@/components/programs/types';

export const useProgramCrud = () => {
  const [loading, setLoading] = useState(false);

  const fetchPrograms = async (): Promise<Program[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          program_weeks!fk_program_weeks_program_id(
            *,
            program_days!fk_program_days_week_id(
              *,
              program_blocks!fk_program_blocks_day_id(
                *,
                program_exercises!fk_program_exercises_block_id(
                  *,
                  exercises!fk_program_exercises_exercise_id(
                    id,
                    name,
                    description
                  )
                )
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Ταξινόμηση της δομής μετά το fetch
      const sortedData = (data || []).map(program => ({
        ...program,
        program_weeks: program.program_weeks
          ?.sort((a, b) => (a.week_number || 0) - (b.week_number || 0))
          ?.map(week => ({
            ...week,
            program_days: week.program_days
              ?.sort((a, b) => (a.day_number || 0) - (b.day_number || 0))
              ?.map(day => ({
                ...day,
                program_blocks: day.program_blocks
                  ?.sort((a, b) => (a.block_order || 0) - (b.block_order || 0))
                  ?.map(block => ({
                    ...block,
                    program_exercises: block.program_exercises
                      ?.sort((a, b) => (a.exercise_order || 0) - (b.exercise_order || 0))
                  }))
              }))
          }))
      }));
      
      return sortedData as Program[];
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Σφάλμα φόρτωσης προγραμμάτων');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramsWithAssignments = async (): Promise<Program[]> => {
    setLoading(true);
    try {
      // First fetch programs with their basic structure
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select(`
          *,
          program_weeks!fk_program_weeks_program_id(
            *,
            program_days!fk_program_days_week_id(
              *,
              program_blocks!fk_program_blocks_day_id(
                *,
                program_exercises!fk_program_exercises_block_id(
                  *,
                  exercises!fk_program_exercises_exercise_id(
                    id,
                    name,
                    description
                  )
                )
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (programsError) throw programsError;

      // Then fetch assignments separately and join them manually
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('program_assignments')
        .select(`
          id,
          program_id,
          user_id,
          training_dates,
          status,
          start_date,
          end_date,
          created_at
        `);

      if (assignmentsError) throw assignmentsError;

      // Fetch user data separately
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('id, name, email, photo_url');

      if (usersError) throw usersError;

      // Manually join the data
      const programsWithAssignments = (programsData || []).map(program => {
        const assignments = (assignmentsData || [])
          .filter(assignment => assignment.program_id === program.id)
          .map(assignment => {
            const user = (usersData || []).find(user => user.id === assignment.user_id);
            return {
              ...assignment,
              app_users: user || null
            };
          });

        // Ταξινόμηση της δομής
        return {
          ...program,
          program_assignments: assignments,
          program_weeks: program.program_weeks
            ?.sort((a, b) => (a.week_number || 0) - (b.week_number || 0))
            ?.map(week => ({
              ...week,
              program_days: week.program_days
                ?.sort((a, b) => (a.day_number || 0) - (b.day_number || 0))
                ?.map(day => ({
                  ...day,
                  program_blocks: day.program_blocks
                    ?.sort((a, b) => (a.block_order || 0) - (b.block_order || 0))
                    ?.map(block => ({
                      ...block,
                      program_exercises: block.program_exercises
                        ?.sort((a, b) => (a.exercise_order || 0) - (b.exercise_order || 0))
                    }))
                }))
            }))
        };
      });

      return programsWithAssignments as Program[];
    } catch (error) {
      console.error('Error fetching programs with assignments:', error);
      toast.error('Σφάλμα φόρτωσης προγραμμάτων');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const deleteProgram = async (programId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;
      toast.success('Το πρόγραμμα διαγράφηκε επιτυχώς');
      return true;
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error('Σφάλμα διαγραφής προγράμματος');
      return false;
    }
  };

  const duplicateProgram = async (program: Program, saveProgram: (data: any) => Promise<any>) => {
    try {
      console.log('🔄 Starting program duplication for:', program.name);
      console.log('📊 Original program structure:', {
        id: program.id,
        weeksCount: program.program_weeks?.length || 0,
        structure: program.program_weeks?.map(w => ({
          weekName: w.name,
          daysCount: w.program_days?.length || 0,
          days: w.program_days?.map(d => ({
            dayName: d.name,
            blocksCount: d.program_blocks?.length || 0,
            blocks: d.program_blocks?.map(b => ({
              blockName: b.name,
              exercisesCount: b.program_exercises?.length || 0
            }))
          }))
        }))
      });

      // Δημιουργούμε τη δομή εβδομάδων με νέα IDs - ΣΥΜΠΕΡΙΛΑΜΒΑΝΟΥΜΕ ΟΛΑ ΤΑ ΠΕΔΙΑ ΤΩΝ BLOCKS
      const duplicatedWeeks = (program.program_weeks || []).map(week => ({
        id: crypto.randomUUID(),
        name: week.name,
        week_number: week.week_number,
        program_days: (week.program_days || []).map(day => ({
          id: crypto.randomUUID(),
          name: day.name,
          day_number: day.day_number,
          estimated_duration_minutes: day.estimated_duration_minutes,
          is_test_day: day.is_test_day,
          test_types: day.test_types,
          is_competition_day: day.is_competition_day,
          program_blocks: (day.program_blocks || []).map(block => ({
            id: crypto.randomUUID(),
            name: block.name,
            block_order: block.block_order,
            // ΣΗΜΑΝΤΙΚΟ: Αντιγραφή training_type, workout_format, workout_duration, block_sets
            training_type: block.training_type,
            workout_format: block.workout_format,
            workout_duration: block.workout_duration,
            block_sets: block.block_sets,
            program_exercises: (block.program_exercises || []).map(exercise => ({
              id: crypto.randomUUID(),
              exercise_id: exercise.exercise_id,
              sets: sanitizeSetsForDb(exercise.sets),
              reps: exercise.reps,
              reps_mode: exercise.reps_mode,
              kg: exercise.kg,
              kg_mode: exercise.kg_mode,
              percentage_1rm: exercise.percentage_1rm,
              velocity_ms: exercise.velocity_ms,
              tempo: exercise.tempo,
              rest: exercise.rest,
              notes: exercise.notes,
              exercise_order: exercise.exercise_order,
              exercises: exercise.exercises // Διατηρούμε την αναφορά στην άσκηση
            }))
          }))
        }))
      }));

      console.log('✅ Duplicated weeks structure created:', duplicatedWeeks.length, 'weeks');

      const duplicatedProgram = {
        ...program,
        id: undefined,
        name: `${program.name} (Αντίγραφο)`,
        user_id: null,
        created_at: undefined,
        updated_at: undefined,
        weeks: duplicatedWeeks, // Χρησιμοποιούμε τη νέα δομή
        program_weeks: undefined // Αφαιρούμε το παλιό format
      };

      console.log('💾 Saving duplicated program with structure...');
      await saveProgram(duplicatedProgram);
      
      console.log('🎉 Program duplicated successfully with full structure');
      toast.success('Το πρόγραμμα αντιγράφηκε επιτυχώς με όλη τη δομή του');
    } catch (error) {
      console.error('❌ Error duplicating program:', error);
      toast.error('Σφάλμα αντιγραφής προγράμματος');
    }
  };

  return {
    loading,
    fetchPrograms,
    fetchProgramsWithAssignments,
    deleteProgram,
    duplicateProgram
  };
};
