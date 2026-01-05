
import { toast } from "sonner";
import { formatDateForStorage } from '@/utils/dateUtils';
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
      
      // Έλεγχος χρηστών ανάλογα με τον τύπο ανάθεσης
      if (program.is_multiple_assignment) {
        if (!program.user_ids || program.user_ids.length === 0) {
          console.error('❌ Λείπει η επιλογή αθλητών');
          toast.error('Η επιλογή αθλητών είναι υποχρεωτική');
          return;
        }
      } else {
        if (!program.user_id) {
          console.error('❌ Λείπει η επιλογή αθλητή');
          toast.error('Η επιλογή αθλητή είναι υποχρεωτική');
          return;
        }
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

      // ΔΙΟΡΘΩΣΗ: 2. Μετατροπή ημερομηνιών σε strings με σωστή χρήση type annotation
      const trainingDatesStrings = (program.training_dates || []).map((date: Date | string) => {
        if (date instanceof Date) {
          return formatDateForStorage(date);
        }
        // Αν είναι ήδη string, αφαιρούμε το timestamp αν υπάρχει
        const dateStr = date as string;
        return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      });

      // 3. Δημιουργία αναθέσεων
      const isTemplate = !!(program as any).is_template;
      
      if (program.is_multiple_assignment && program.user_ids) {
        // Πολλαπλή ανάθεση
        console.log('👥 Δημιουργία πολλαπλών αναθέσεων...');
        toast.info(`Δημιουργία αναθέσεων για ${program.user_ids.length} αθλητές...`);
        
        const assignments = [];
        for (let i = 0; i < program.user_ids.length; i++) {
          const userId = program.user_ids[i];
          
          // Για templates: κάθε χρήστης χρειάζεται δικό του program
          let programForUser = savedProgram;
          if (isTemplate) {
            console.log(`🎯 Creating unique program for user ${userId} (template mode)...`);
            const userProgram = await programService.saveProgram({
              ...program,
              name: `${program.name} - ${userId.slice(0, 8)}`,
            });
            programForUser = userProgram;
          }
          
          const assignmentData = {
            program: {
              ...programForUser,
              weeks: program.weeks
            },
            userId,
            trainingDates: trainingDatesStrings,
          };

          console.log('📋 Creating assignment for user:', userId);
          const assignment = await assignmentService.saveAssignment(assignmentData);
          assignments.push(assignment);

          // Δημιουργία workout completions για κάθε χρήστη
          if (assignment && assignment.length > 0) {
            console.log('📊 Δημιουργία workout completions για χρήστη:', userId);
            await workoutCompletionService.createWorkoutCompletions(
              assignment[0],
              programForUser,
              userId,
              trainingDatesStrings,
              program
            );
          }
        }

        console.log('🎉 Πολλαπλή ανάθεση ολοκληρώθηκε επιτυχώς');
        toast.success(`Το πρόγραμμα ανατέθηκε επιτυχώς σε ${program.user_ids.length} αθλητές!`);
      } else {
        // Μονή ανάθεση
        console.log('👤 Δημιουργία ατομικής ανάθεσης...');
        const assignmentData = {
          program: {
            ...savedProgram,
            weeks: program.weeks
          },
          userId: program.user_id!,
          trainingDates: trainingDatesStrings
        };
        
        console.log('📋 Assignment data:', assignmentData);
        toast.info('Δημιουργία ανάθεσης...');

        const assignment = await assignmentService.saveAssignment(assignmentData);
        console.log('✅ Ανάθεση δημιουργήθηκε:', assignment);

        // Δημιουργία workout completions
        if (assignment && assignment.length > 0) {
          console.log('📊 Δημιουργία workout completions...');
          await workoutCompletionService.createWorkoutCompletions(
            assignment[0],
            savedProgram,
            program.user_id!,
            trainingDatesStrings,
            program
          );
        }

        console.log('🎉 Ανάθεση ολοκληρώθηκε επιτυχώς');
        toast.success('Το πρόγραμμα ανατέθηκε επιτυχώς!');
      }

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
