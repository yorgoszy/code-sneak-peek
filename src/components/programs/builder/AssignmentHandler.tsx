
import { toast } from "sonner";
import { formatDateForStorage } from '@/utils/dateUtils';
import type { ProgramStructure } from './hooks/useProgramBuilderState';
import { programService } from './services/programService';
import { assignmentService } from './services/assignmentService';
import { workoutCompletionService } from './services/workoutCompletionService';
import { recalculateWeeksForUser } from './services/perUserRecalculation';

/**
 * For multi-athlete warm-up blocks, swap program_exercises with the user-specific
 * list (program_exercises_by_user[userId]) before saving the program for that user.
 */
const applyUserWarmUps = (weeks: any[], userId: string): any[] => {
  return (weeks || []).map(week => ({
    ...week,
    program_days: (week.program_days || []).map((day: any) => ({
      ...day,
      program_blocks: (day.program_blocks || []).map((block: any) => {
        const { program_exercises_by_user, ...rest } = block;
        if (block.training_type === 'warm up' && program_exercises_by_user && program_exercises_by_user[userId]) {
          return { ...rest, program_exercises: program_exercises_by_user[userId] };
        }
        return rest;
      })
    }))
  }));
};

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
        // Πολλαπλή ανάθεση - κάθε χρήστης παίρνει δικό του αντίγραφο
        console.log('👥 Δημιουργία πολλαπλών αναθέσεων...');
        toast.info(`Δημιουργία αναθέσεων για ${program.user_ids.length} αθλητές...`);
        
        const assignments = [];
        for (let i = 0; i < program.user_ids.length; i++) {
          const userId = program.user_ids[i];
          
          // 🔄 Recalculate kg/m/s based on this user's personal 1RM data
          console.log(`🔄 Recalculating kg/m/s for user ${userId}...`);
          const personalizedWeeks = applyUserWarmUps(program.weeks, userId);
          const userWeeks = await recalculateWeeksForUser(personalizedWeeks, userId);
          
          // Κάθε χρήστης χρειάζεται δικό του program copy
          // ώστε τα kg/velocity να αποθηκεύονται ανεξάρτητα
          console.log(`📋 Creating unique program copy for user ${userId}...`);
          const userProgram = await programService.saveProgram({
            ...program,
            id: undefined, // Force new creation
            name: program.name,
            weeks: userWeeks,
          });
          
          const assignmentData = {
            program: {
              ...userProgram,
              weeks: userWeeks
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
              userProgram,
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
        
        // 🔄 Recalculate kg/m/s for this specific user
        console.log(`🔄 Recalculating kg/m/s for user ${program.user_id}...`);
        const personalizedWeeks = applyUserWarmUps(program.weeks, program.user_id!);
        const userWeeks = await recalculateWeeksForUser(personalizedWeeks, program.user_id!);
        
        const assignmentData = {
          program: {
            ...savedProgram,
            weeks: userWeeks
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
