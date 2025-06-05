
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
      
      // Διασφαλίζουμε ότι έχουμε training_dates σε string format
      let trainingDates: string[] = [];
      if (program.training_dates && program.training_dates.length > 0) {
        trainingDates = program.training_dates.map(date => {
          if (typeof date === 'string') {
            return date;
          } else if (date instanceof Date) {
            return date.toISOString().split('T')[0];
          } else {
            // Handle any other date format
            return new Date(date).toISOString().split('T')[0];
          }
        });
      }

      // ΑΦΑΙΡΟΥΜΕ την αυτόματη δημιουργία ημερομηνιών - ο χρήστης πρέπει να τις επιλέξει
      if (trainingDates.length === 0) {
        console.log('⚠️ No training dates selected');
        toast.error('Παρακαλώ επιλέξτε ημερομηνίες προπόνησης στο ημερολόγιο');
        return;
      }

      if (trainingDates.length < totalDays) {
        toast.error(`Παρακαλώ επιλέξτε ${totalDays} ημερομηνίες προπόνησης`);
        return;
      }

      // ΠΡΩΤΑ αποθηκεύουμε το πρόγραμμα αν δεν έχει ID
      let programId = currentProgramId || program.id;

      if (!programId) {
        console.log('📝 No program ID found, saving program first...');
        
        try {
          // Διασφαλίζουμε ότι το πρόγραμμα έχει όλα τα απαραίτητα δεδομένα
          const programToSave = {
            ...program,
            training_dates: trainingDates,
            status: 'active'
          };

          console.log('💾 Saving program with data:', programToSave);
          
          // Αποθήκευση του προγράμματος ως ενεργό
          const savedProgram = await onCreateProgram(programToSave);
          
          console.log('📝 Saved program response:', savedProgram);
          
          if (!savedProgram || !savedProgram.id) {
            console.error('❌ No program ID returned from save operation');
            toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος - δεν επιστράφηκε ID');
            return;
          }
          
          programId = savedProgram.id;
          console.log('✅ Program saved successfully with ID:', programId);
          
        } catch (saveError) {
          console.error('❌ Error saving program:', saveError);
          toast.error(`Σφάλμα κατά την αποθήκευση του προγράμματος: ${saveError.message}`);
          return;
        }
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

      // Υπολογισμός start_date και end_date από τις επιλεγμένες ημερομηνίες
      const sortedDates = [...trainingDates].sort();
      const startDate = sortedDates[0]; // Πρώτη ημερομηνία
      const endDate = sortedDates[sortedDates.length - 1]; // Τελευταία ημερομηνία

      console.log('📅 Calculated dates:', { startDate, endDate, trainingDates: sortedDates });

      // Αν είναι επεξεργασία υπάρχουσας ανάθεσης
      if (editingAssignment) {
        console.log('📝 Updating existing assignment:', editingAssignment.id);
        
        const { data: updatedAssignment, error: updateError } = await supabase
          .from('program_assignments')
          .update({
            training_dates: trainingDates,
            start_date: startDate,
            end_date: endDate,
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
            start_date: startDate,
            end_date: endDate,
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
