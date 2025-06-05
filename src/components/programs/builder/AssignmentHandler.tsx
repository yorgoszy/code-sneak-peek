
import { toast } from "sonner";
import type { ProgramStructure } from './hooks/useProgramBuilderState';
import { programService } from './services/programService';
import { assignmentService } from './services/assignmentService';
import { workoutCompletionService } from './services/workoutCompletionService';

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

      // 1. Αποθήκευση προγράμματος
      const savedProgram = await programService.saveProgram(program);

      // 2. Αποθήκευση δομής προγράμματος
      await programService.saveProgramStructure(savedProgram, program);

      // 3. Μετατροπή ημερομηνιών σε strings
      const trainingDatesStrings = (program.training_dates || []).map(date => {
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        return date;
      });

      // 4. Δημιουργία ανάθεσης
      const assignment = await assignmentService.createAssignment(
        savedProgram,
        program.user_id,
        trainingDatesStrings
      );

      // 5. Δημιουργία workout completions
      await workoutCompletionService.createWorkoutCompletions(
        assignment,
        savedProgram,
        program.user_id,
        trainingDatesStrings,
        program
      );

      console.log('✅ Ανάθεση ολοκληρώθηκε επιτυχώς');
      toast.success('Το πρόγραμμα ανατέθηκε επιτυχώς!');

      // 6. Κλείσιμο dialog και refresh των δεδομένων
      window.location.href = '/dashboard/active-programs';

    } catch (error) {
      console.error('❌ Απροσδόκητο σφάλμα:', error);
      toast.error('Απροσδόκητο σφάλμα κατά την ανάθεση');
    }
  };

  return { handleAssignment };
};
