
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
    
    console.log('Creating program with assignments:', program);
    const programToSave = {
      ...program,
      id: editingProgram?.id || undefined,
      status: 'active', // Mark as active
      createAssignment: true // Flag to create assignment
    };
    
    try {
      // First save the program
      await onCreateProgram(programToSave);
      const programId = editingProgram?.id || program.id;
      
      if (programId && program.user_id) {
        // Calculate end date if start date is provided
        let endDate: string | undefined;
        if (program.start_date && program.weeks?.length) {
          const startDate = new Date(program.start_date);
          const weeksToAdd = program.weeks.length;
          const calculatedEndDate = new Date(startDate);
          calculatedEndDate.setDate(calculatedEndDate.getDate() + (weeksToAdd * 7));
          endDate = calculatedEndDate.toISOString().split('T')[0];
        }
        
        // Prepare dates as strings
        const startDateString = program.start_date ? 
          (typeof program.start_date === 'string' ? program.start_date : program.start_date.toISOString().split('T')[0]) 
          : undefined;
        
        console.log('Calling createOrUpdateAssignment with:', {
          programId,
          userId: program.user_id,
          startDate: startDateString,
          endDate
        });
        
        // Create assignment with dates
        await createOrUpdateAssignment(
          programId, 
          program.user_id, 
          startDateString, 
          endDate
        );
        
        console.log('Assignment created with dates:', {
          programId,
          userId: program.user_id,
          startDate: startDateString,
          endDate
        });
      }
      
      handleClose();
      // Navigate to active programs after creating assignment
      setTimeout(() => {
        window.location.href = '/dashboard/active-programs';
      }, 1500);
    } catch (error) {
      console.error('Error creating assignments:', error);
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
        onStartDateChange={(start_date) => updateProgram({ start_date })}
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
