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
/**
 * Υπολογίζει kg από percentage_1rm (αριθμητικό πεδίο) για έναν χρήστη
 */
export const calculateKgFromPercentage1RM = async (
  percentage1rm: number | string | null | undefined,
  exerciseId: string,
  userId: string
): Promise<string> => {
  if (!percentage1rm) return '';
  
  const percentage = parseFloat(String(percentage1rm).replace(',', '.'));
  if (isNaN(percentage) || percentage <= 0) return '';
  
  try {
    // Πρώτα ψάχνουμε στο user_exercise_1rm
    const { data: oneRMRecords, error } = await supabase
      .from('user_exercise_1rm' as any)
      .select('weight')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .order('recorded_date', { ascending: false })
      .limit(1);
    
    let oneRM: number | null = null;
    
    if (!error && oneRMRecords && oneRMRecords.length > 0) {
      oneRM = (oneRMRecords[0] as any).weight;
    } else {
      // Αν δεν βρέθηκε, ψάχνουμε στις συνδεδεμένες ασκήσεις (strength_variant)
      const { data: relationships } = await supabase
        .from('exercise_relationships')
        .select('exercise_id, related_exercise_id')
        .eq('relationship_type', 'strength_variant')
        .or(`exercise_id.eq.${exerciseId},related_exercise_id.eq.${exerciseId}`);
      
      if (relationships && relationships.length > 0) {
        const linkedExerciseIds = relationships.map(rel => 
          rel.exercise_id === exerciseId ? rel.related_exercise_id : rel.exercise_id
        );
        
        const { data: linkedData } = await supabase
          .from('user_exercise_1rm' as any)
          .select('weight')
          .eq('user_id', userId)
          .in('exercise_id', linkedExerciseIds)
          .order('recorded_date', { ascending: false })
          .limit(1);
        
        if (linkedData && linkedData.length > 0) {
          oneRM = (linkedData[0] as any).weight;
        }
      }
    }
    
    if (!oneRM) {
      console.warn(`Δεν βρέθηκε 1RM για χρήστη ${userId} και άσκηση ${exerciseId}`);
      return '';
    }
    
    const calculatedWeight = (oneRM * percentage) / 100;
    let roundedWeight = Math.round(calculatedWeight);
    
    // Διασφάλιση ότι είναι άρτιος αριθμός
    if (roundedWeight % 2 !== 0) {
      const lowerEven = roundedWeight - 1;
      const upperEven = roundedWeight + 1;
      if (Math.abs(calculatedWeight - lowerEven) < Math.abs(calculatedWeight - upperEven)) {
        roundedWeight = lowerEven;
      } else {
        roundedWeight = upperEven;
      }
    }
    
    console.log(`✅ Calculated kg for user ${userId}: ${percentage}% of ${oneRM} = ${roundedWeight}kg`);
    return roundedWeight.toString();
  } catch (error) {
    console.error('Σφάλμα υπολογισμού kg από %1RM:', error);
    return '';
  }
};

/**
 * Επεξεργάζεται όλες τις ασκήσεις ενός προγράμματος και υπολογίζει %1RM ή %MAS
 */
export const processTemplateForUser = async (
  programData: any,
  userId: string
): Promise<any> => {
  // Υποστηρίζουμε και weeks και program_weeks
  const weeks = programData.program_weeks || programData.weeks;
  if (!weeks) return programData;
  
  const processedWeeks = await Promise.all(
    weeks.map(async (week: any) => {
      const days = week.program_days || [];
      if (!days.length) return week;
      
      const processedDays = await Promise.all(
        days.map(async (day: any) => {
          const blocks = day.program_blocks || [];
          if (!blocks.length) return day;
          
          const processedBlocks = await Promise.all(
            blocks.map(async (block: any) => {
              const exercises = block.program_exercises || [];
              if (!exercises.length) return block;
              
              const processedExercises = await Promise.all(
                exercises.map(async (exercise: any) => {
                  const exerciseName = exercise.exercises?.name || '';
                  
                  // 🔧 ΔΙΟΡΘΩΣΗ: Ελέγχουμε πρώτα το percentage_1rm πεδίο
                  if (exercise.percentage_1rm && parseFloat(String(exercise.percentage_1rm).replace(',', '.')) > 0) {
                    const calculatedKg = await calculateKgFromPercentage1RM(
                      exercise.percentage_1rm,
                      exercise.exercise_id,
                      userId
                    );
                    
                    if (calculatedKg) {
                      return {
                        ...exercise,
                        kg: calculatedKg
                      };
                    }
                  }
                  
                  // Fallback: Έλεγχος για kg string format (π.χ. "85%1rm")
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
  
  // Επιστρέφουμε με το ίδιο key που είχε
  if (programData.program_weeks) {
    return {
      ...programData,
      program_weeks: processedWeeks
    };
  } else {
    return {
      ...programData,
      weeks: processedWeeks
    };
  }
};
