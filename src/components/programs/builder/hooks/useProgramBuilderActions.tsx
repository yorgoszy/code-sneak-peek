
import { ProgramStructure } from './useProgramBuilderState';
import { useWeekActions } from './useWeekActions';
import { useDayActions } from './useDayActions';
import { useBlockActions } from './useBlockActions';
import { useExerciseActions } from './useExerciseActions';
import { useReorderActions } from './useReorderActions';

export const useProgramBuilderActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string,
  exercises: any[],
  saveProgram?: (programData: any) => Promise<any>
) => {
  // Βελτιωμένη updateProgram που διατηρεί όλες τις βασικές πληροφορίες ΚΑΙ κάνει auto-save
  const updateProgramWithPreservation = async (updates: Partial<ProgramStructure>) => {
    const preservedUpdates = {
      ...updates,
      user_id: program.user_id, // Διατήρηση του επιλεγμένου χρήστη
      user_ids: program.user_ids, // Διατήρηση των επιλεγμένων χρηστών
      is_multiple_assignment: program.is_multiple_assignment, // Διατήρηση της λειτουργίας πολλαπλής ανάθεσης
      name: program.name, // Διατήρηση του ονόματος
      description: program.description, // Διατήρηση της περιγραφής
      training_dates: program.training_dates // Διατήρηση των επιλεγμένων ημερομηνιών
    };
    updateProgram(preservedUpdates);
    
    // 🚨 AUTO-SAVE: Αν έχουμε program.id και saveProgram function, αποθηκεύουμε αυτόματα
    if (program.id && saveProgram) {
      try {
        console.log('💾 [AUTO-SAVE] Saving program changes...', program.id);
        await saveProgram({
          ...program,
          ...preservedUpdates,
          weeks: preservedUpdates.weeks || program.weeks
        });
        console.log('✅ [AUTO-SAVE] Program saved successfully');
      } catch (error) {
        console.error('❌ [AUTO-SAVE] Error saving program:', error);
      }
    }
  };

  const weekActions = useWeekActions(program, updateProgramWithPreservation, generateId, saveProgram);
  const dayActions = useDayActions(program, updateProgramWithPreservation, generateId, saveProgram);
  const blockActions = useBlockActions(program, updateProgramWithPreservation, generateId, saveProgram);
  const exerciseActions = useExerciseActions(program, updateProgramWithPreservation, generateId, exercises, saveProgram);
  const reorderActions = useReorderActions(program, updateProgramWithPreservation);

  // Νέες λειτουργίες για πολλαπλούς χρήστες
  const handleMultipleAthleteChange = (userIds: string[]) => {
    updateProgram({ 
      user_ids: userIds,
      is_multiple_assignment: true
    });
  };

  const handleToggleAssignmentMode = (isMultiple: boolean) => {
    if (isMultiple) {
      updateProgram({ 
        is_multiple_assignment: true,
        user_id: '', // Καθαρίζουμε την ατομική επιλογή
        user_ids: program.user_ids || []
      });
    } else {
      updateProgram({ 
        is_multiple_assignment: false,
        user_ids: [], // Καθαρίζουμε την πολλαπλή επιλογή
        user_id: program.user_id || ''
      });
    }
  };

  return {
    ...weekActions,
    ...dayActions,
    ...blockActions,
    ...exerciseActions,
    ...reorderActions,
    handleMultipleAthleteChange,
    handleToggleAssignmentMode
  };
};
