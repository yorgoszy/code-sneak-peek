
import React, { useState, useEffect } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { User, Exercise, Program } from './types';
import { ProgramBuilderDialogContent } from './builder/ProgramBuilderDialogContent';
import { ProgramAssignmentDialog } from './builder/ProgramAssignmentDialog';
import { useProgramBuilderState } from './builder/hooks/useProgramBuilderState';
import { useProgramBuilderActions } from './builder/hooks/useProgramBuilderActions';
import { useProgramAssignments } from '@/hooks/programs/useProgramAssignments';
import { toast } from "sonner";

interface ProgramBuilderDialogProps {
  users: User[];
  exercises: Exercise[];
  onCreateProgram: (program: any) => Promise<any>;
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
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  
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
      const savedProgram = await onCreateProgram(programToSave);
      handleClose();
      return savedProgram;
    } catch (error) {
      console.error('Error saving program:', error);
    }
  };

  const handleOpenAssignments = () => {
    if (!program.name.trim()) {
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

    setAssignmentDialogOpen(true);
  };

  const handleAssign = async (userId: string, trainingDates: string[]) => {
    console.log('=== PROGRAM ASSIGNMENT WITH DATES ===');
    console.log('User ID:', userId);
    console.log('Training Dates:', trainingDates);
    
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
        console.log('Creating assignment with specific dates:', {
          programId,
          userId,
          trainingDates
        });
        
        // Create assignment with specific training dates
        await createOrUpdateAssignment(
          programId, 
          userId, 
          undefined, // no start_date
          undefined, // no end_date
          trainingDates // specific training dates
        );
        
        console.log('✅ Assignment created successfully with dates:', trainingDates);
        toast.success('Το πρόγραμμα δημιουργήθηκε και ανατέθηκε επιτυχώς');
        
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
      console.error('❌ Error creating assignments:', error);
      toast.error('Σφάλμα κατά την ανάθεση του προγράμματος');
    }
  };

  const availableUsers = users;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <ProgramBuilderDialogContent
          program={program}
          users={users}
          exercises={exercises}
          onNameChange={(name) => updateProgram({ name })}
          onDescriptionChange={(description) => updateProgram({ description })}
          onAthleteChange={(user_id) => updateProgram({ user_id })}
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
          onAssignments={handleOpenAssignments}
        />
      </Dialog>

      <ProgramAssignmentDialog
        isOpen={assignmentDialogOpen}
        onClose={() => setAssignmentDialogOpen(false)}
        program={program}
        users={availableUsers}
        onAssign={handleAssign}
      />
    </>
  );
};
