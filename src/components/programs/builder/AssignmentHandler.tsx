
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
    console.log('📊 Program data:', program);
    
    try {
      // Έλεγχος απαραίτητων πεδίων
      if (!program.name?.trim()) {
        console.error('❌ Λείπει το όνομα του προγράμματος');
        toast.error('Το όνομα του προγράμματος είναι υποχρεωτικό');
        return;
      }
      
      if (!program.user_id) {
        console.error('❌ Λείπει η επιλογή αθλητή');
        toast.error('Η επιλογή αθλητή είναι υποχρεωτική');
        return;
      }

      if (!program.weeks || program.weeks.length === 0) {
        console.error('❌ Λείπουν εβδομάδες προγράμματος');
        toast.error('Το πρόγραμμα δεν έχει εβδομάδες');
        return;
      }

      const totalDays = getTotalTrainingDays ? getTotalTrainingDays() : 0;
      const selectedDatesCount = program.training_dates?.length || 0;
      
      console.log('📊 Training days check:', {
        totalDays,
        selectedDatesCount,
        trainingDates: program.training_dates
      });
      
      if (totalDays === 0) {
        console.error('❌ Δεν βρέθηκαν ημέρες προπόνησης');
        toast.error('Δεν βρέθηκαν ημέρες προπόνησης στο πρόγραμμα');
        return;
      }
      
      if (selectedDatesCount < totalDays) {
        console.error('❌ Ανεπαρκείς ημερομηνίες προπόνησης');
        toast.error(`Παρακαλώ επιλέξτε ${totalDays} ημερομηνίες προπόνησης. Έχετε επιλέξει ${selectedDatesCount}.`);
        return;
      }

      console.log('✅ Όλοι οι έλεγχοι πέρασαν, ξεκινά η αποθήκευση...');
      toast.info('Αποθήκευση προγράμματος...');

      // 1. Αποθήκευση προγράμματος
      console.log('💾 Αποθήκευση προγράμματος...');
      const savedProgram = await programService.saveProgram(program);
      console.log('✅ Πρόγραμμα αποθηκεύτηκε:', savedProgram);

      // 2. Μετατροπή ημερομηνιών σε strings
      const trainingDatesStrings = (program.training_dates || []).map(date => {
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        return date;
      });

      console.log('📅 Formatted training dates:', trainingDatesStrings);

      // 3. Δημιουργία ανάθεσης
      const assignmentData = {
        program: {
          ...savedProgram,
          weeks: program.weeks
        },
        userId: program.user_id,
        trainingDates: trainingDatesStrings
      };
      
      console.log('📋 Assignment data:', assignmentData);
      toast.info('Δημιουργία ανάθεσης...');

      const assignment = await assignmentService.saveAssignment(assignmentData);
      console.log('✅ Ανάθεση δημιουργήθηκε:', assignment);

      // 4. Δημιουργία workout completions
      if (assignment && assignment.length > 0) {
        console.log('📊 Δημιουργία workout completions...');
        await workoutCompletionService.createWorkoutCompletions(
          assignment[0],
          savedProgram,
          program.user_id,
          trainingDatesStrings,
          program
        );
      }

      console.log('🎉 Ανάθεση ολοκληρώθηκε επιτυχώς');
      toast.success('Το πρόγραμμα ανατέθηκε επιτυχώς!');

      // 5. Redirect
      setTimeout(() => {
        window.location.href = '/dashboard/active-programs';
      }, 1500);

    } catch (error) {
      console.error('❌ Detailed error during assignment:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // More detailed error messages
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          toast.error('Σφάλμα δικτύου. Ελέγξτε τη σύνδεσή σας.');
        } else if (error.message.includes('validation')) {
          toast.error('Σφάλμα επικύρωσης δεδομένων.');
        } else {
          toast.error(`Σφάλμα ανάθεσης: ${error.message}`);
        }
      } else {
        toast.error('Απροσδόκητο σφάλμα κατά την ανάθεση');
      }
    }
  };

  return { handleAssignment };
};
