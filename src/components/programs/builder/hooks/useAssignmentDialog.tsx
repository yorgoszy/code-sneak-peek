
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
        id: program.id,
        name: program.name,
        weeks: program.weeks?.length || 0,
        userIds: userIds.length,
        trainingDates: trainingDates.length,
        isTemplate: (program as any).is_template
      });

      // Χρησιμοποιούμε το υπάρχον πρόγραμμα αν έχει ID, αλλιώς το δημιουργούμε
      let programToUse = program;
      
      if (!program.id) {
        // Μόνο αν δεν υπάρχει ID, δημιουργούμε νέο πρόγραμμα
        console.log('📋 [useAssignmentDialog] No program ID, creating new program...');
        const savedProgram = await onCreateProgram(program);
        programToUse = { ...program, id: savedProgram.id };
        console.log('✅ [useAssignmentDialog] Program created with ID:', savedProgram.id);
      } else {
        console.log('✅ [useAssignmentDialog] Using existing program ID:', program.id);
      }

      const assignments = [];
      const allWorkoutCompletions = [];

      // Δημιουργία assignments για κάθε χρήστη
      for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i];
        console.log(`👤 [useAssignmentDialog] Processing assignment for user: ${userId}`);

        // 🔄 Αν το πρόγραμμα είναι template, επεξεργαζόμαστε copy για κάθε χρήστη
        let processedProgram = programToUse;
        if ((program as any).is_template) {
          console.log(`🎯 [useAssignmentDialog] Processing copy for user ${userId} with %1RM calculations...`);
          const programCopyForUser = JSON.parse(JSON.stringify(programToUse));
          processedProgram = await processTemplateForUser(programCopyForUser, userId);
          console.log(`✅ [useAssignmentDialog] Copy processed for user ${userId}`);
        }

        const trainingDatesStrings = trainingDates.map(date => {
          const localDate = new Date(date);
          localDate.setHours(12, 0, 0, 0);
          return localDate.toISOString().split('T')[0];
        });

        console.log(`📅 [useAssignmentDialog] Training dates for user ${userId}:`, trainingDatesStrings);

        const assignmentData = {
          program: processedProgram,
          userId,
          trainingDates: trainingDatesStrings,
          // ✅ speed + reliability: structure is created once (first user) then reused
          skipStructureRecreation: i > 0,
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
          programToUse
        );
        allWorkoutCompletions.push(...completions);
        console.log(`✅ [useAssignmentDialog] Workout completions created for user ${userId}:`, completions.length);
      }

      console.log('🎉 [useAssignmentDialog] All assignments completed successfully');
      console.log('📊 [useAssignmentDialog] Summary:', {
        programId: programToUse.id,
        assignmentsCreated: assignments.length,
        workoutCompletionsCreated: allWorkoutCompletions.length,
        wasTemplate: (program as any).is_template
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
