
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useProgramWorkoutCompletions } from "@/hooks/programs/useProgramWorkoutCompletions";
import type { ProgramStructure } from './useProgramBuilderState';
import type { User } from '../../types';

interface UseAssignmentDialogProps {
  users: User[];
  program: ProgramStructure;
  currentProgramId: string | null;
  onCreateProgram: (program: any) => Promise<any>;
  onDialogClose: () => void;
  editingAssignment?: {
    id: string;
    user_id: string;
    training_dates: string[];
  } | null;
}

export const useAssignmentDialog = ({
  users,
  program,
  currentProgramId,
  onCreateProgram,
  onDialogClose,
  editingAssignment
}: UseAssignmentDialogProps) => {
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const { createWorkoutCompletions } = useProgramWorkoutCompletions();

  const handleOpenAssignments = async () => {
    try {
      console.log('🔄 Opening assignments dialog - Current program state:', program);
      console.log('🔄 Current program ID:', currentProgramId);
      
      if (!program) {
        console.error('❌ No program object found');
        toast.error('Δεν βρέθηκε πρόγραμμα');
        return;
      }

      if (!program.name?.trim()) {
        toast.error('Παρακαλώ εισάγετε όνομα προγράμματος');
        return;
      }

      if (!program.weeks || program.weeks.length === 0) {
        toast.error('Παρακαλώ προσθέστε τουλάχιστον μία εβδομάδα στο πρόγραμμα');
        return;
      }

      // Έλεγχος αν υπάρχουν επαρκείς ημερομηνίες
      const totalDays = program.weeks.reduce((total, week) => total + (week.days?.length || 0), 0);
      
      // Αν δεν υπάρχουν training_dates, χρησιμοποιούμε την σημερινή ημερομηνία
      let trainingDates = program.training_dates || [];
      if (!trainingDates || trainingDates.length === 0) {
        const today = new Date();
        trainingDates = [];
        for (let i = 0; i < totalDays; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          trainingDates.push(date.toISOString().split('T')[0]);
        }
        console.log('📅 Generated training dates:', trainingDates);
      }

      if (trainingDates.length < totalDays) {
        toast.error(`Παρακαλώ επιλέξτε ${totalDays} ημερομηνίες προπόνησης`);
        return;
      }

      // Έλεγχος αν το πρόγραμμα έχει ID ή αν χρειάζεται να αποθηκευτεί
      let programId = currentProgramId || program.id;

      // Αν δεν υπάρχει programId, αποθηκεύουμε το πρόγραμμα πρώτα
      if (!programId) {
        console.log('📝 No program ID found, saving program first...');
        
        // Μετατροπή training_dates σε string array για την αποθήκευση
        const trainingDatesStrings = trainingDates.map(date => 
          typeof date === 'string' ? date : date.toISOString().split('T')[0]
        );

        // Αποθήκευση του προγράμματος ως ενεργό
        const savedProgram = await onCreateProgram({
          ...program,
          training_dates: trainingDatesStrings,
          status: 'active'
        });
        
        programId = savedProgram?.id;
        
        if (!programId) {
          console.error('❌ Failed to save program or get program ID');
          toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος');
          return;
        }
        
        console.log('✅ Program saved for assignment:', savedProgram);
      }

      console.log('✅ Opening assignment dialog with program ID:', programId);
      setAssignmentDialogOpen(true);
      
    } catch (error) {
      console.error('❌ Error preparing assignment:', error);
      toast.error('Σφάλμα κατά την προετοιμασία της ανάθεσης');
    }
  };

  const handleAssign = async (userId: string, trainingDates: string[]) => {
    try {
      console.log('🔄 Assigning program to user:', { userId, trainingDates, programId: currentProgramId || program.id });

      const programId = currentProgramId || program.id;

      if (!programId) {
        toast.error('Πρέπει πρώτα να αποθηκευτεί το πρόγραμμα');
        return;
      }

      if (!program) {
        toast.error('Δεν βρέθηκε πρόγραμμα');
        return;
      }

      // Αν είναι επεξεργασία υπάρχουσας ανάθεσης
      if (editingAssignment) {
        console.log('📝 Updating existing assignment:', editingAssignment.id);
        
        const { data: updatedAssignment, error: updateError } = await supabase
          .from('program_assignments')
          .update({
            training_dates: trainingDates,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAssignment.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating assignment:', updateError);
          throw updateError;
        }

        console.log('✅ Assignment updated:', updatedAssignment);

        // Διαγραφή υπαρχόντων workout completions και δημιουργία νέων
        await supabase
          .from('workout_completions')
          .delete()
          .eq('assignment_id', editingAssignment.id);

        await createWorkoutCompletions(
          editingAssignment.id,
          userId,
          programId,
          trainingDates,
          program
        );

        toast.success('Η ανάθεση ενημερώθηκε επιτυχώς!');
      } else {
        // Δημιουργία νέας ανάθεσης
        console.log('🆕 Creating new assignment...');
        
        const { data: assignment, error: assignmentError } = await supabase
          .from('program_assignments')
          .insert({
            program_id: programId,
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
          programId,
          trainingDates,
          program
        );

        toast.success('Το πρόγραμμα ανατέθηκε επιτυχώς!');
      }

      setAssignmentDialogOpen(false);
      onDialogClose();

    } catch (error) {
      console.error('❌ Error assigning program:', error);
      toast.error('Σφάλμα κατά την ανάθεση του προγράμματος');
    }
  };

  // Φιλτράρισμα χρηστών - αφαιρούμε τον ήδη επιλεγμένο
  const availableUsers = users.filter(user => user.id !== program?.user_id);

  return {
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    handleOpenAssignments,
    handleAssign,
    availableUsers
  };
};
