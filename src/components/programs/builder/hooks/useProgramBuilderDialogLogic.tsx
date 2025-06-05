import { useState, useEffect } from 'react';
import { useProgramAssignments } from '@/hooks/programs/useProgramAssignments';
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { toast } from "sonner";
import { User, Exercise, Program } from '../../types';
import { ProgramStructure } from './useProgramBuilderState';

interface UseProgramBuilderDialogLogicProps {
  users: User[];
  exercises: Exercise[];
  onCreateProgram: (program: any) => Promise<any>;
  onOpenChange: () => void;
  editingProgram?: Program | null;
  editingAssignment?: {
    id: string;
    user_id: string;
    training_dates: string[];
  } | null;
  isOpen: boolean;
  program: ProgramStructure;
}

export const useProgramBuilderDialogLogic = ({
  users,
  exercises,
  onCreateProgram,
  onOpenChange,
  editingProgram,
  editingAssignment,
  isOpen,
  program
}: UseProgramBuilderDialogLogicProps) => {
  const { createOrUpdateAssignment } = useProgramAssignments();
  const { getWorkoutCompletions } = useWorkoutCompletions();
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [preSelectedDates, setPreSelectedDates] = useState<string[]>([]);

  // Fetch completed workouts when editing assignment
  useEffect(() => {
    const fetchCompletedDates = async () => {
      if (editingAssignment) {
        try {
          const completions = await getWorkoutCompletions(editingAssignment.id);
          const completed = completions
            .filter(c => c.status === 'completed')
            .map(c => c.scheduled_date);
          setCompletedDates(completed);
        } catch (error) {
          console.error('Error fetching workout completions:', error);
        }
      }
    };

    if (isOpen && editingAssignment) {
      fetchCompletedDates();
    }
  }, [isOpen, editingAssignment, getWorkoutCompletions]);

  const handleClose = () => {
    setPreSelectedDates([]); // Clear pre-selected dates when closing
    onOpenChange();
  };

  const handleSave = async () => {
    if (!program.name || !program.name.trim()) {
      toast.error('Το όνομα προγράμματος είναι υποχρεωτικό');
      return;
    }
    
    console.log('Saving program as draft:', program);
    const programToSave = {
      ...program,
      id: editingProgram?.id || undefined,
      status: 'draft'
    };
    
    try {
      const savedProgram = await onCreateProgram(programToSave);
      handleClose();
      return savedProgram;
    } catch (error) {
      console.error('Error saving program:', error);
    }
  };

  const handleOpenAssignments = (selectedDates?: string[]) => {
    if (!program.name || !program.name.trim()) {
      toast.error('Το όνομα προγράμματος είναι υποχρεωτικό');
      return;
    }

    if (!program.weeks || program.weeks.length === 0) {
      toast.error('Δημιουργήστε πρώτα εβδομάδες και ημέρες προπόνησης');
      return;
    }

    const hasValidDays = program.weeks.some(week => week.days && week.days.length > 0);
    if (!hasValidDays) {
      toast.error('Προσθέστε ημέρες προπόνησης στις εβδομάδες');
      return;
    }

    // Set pre-selected dates if provided
    if (selectedDates && selectedDates.length > 0) {
      console.log('Setting pre-selected dates:', selectedDates);
      setPreSelectedDates(selectedDates);
    }

    setAssignmentDialogOpen(true);
  };

  const handleAssign = async (userId: string, trainingDates: string[]) => {
    console.log('=== PROGRAM ASSIGNMENT WITH DATES ===');
    console.log('User ID:', userId);
    console.log('Training Dates:', trainingDates);
    console.log('Editing Assignment:', editingAssignment);
    
    if (!trainingDates || trainingDates.length === 0) {
      toast.error('Παρακαλώ επιλέξτε ημερομηνίες προπόνησης');
      return;
    }
    
    const programToSave = {
      ...program,
      id: editingProgram?.id || undefined,
      status: 'active',
      createAssignment: true,
      training_dates: trainingDates
    };
    
    console.log('Program data being saved:', programToSave);
    
    try {
      // First save the program
      const savedProgram = await onCreateProgram(programToSave);
      const programId = savedProgram?.id || editingProgram?.id;
      
      if (programId && userId && trainingDates?.length > 0) {
        console.log('Creating/updating assignment with specific dates:', {
          programId,
          userId,
          trainingDates,
          editingAssignment: !!editingAssignment
        });
        
        // Create or update assignment with specific training dates
        await createOrUpdateAssignment(
          programId, 
          userId, 
          undefined, // no start_date
          undefined, // no end_date
          trainingDates // specific training dates
        );
        
        console.log('✅ Assignment created/updated successfully with dates:', trainingDates);
        const successMessage = editingAssignment 
          ? 'Η ανάθεση ενημερώθηκε επιτυχώς' 
          : 'Το πρόγραμμα δημιουργήθηκε και ανατέθηκε επιτυχώς';
        toast.success(successMessage);
        
        handleClose();
        setTimeout(() => {
          window.location.href = '/dashboard/active-programs';
        }, 1500);
      } else {
        console.error('❌ Missing required data for assignment:', {
          programId,
          userId,
          trainingDatesLength: trainingDates?.length
        });
        toast.error('Απαιτούνται συγκεκριμένες ημερομηνίες προπόνησης');
        return;
      }
    } catch (error) {
      console.error('❌ Error creating/updating assignments:', error);
      toast.error('Σφάλμα κατά την ανάθεση του προγράμματος');
    }
  };

  const availableUsers = users;

  // Prepare assignment data for editing
  const assignmentEditData = editingAssignment ? {
    user_id: editingAssignment.user_id,
    training_dates: editingAssignment.training_dates,
    completedDates: completedDates
  } : undefined;

  return {
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    completedDates,
    preSelectedDates,
    handleClose,
    handleSave,
    handleOpenAssignments,
    handleAssign,
    availableUsers,
    assignmentEditData
  };
};
