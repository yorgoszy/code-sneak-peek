
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
      status: 'draft'
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

    if (!program.training_dates || program.training_dates.length === 0) {
      toast.error('Επιλέξτε τουλάχιστον μία ημερομηνία προπόνησης');
      return;
    }
    
    console.log('=== ASSIGNMENT CREATION DEBUG ===');
    console.log('Creating program with specific training dates:', program.training_dates);
    
    const programToSave = {
      ...program,
      id: editingProgram?.id || undefined,
      status: 'active',
      createAssignment: true
    };
    
    console.log('Program to save:', programToSave);
    
    try {
      // First save the program
      await onCreateProgram(programToSave);
      const programId = editingProgram?.id || program.id;
      
      if (programId && program.user_id && program.training_dates?.length > 0) {
        // Create assignment with specific training dates
        await createOrUpdateAssignment(
          programId, 
          program.user_id, 
          undefined, // no start_date
          undefined, // no end_date
          program.training_dates // specific training dates
        );
        
        console.log('✅ Assignment created with training dates:', program.training_dates);
        toast.success('Το πρόγραμμα δημιουργήθηκε και ανατέθηκε επιτυχώς');
      } else {
        console.error('❌ Missing required data for assignment');
        toast.error('Απαιτούνται συγκεκριμένες ημερομηνίες προπόνησης');
        return;
      }
      
      handleClose();
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
        onStartDateChange={(start_date) => updateProgram({ start_date })}
        onTrainingDaysChange={(training_days) => updateProgram({ training_days })}
        onTrainingDatesChange={(training_dates) => updateProgram({ training_dates })}
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
