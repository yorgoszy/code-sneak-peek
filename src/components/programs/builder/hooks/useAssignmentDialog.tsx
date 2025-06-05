
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useProgramWorkoutCompletions } from "@/hooks/programs/useProgramWorkoutCompletions";
import type { ProgramStructure } from './useProgramBuilderState';
import type { User } from '../../types';

interface UseAssignmentDialogProps {
  onCreateProgram: (program: any) => Promise<any>;
  onOpenChange: () => void;
  program: ProgramStructure;
  users: User[];
}

export const useAssignmentDialog = ({
  onCreateProgram,
  onOpenChange,
  program,
  users
}: UseAssignmentDialogProps) => {
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const { createWorkoutCompletions } = useProgramWorkoutCompletions();

  const handleOpenAssignments = async () => {
    try {
      console.log('🔄 Opening assignments dialog - saving program first...');
      
      if (!program.name?.trim()) {
        toast.error('Παρακαλώ εισάγετε όνομα προγράμματος');
        return;
      }

      // Έλεγχος αν υπάρχουν επαρκείς ημερομηνίες
      const totalDays = program.weeks.reduce((total, week) => total + week.days.length, 0);
      if (program.training_dates.length < totalDays) {
        toast.error(`Παρακαλώ επιλέξτε ${totalDays} ημερομηνίες προπόνησης`);
        return;
      }

      // Μετατροπή training_dates σε string array για την αποθήκευση
      const trainingDatesStrings = program.training_dates.map(date => 
        date.toISOString().split('T')[0]
      );

      // Αποθήκευση του προγράμματος ως ενεργό
      const savedProgram = await onCreateProgram({
        ...program,
        training_dates: trainingDatesStrings,
        status: 'active'
      });
      
      console.log('✅ Program saved as active:', savedProgram);
      setAssignmentDialogOpen(true);
      
    } catch (error) {
      console.error('❌ Error saving program for assignment:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος');
    }
  };

  const handleAssign = async (userId: string, trainingDates: string[]) => {
    try {
      console.log('🔄 Assigning program to user:', { userId, trainingDates });

      if (!program.id) {
        toast.error('Πρέπει πρώτα να αποθηκευτεί το πρόγραμμα');
        return;
      }

      // Δημιουργία assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('program_assignments')
        .insert({
          program_id: program.id,
          user_id: userId,
          training_dates: trainingDates,
          status: 'active',
          assignment_type: 'individual',
          progress: 0
        })
        .select()
        .single();

      if (assignmentError) {
        console.error('❌ Error creating assignment:', assignmentError);
        throw assignmentError;
      }

      console.log('✅ Assignment created:', assignment);

      // Δημιουργία workout completions
      await createWorkoutCompletions(
        assignment.id,
        userId,
        program.id,
        trainingDates,
        program
      );

      toast.success('Το πρόγραμμα ανατέθηκε επιτυχώς!');
      setAssignmentDialogOpen(false);
      onOpenChange();

    } catch (error) {
      console.error('❌ Error assigning program:', error);
      toast.error('Σφάλμα κατά την ανάθεση του προγράμματος');
    }
  };

  // Φιλτράρισμα χρηστών - αφαιρούμε τον ήδη επιλεγμένο
  const availableUsers = users.filter(user => user.id !== program.user_id);

  return {
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    handleOpenAssignments,
    handleAssign,
    availableUsers
  };
};
