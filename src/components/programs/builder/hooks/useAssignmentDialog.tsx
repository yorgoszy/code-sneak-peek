
import { useState } from 'react';
import { toast } from 'sonner';
import { assignmentService } from '../services/assignmentService';
import { workoutCompletionService } from '../services/workoutCompletionService';
import { useProgramWorkoutCompletions } from '@/hooks/programs/useProgramWorkoutCompletions';
import { processTemplateForUser } from '@/utils/percentageCalculator';
import type { ProgramStructure } from './useProgramBuilderState';

export const useAssignmentDialog = (
  onCreateProgram: (program: any) => Promise<any>,
  onClose: () => void
) => {
  const [loading, setLoading] = useState(false);
  const { createWorkoutCompletions } = useProgramWorkoutCompletions();

  const handleAssignment = async (
    program: ProgramStructure,
    userIds: string[],
    trainingDates: Date[]
  ) => {
    if (!program.name?.trim()) {
      toast.error('Παρακαλώ εισάγετε όνομα προγράμματος');
      return;
    }

    if (userIds.length === 0) {
      toast.error('Παρακαλώ επιλέξτε τουλάχιστον έναν χρήστη');
      return;
    }

    if (trainingDates.length === 0) {
      toast.error('Παρακαλώ επιλέξτε ημερομηνίες προπόνησης');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🚀 [useAssignmentDialog] Starting assignment process');
      console.log('🚀 [useAssignmentDialog] Program structure:', {
        name: program.name,
        weeks: program.weeks?.length || 0,
        userIds: userIds.length,
        trainingDates: trainingDates.length
      });

      // 🚨 ΚΡΙΤΙΚΟΣ ΕΛΕΓΧΟΣ: Έλεγχος σειράς ασκήσεων πριν την ανάθεση
      console.log('🚨 [ASSIGNMENT DIALOG] Checking exercise order before assignment:');
      program.weeks?.forEach((week, wIndex) => {
        console.log(`🚨 [ASSIGNMENT DIALOG] Week ${wIndex + 1}: ${week.name}`);
        week.program_days?.forEach((day, dIndex) => {
          console.log(`🚨 [ASSIGNMENT DIALOG] Day ${dIndex + 1}: ${day.name}`);
          day.program_blocks?.forEach((block, bIndex) => {
            console.log(`🚨 [ASSIGNMENT DIALOG] Block ${bIndex + 1}: ${block.name} - ${block.program_exercises?.length || 0} exercises`);
            const exercises = block.program_exercises || [];
            
            console.log(`🚨 [ASSIGNMENT DIALOG] Exercise order before assignment:`);
            exercises.forEach((ex, eIndex) => {
              console.log(`🚨 [ASSIGNMENT DIALOG]   ${eIndex + 1}. ${ex.exercises?.name} (order: ${ex.exercise_order})`);
            });
            
            // Έλεγχος αν οι ασκήσεις είναι ταξινομημένες σωστά
            const sortedExercises = [...exercises].sort((a, b) => {
              const orderA = Number(a.exercise_order) || 0;
              const orderB = Number(b.exercise_order) || 0;
              return orderA - orderB;
            });
            
            const isOrderCorrect = exercises.every((ex, index) => {
              const sortedEx = sortedExercises[index];
              return ex.id === sortedEx.id;
            });
            
            if (!isOrderCorrect) {
              console.error(`🚨 [ASSIGNMENT DIALOG ERROR] Exercise order is WRONG in block: ${block.name} before assignment!`);
            } else {
              console.log(`✅ [ASSIGNMENT DIALOG OK] Exercise order is correct in block: ${block.name}`);
            }
          });
        });
      });

      // Αποθήκευση του προγράμματος πρώτα
      console.log('💾 [useAssignmentDialog] Saving program first...');
      const savedProgram = await onCreateProgram(program);
      console.log('✅ [useAssignmentDialog] Program saved:', savedProgram);

      const assignments = [];
      const allWorkoutCompletions = [];

      // Δημιουργία assignments για κάθε χρήστη
      for (const userId of userIds) {
        console.log(`👤 [useAssignmentDialog] Processing assignment for user: ${userId}`);
        
        // 🔄 Αν είναι template, επεξεργαζόμαστε το πρόγραμμα για τον χρήστη
        let processedProgram = savedProgram;
        if ((program as any).is_template) {
          console.log(`🎯 [useAssignmentDialog] Processing template for user ${userId} with %1RM calculations...`);
          processedProgram = await processTemplateForUser(savedProgram, userId);
          console.log(`✅ [useAssignmentDialog] Template processed for user ${userId}`);
        }
        
        const trainingDatesStrings = trainingDates.map(date => {
          const localDate = new Date(date);
          localDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
          return localDate.toISOString().split('T')[0];
        });

        console.log(`📅 [useAssignmentDialog] Training dates for user ${userId}:`, trainingDatesStrings);

        const assignmentData = {
          program: processedProgram,
          userId: userId,
          trainingDates: trainingDatesStrings
        };

        console.log(`🔄 [useAssignmentDialog] Creating assignment for user ${userId}...`);
        const assignment = await assignmentService.saveAssignment(assignmentData);
        assignments.push(assignment[0]);
        console.log(`✅ [useAssignmentDialog] Assignment created for user ${userId}:`, assignment[0]);

        // Δημιουργία workout completions
        console.log(`📋 [useAssignmentDialog] Creating workout completions for user ${userId}...`);
        const completions = await createWorkoutCompletions(
          assignment[0].id,
          userId,
          processedProgram.id,
          trainingDatesStrings,
          program
        );
        allWorkoutCompletions.push(...completions);
        console.log(`✅ [useAssignmentDialog] Workout completions created for user ${userId}:`, completions.length);
      }

      console.log('🎉 [useAssignmentDialog] All assignments completed successfully');
      console.log('📊 [useAssignmentDialog] Summary:', {
        programId: savedProgram.id,
        assignmentsCreated: assignments.length,
        workoutCompletionsCreated: allWorkoutCompletions.length
      });

      toast.success(`Πρόγραμμα ανατέθηκε επιτυχώς σε ${userIds.length} χρήστες`);
      onClose();
      
    } catch (error) {
      console.error('❌ [useAssignmentDialog] Error in assignment process:', error);
      toast.error('Σφάλμα κατά την ανάθεση του προγράμματος');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleAssignment
  };
};
