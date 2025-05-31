
import { toast } from "sonner";
import { Program } from "@/components/programs/types";
import { saveProgram } from "./programCrudOperations";

export const duplicateProgram = async (originalProgram: Program) => {
  try {
    const duplicatedProgramData = {
      name: `${originalProgram.name} (Αντίγραφο)`,
      description: originalProgram.description,
      athlete_id: originalProgram.athlete_id,
      start_date: originalProgram.start_date,
      training_days: originalProgram.training_days,
      weeks: originalProgram.program_weeks?.map(week => ({
        name: week.name,
        week_number: week.week_number,
        days: week.program_days?.map(day => ({
          name: day.name,
          day_number: day.day_number,
          blocks: day.program_blocks?.map(block => ({
            name: block.name,
            block_order: block.block_order,
            exercises: block.program_exercises?.map(exercise => ({
              exercise_id: exercise.exercise_id,
              sets: exercise.sets,
              reps: exercise.reps,
              kg: exercise.kg,
              percentage_1rm: exercise.percentage_1rm,
              velocity_ms: exercise.velocity_ms,
              tempo: exercise.tempo,
              rest: exercise.rest,
              exercise_order: exercise.exercise_order
            })) || []
          })) || []
        })) || []
      })) || []
    };

    await saveProgram(duplicatedProgramData);
    toast.success('Το πρόγραμμα αντιγράφηκε επιτυχώς');
  } catch (error) {
    console.error('Error duplicating program:', error);
    toast.error('Σφάλμα αντιγραφής προγράμματος');
    throw error;
  }
};
