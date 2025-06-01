
import React, { useState, useEffect } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { User, Exercise, Program } from './types';
import { ProgramBuilderDialogContent } from './builder/ProgramBuilderDialogContent';
import { useProgramBuilderState } from './builder/hooks/useProgramBuilderState';
import { useProgramBuilderActions } from './builder/hooks/useProgramBuilderActions';
import { useProgramAssignments } from '@/hooks/programs/useProgramAssignments';
import { toast } from "sonner";

interface ProgramBuilderDialogProps {
  users: User[];
  exercises: Exercise[];
  onCreateProgram: (program: any) => void;
  onOpenChange: () => void;
  editingProgram?: Program | null;
  isOpen: boolean;
}

export const ProgramBuilderDialog: React.FC<ProgramBuilderDialogProps> = ({
  users,
  exercises,
  onCreateProgram,
  onOpenChange,
  editingProgram,
  isOpen
}) => {
  const { program, updateProgram, resetProgram, generateId, loadProgramFromData } = useProgramBuilderState(exercises);
  const { createOrUpdateAssignment } = useProgramAssignments();
  
  const actions = useProgramBuilderActions(program, updateProgram, generateId, exercises);

  useEffect(() => {
    if (isOpen) {
      if (editingProgram) {
        console.log('Loading program for editing:', editingProgram);
        loadProgramFromData(editingProgram);
      } else {
        console.log('Resetting program for new creation');
        resetProgram();
      }
    }
  }, [editingProgram, isOpen]);

  const handleClose = () => {
    onOpenChange();
  };

  const handleSave = async () => {
    if (!program.name.trim()) {
      toast.error('Το όνομα προγράμματος είναι υποχρεωτικό');
      return;
    }
    
    console.log('Saving program as draft:', program);
    const programToSave = {
      ...program,
      id: editingProgram?.id || undefined,
      status: 'draft' // Save as draft
    };
    
    try {
      await onCreateProgram(programToSave);
      handleClose();
    } catch (error) {
      console.error('Error saving program:', error);
    }
  };

  const handleAssignments = async () => {
    if (!program.name.trim()) {
      toast.error('Το όνομα προγράμματος είναι υποχρεωτικό');
      return;
    }
    
    if (!program.user_id) {
      toast.error('Επιλέξτε έναν ασκούμενο για την ανάθεση');
      return;
    }
    
    console.log('=== ASSIGNMENT CREATION DEBUG ===');
    console.log('Creating program with assignments:', program);
    
    // 🔍 STEP 4: Show what date is being selected
    console.log('10. Selected start_date from program object:', program.start_date);
    console.log('11. Type of start_date:', typeof program.start_date);
    console.log('12. Selected user_id:', program.user_id);
    console.log('13. Program weeks length:', program.weeks?.length);
    
    // Prepare start date string before saving - FIXED DATE HANDLING
    let startDateString: string | undefined;
    if (program.start_date) {
      if (typeof program.start_date === 'string') {
        startDateString = program.start_date;
        console.log('14. Using string start_date as-is:', startDateString);
      } else if (program.start_date instanceof Date) {
        // Convert Date to YYYY-MM-DD format
        const year = program.start_date.getFullYear();
        const month = String(program.start_date.getMonth() + 1).padStart(2, '0');
        const day = String(program.start_date.getDate()).padStart(2, '0');
        startDateString = `${year}-${month}-${day}`;
        console.log('15. Converted Date to string:', startDateString);
      }
      console.log('16. Final startDateString that will be saved:', startDateString);
    } else {
      console.log('17. ❌ NO START DATE PROVIDED - program.start_date is:', program.start_date);
    }
    
    const programToSave = {
      ...program,
      id: editingProgram?.id || undefined,
      status: 'active', // Mark as active
      createAssignment: true, // Flag to create assignment
      start_date: startDateString // Ensure start_date is a string in correct format
    };
    
    console.log('18. Final programToSave object:', programToSave);
    
    try {
      // First save the program with the correct start_date
      await onCreateProgram(programToSave);
      const programId = editingProgram?.id || program.id;
      
      if (programId && program.user_id && startDateString) {
        // Calculate end date if start date is provided
        let endDate: string | undefined;
        if (program.weeks?.length) {
          const startDate = new Date(startDateString);
          const weeksToAdd = program.weeks.length;
          const calculatedEndDate = new Date(startDate);
          calculatedEndDate.setDate(calculatedEndDate.getDate() + (weeksToAdd * 7));
          const endYear = calculatedEndDate.getFullYear();
          const endMonth = String(calculatedEndDate.getMonth() + 1).padStart(2, '0');
          const endDay = String(calculatedEndDate.getDate()).padStart(2, '0');
          endDate = `${endYear}-${endMonth}-${endDay}`;
        }
        
        console.log('19. Assignment data being sent:');
        console.log('    - programId:', programId);
        console.log('    - userId:', program.user_id);
        console.log('    - startDate:', startDateString);
        console.log('    - endDate:', endDate);
        console.log('    - programWeeks:', program.weeks?.length);
        
        // Create assignment with correct dates
        await createOrUpdateAssignment(
          programId, 
          program.user_id, 
          startDateString, 
          endDate
        );
        
        console.log('✅ Assignment created successfully with dates:', {
          programId,
          userId: program.user_id,
          startDate: startDateString,
          endDate
        });
        
        toast.success('Το πρόγραμμα δημιουργήθηκε και ανατέθηκε επιτυχώς');
      } else {
        console.error('❌ Missing required data for assignment:', {
          programId,
          userId: program.user_id,
          startDate: startDateString
        });
        toast.error('Απαιτείται ημερομηνία έναρξης για την ανάθεση');
        return;
      }
      
      handleClose();
      // Navigate to active programs after creating assignment
      setTimeout(() => {
        window.location.href = '/dashboard/active-programs';
      }, 1500);
    } catch (error) {
      console.error('❌ Error creating assignments:', error);
      toast.error('Σφάλμα κατά την ανάθεση του προγράμματος');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <ProgramBuilderDialogContent
        program={program}
        users={users}
        exercises={exercises}
        onNameChange={(name) => updateProgram({ name })}
        onDescriptionChange={(description) => updateProgram({ description })}
        onAthleteChange={(user_id) => updateProgram({ user_id })}
        onStartDateChange={(start_date) => {
          console.log('📅 Start date changed in dialog to:', start_date);
          console.log('📅 Type of new start_date:', typeof start_date);
          updateProgram({ start_date });
        }}
        onTrainingDaysChange={(training_days) => updateProgram({ training_days })}
        onAddWeek={actions.addWeek}
        onRemoveWeek={actions.removeWeek}
        onDuplicateWeek={actions.duplicateWeek}
        onUpdateWeekName={actions.updateWeekName}
        onAddDay={actions.addDay}
        onRemoveDay={actions.removeDay}
        onDuplicateDay={actions.duplicateDay}
        onUpdateDayName={actions.updateDayName}
        onAddBlock={actions.addBlock}
        onRemoveBlock={actions.removeBlock}
        onDuplicateBlock={actions.duplicateBlock}
        onUpdateBlockName={actions.updateBlockName}
        onAddExercise={actions.addExercise}
        onRemoveExercise={actions.removeExercise}
        onUpdateExercise={actions.updateExercise}
        onDuplicateExercise={actions.duplicateExercise}
        onReorderWeeks={actions.reorderWeeks}
        onReorderDays={actions.reorderDays}
        onReorderBlocks={actions.reorderBlocks}
        onReorderExercises={actions.reorderExercises}
        onSave={handleSave}
        onAssignments={handleAssignments}
      />
    </Dialog>
  );
};
