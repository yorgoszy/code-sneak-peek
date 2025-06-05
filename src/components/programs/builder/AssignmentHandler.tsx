
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ProgramStructure } from './hooks/useProgramBuilderState';

interface AssignmentHandlerProps {
  program: ProgramStructure;
  getTotalTrainingDays?: () => number;
}

export const useAssignmentHandler = ({ program, getTotalTrainingDays }: AssignmentHandlerProps) => {
  const handleAssignment = async () => {
    console.log('🔄 Ξεκινάει η διαδικασία ανάθεσης...');
    
    const totalDays = getTotalTrainingDays ? getTotalTrainingDays() : 0;
    const selectedDatesCount = program.training_dates?.length || 0;
    const hasRequiredDates = selectedDatesCount >= totalDays;
    
    // Έλεγχος απαραίτητων πεδίων
    if (!program.name?.trim()) {
      toast.error('Το όνομα του προγράμματος είναι υποχρεωτικό');
      return;
    }
    
    if (!program.user_id) {
      toast.error('Η επιλογή αθλητή είναι υποχρεωτική');
      return;
    }
    
    if (totalDays === 0) {
      toast.error('Δεν βρέθηκαν ημέρες προπόνησης');
      return;
    }
    
    if (!hasRequiredDates) {
      toast.error('Δεν έχουν επιλεγεί αρκετές ημερομηνίες προπόνησης');
      return;
    }

    try {
      toast.info('Αποθήκευση προγράμματος...');

      // 1. Πρώτα αποθηκεύουμε το πρόγραμμα
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
        toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος');
        return;
      }

      console.log('✅ Πρόγραμμα αποθηκεύτηκε:', savedProgram);

      // 2. Αποθηκεύουμε τις εβδομάδες, ημέρες, blocks και ασκήσεις
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

        for (const day of week.days || []) {
          const { data: savedDay, error: dayError } = await supabase
            .from('program_days')
            .insert({
              week_id: savedWeek.id,
              name: day.name,
              day_number: day.day_number,
              estimated_duration_minutes: 60 // Default value since it doesn't exist in the Day type
            })
            .select()
            .single();

          if (dayError) {
            console.error('❌ Σφάλμα αποθήκευσης ημέρας:', dayError);
            continue;
          }

          for (const block of day.blocks || []) {
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

            for (const exercise of block.exercises || []) {
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
                  notes: '', // Default empty string since notes doesn't exist in ProgramExercise type
                  exercise_order: exercise.exercise_order
                });

              if (exerciseError) {
                console.error('❌ Σφάλμα αποθήκευσης άσκησης:', exerciseError);
              }
            }
          }
        }
      }

      // 3. Μετατροπή των ημερομηνιών σε strings
      const trainingDatesStrings = (program.training_dates || []).map(date => {
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        return date;
      });

      // 4. Υπολογισμός start_date και end_date
      const sortedDates = [...trainingDatesStrings].sort();
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];

      // 5. Δημιουργία ανάθεσης
      const { data: assignment, error: assignmentError } = await supabase
        .from('program_assignments')
        .insert({
          program_id: savedProgram.id,
          user_id: program.user_id,
          training_dates: trainingDatesStrings,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
          assignment_type: 'individual',
          progress: 0
        })
        .select()
        .single();

      if (assignmentError) {
        console.error('❌ Σφάλμα δημιουργίας ανάθεσης:', assignmentError);
        toast.error('Σφάλμα κατά την ανάθεση του προγράμματος');
        return;
      }

      // 6. Δημιουργία workout completions για κάθε ημερομηνία
      const workoutCompletions = trainingDatesStrings.map((date, index) => {
        const totalDaysInProgram = program.weeks?.reduce((total, week) => total + (week.days?.length || 0), 0) || 1;
        const weekNumber = Math.floor(index / (totalDaysInProgram / (program.weeks?.length || 1))) + 1;
        const dayNumber = (index % (totalDaysInProgram / (program.weeks?.length || 1))) + 1;

        return {
          assignment_id: assignment.id,
          user_id: program.user_id,
          program_id: savedProgram.id,
          week_number: weekNumber,
          day_number: dayNumber,
          scheduled_date: date,
          completed_date: date,
          status: 'scheduled'
        };
      });

      const { error: completionsError } = await supabase
        .from('workout_completions')
        .insert(workoutCompletions);

      if (completionsError) {
        console.error('❌ Σφάλμα δημιουργίας workout completions:', completionsError);
        toast.error('Σφάλμα κατά τη δημιουργία των προπονήσεων');
        return;
      }

      console.log('✅ Ανάθεση ολοκληρώθηκε επιτυχώς');
      toast.success('Το πρόγραμμα ανατέθηκε επιτυχώς!');

      // 7. Κλείσιμο dialog και refresh των δεδομένων
      window.location.href = '/dashboard/active-programs';

    } catch (error) {
      console.error('❌ Απροσδόκητο σφάλμα:', error);
      toast.error('Απροσδόκητο σφάλμα κατά την ανάθεση');
    }
  };

  return { handleAssignment };
};
