import { supabase } from "@/integrations/supabase/client";

/**
 * Υπολογίζει τα κιλά από %1RM
 * Αν το kg είναι string με μορφή "X%1rm", υπολογίζει το πραγματικό βάρος
 */
export const calculate1RMPercentage = async (
  kg: string | undefined,
  exerciseId: string,
  userId: string
): Promise<string> => {
  if (!kg) return '';
  
  // Έλεγχος αν το kg περιέχει %1rm
  const percentageMatch = kg.match(/(\d+(?:\.\d+)?)\s*%\s*1rm/i);
  
  if (!percentageMatch) {
    // Αν δεν είναι %1RM format, επιστρέφουμε το αρχικό
    return kg;
  }
  
  const percentage = parseFloat(percentageMatch[1]);
  
  try {
    // Φέρνουμε το 1RM του χρήστη για αυτή την άσκηση
    const { data: oneRMRecords, error } = await supabase
      .from('user_exercise_1rm' as any)
      .select('weight')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .order('recorded_date', { ascending: false })
      .limit(1);
    
    if (error || !oneRMRecords || oneRMRecords.length === 0) {
      console.warn(`Δεν βρέθηκε 1RM για χρήστη ${userId} και άσκηση ${exerciseId}`);
      // Επιστρέφουμε το αρχικό string ως placeholder
      return kg;
    }
    
    const oneRM = (oneRMRecords[0] as any).weight;
    const calculatedWeight = (oneRM * percentage) / 100;
    
    // Στρογγυλοποίηση σε 2 δεκαδικά
    return calculatedWeight.toFixed(2);
  } catch (error) {
    console.error('Σφάλμα υπολογισμού %1RM:', error);
    return kg;
  }
};

/**
 * Επεξεργάζεται όλες τις ασκήσεις ενός προγράμματος και υπολογίζει %1RM
 */
export const processTemplateForUser = async (
  programData: any,
  userId: string
): Promise<any> => {
  if (!programData.program_weeks) return programData;
  
  const processedWeeks = await Promise.all(
    programData.program_weeks.map(async (week: any) => {
      if (!week.program_days) return week;
      
      const processedDays = await Promise.all(
        week.program_days.map(async (day: any) => {
          if (!day.program_blocks) return day;
          
          const processedBlocks = await Promise.all(
            day.program_blocks.map(async (block: any) => {
              if (!block.program_exercises) return block;
              
              const processedExercises = await Promise.all(
                block.program_exercises.map(async (exercise: any) => {
                  const calculatedKg = await calculate1RMPercentage(
                    exercise.kg,
                    exercise.exercise_id,
                    userId
                  );
                  
                  return {
                    ...exercise,
                    kg: calculatedKg
                  };
                })
              );
              
              return {
                ...block,
                program_exercises: processedExercises
              };
            })
          );
          
          return {
            ...day,
            program_blocks: processedBlocks
          };
        })
      );
      
      return {
        ...week,
        program_days: processedDays
      };
    })
  );
  
  return {
    ...programData,
    program_weeks: processedWeeks
  };
};
