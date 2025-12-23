import { supabase } from "@/integrations/supabase/client";

// Cardio ασκήσεις που χρησιμοποιούν MAS αντί για 1RM
const CARDIO_EXERCISE_NAMES = [
  'run', 'running', 'τρέξιμο',
  'bikerg', 'bike erg', 'ποδήλατο',
  'woodway', 'διάδρομος',
  'skierg', 'ski erg',
  'rowerg', 'row erg', 'κωπηλατική',
  'track', 'πίστα'
];

/**
 * Ελέγχει αν η άσκηση είναι cardio (χρησιμοποιεί MAS)
 */
const isCardioExercise = (exerciseName: string): boolean => {
  const lowerName = exerciseName.toLowerCase();
  return CARDIO_EXERCISE_NAMES.some(cardio => 
    lowerName.includes(cardio.toLowerCase())
  );
};

/**
 * Φέρνει το MAS (m/s) του χρήστη για μια cardio άσκηση
 */
const getUserMAS = async (
  userId: string,
  exerciseId: string
): Promise<number | null> => {
  try {
    // Πρώτα δοκιμάζουμε με το συγκεκριμένο exercise_id
    const { data, error } = await supabase
      .from('endurance_test_sessions')
      .select(`
        endurance_test_data!endurance_test_data_test_session_id_fkey (
          mas_ms,
          exercise_id
        )
      `)
      .eq('user_id', userId)
      .order('test_date', { ascending: false })
      .limit(10);

    if (error || !data) {
      console.warn(`Σφάλμα ανάκτησης MAS για χρήστη ${userId}:`, error);
      return null;
    }

    // Ψάχνουμε για MAS με το ίδιο exercise_id
    for (const session of data) {
      const enduranceData = session.endurance_test_data as any[];
      if (enduranceData) {
        const match = enduranceData.find(ed => 
          ed.exercise_id === exerciseId && ed.mas_ms !== null
        );
        if (match) {
          return match.mas_ms;
        }
      }
    }

    // Αν δεν βρέθηκε με το ίδιο exercise_id, παίρνουμε το τελευταίο MAS
    for (const session of data) {
      const enduranceData = session.endurance_test_data as any[];
      if (enduranceData) {
        const match = enduranceData.find(ed => ed.mas_ms !== null);
        if (match) {
          return match.mas_ms;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Σφάλμα ανάκτησης MAS:', error);
    return null;
  }
};

/**
 * Υπολογίζει τα κιλά από %1RM ή την ταχύτητα από %MAS για cardio
 * Αν το kg είναι string με μορφή "X%1rm", υπολογίζει το πραγματικό βάρος/ταχύτητα
 */
export const calculate1RMPercentage = async (
  kg: string | undefined,
  exerciseId: string,
  userId: string,
  exerciseName?: string
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
    // Αν υπάρχει όνομα άσκησης, ελέγχουμε αν είναι cardio
    if (exerciseName && isCardioExercise(exerciseName)) {
      // Χρήση MAS αντί για 1RM
      const mas = await getUserMAS(userId, exerciseId);
      
      if (mas === null) {
        console.warn(`Δεν βρέθηκε MAS για χρήστη ${userId} και άσκηση ${exerciseName}`);
        return kg;
      }
      
      const calculatedSpeed = (mas * percentage) / 100;
      // Επιστρέφουμε σε m/s με 2 δεκαδικά
      return calculatedSpeed.toFixed(2);
    }
    
    // Κανονικός υπολογισμός 1RM για strength ασκήσεις
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
    
    // Κλασική στρογγυλοποίηση (0.5+ πάνω, <0.5 κάτω)
    let roundedWeight = Math.round(calculatedWeight);
    
    // Διασφάλιση ότι είναι άρτιος αριθμός
    if (roundedWeight % 2 !== 0) {
      // Βρες τον πιο κοντινό άρτιο
      const lowerEven = roundedWeight - 1;
      const upperEven = roundedWeight + 1;
      
      // Επέλεξε τον άρτιο που είναι πιο κοντά στο calculatedWeight
      if (Math.abs(calculatedWeight - lowerEven) < Math.abs(calculatedWeight - upperEven)) {
        roundedWeight = lowerEven;
      } else {
        roundedWeight = upperEven;
      }
    }
    
    return roundedWeight.toString();
  } catch (error) {
    console.error('Σφάλμα υπολογισμού %1RM/%MAS:', error);
    return kg;
  }
};

/**
 * Εξάγει αν μια άσκηση χρησιμοποιεί MAS (για χρήση σε άλλα components)
 */
export { isCardioExercise };

/**
 * Επεξεργάζεται όλες τις ασκήσεις ενός προγράμματος και υπολογίζει %1RM ή %MAS
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
                  // Παίρνουμε το όνομα της άσκησης για να ξέρουμε αν είναι cardio
                  const exerciseName = exercise.exercises?.name || '';
                  
                  const calculatedKg = await calculate1RMPercentage(
                    exercise.kg,
                    exercise.exercise_id,
                    userId,
                    exerciseName
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
