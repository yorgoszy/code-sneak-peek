import React, { useEffect, useCallback } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { useAIProgramBuilder } from '@/contexts/AIProgramBuilderContext';
import { useProgramBuilderState } from './hooks/useProgramBuilderState';
import { useProgramBuilderActions } from './hooks/useProgramBuilderActions';
import { ProgramBuilderDialogContent } from './ProgramBuilderDialogContent';
import { useProgramsData } from '@/hooks/useProgramsData';
import { usePrograms } from '@/hooks/usePrograms';
import { toast } from 'sonner';

export const AIControlledProgramBuilderDialog: React.FC = () => {
  const { 
    isDialogOpen, 
    closeDialog, 
    pendingActions,
    getNextAction,
    registerProgramHandlers,
    executeAction 
  } = useAIProgramBuilder();
  
  const { users, exercises } = useProgramsData();
  const { saveProgram } = usePrograms();
  
  const {
    program,
    updateProgram,
    resetProgram,
    generateId,
    getTotalTrainingDays
  } = useProgramBuilderState(exercises);

  const actions = useProgramBuilderActions(
    program,
    updateProgram,
    generateId,
    exercises,
    saveProgram
  );

  // Handlers για save/assign
  const handleSave = useCallback(async () => {
    try {
      await saveProgram(program);
      toast.success('Το πρόγραμμα αποθηκεύτηκε!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Σφάλμα αποθήκευσης');
    }
  }, [program, saveProgram]);

  const handleAssign = useCallback(() => {
    if (!program.user_ids?.length || !program.training_dates?.length) {
      toast.error('Επιλέξτε χρήστες και ημερομηνίες');
      return;
    }
    // Trigger assignment logic
    toast.success('Ανάθεση προγράμματος...');
  }, [program]);

  // Register handlers για AI control
  useEffect(() => {
    const handlers = {
      setName: (name: string) => updateProgram({ name }),
      setDescription: (desc: string) => updateProgram({ description: desc }),
      selectUser: (userId: string) => updateProgram({ user_id: userId, user_ids: [userId] }),
      selectUsers: (userIds: string[]) => updateProgram({ user_ids: userIds }),
      selectGroup: (groupId: string) => updateProgram({ selected_group_id: groupId }),
      toggleMultipleMode: (isMultiple: boolean) => updateProgram({ is_multiple_assignment: isMultiple }),
      addWeek: actions.addWeek,
      removeWeek: actions.removeWeek,
      duplicateWeek: actions.duplicateWeek,
      updateWeekName: actions.updateWeekName,
      addDay: actions.addDay,
      removeDay: actions.removeDay,
      duplicateDay: actions.duplicateDay,
      updateDayName: actions.updateDayName,
      addBlock: actions.addBlock,
      removeBlock: actions.removeBlock,
      duplicateBlock: actions.duplicateBlock,
      updateBlockName: actions.updateBlockName,
      updateBlockType: actions.updateBlockTrainingType,
      updateBlockFormat: actions.updateBlockWorkoutFormat,
      updateBlockDuration: actions.updateBlockWorkoutDuration,
      updateBlockSets: actions.updateBlockSets,
      addExercise: actions.addExercise,
      removeExercise: actions.removeExercise,
      duplicateExercise: actions.duplicateExercise,
      updateExercise: actions.updateExercise,
      setTrainingDates: (dates: Date[]) => updateProgram({ training_dates: dates }),
      save: handleSave,
      assign: handleAssign,
      getProgram: () => program,
      getStats: () => ({
        weeks: program.weeks?.length || 0,
        days: program.weeks?.reduce((t, w) => t + (w.program_days?.length || 0), 0) || 0,
        blocks: program.weeks?.reduce((t, w) => 
          t + (w.program_days?.reduce((d, day) => d + (day.program_blocks?.length || 0), 0) || 0), 0) || 0,
        exercises: program.weeks?.reduce((t, w) => 
          t + (w.program_days?.reduce((d, day) => 
            d + (day.program_blocks?.reduce((b, block) => b + (block.program_exercises?.length || 0), 0) || 0), 0) || 0), 0) || 0
      })
    };
    
    registerProgramHandlers(handlers);
  }, [program, actions, updateProgram, handleSave, handleAssign, registerProgramHandlers]);

  // Process pending AI actions
  useEffect(() => {
    if (pendingActions.length > 0 && isDialogOpen) {
      const processActions = async () => {
        for (const action of pendingActions) {
          executeAction(action);
          // Small delay between actions for UI updates
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      };
      processActions();
    }
  }, [pendingActions, isDialogOpen, executeAction]);

  // Reset on open
  useEffect(() => {
    if (isDialogOpen) {
      resetProgram();
    }
  }, [isDialogOpen, resetProgram]);

  const handleTrainingDatesChange = (dates: Date[]) => {
    updateProgram({ training_dates: dates });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
      <ProgramBuilderDialogContent
        program={program}
        users={users}
        exercises={exercises}
        onNameChange={(name) => updateProgram({ name })}
        onDescriptionChange={(description) => updateProgram({ description })}
        onAthleteChange={(user_id) => updateProgram({ user_id, user_ids: [user_id] })}
        onMultipleAthleteChange={(user_ids) => updateProgram({ user_ids })}
        onGroupChange={(groupId) => updateProgram({ selected_group_id: groupId })}
        onToggleAssignmentMode={(isMultiple) => updateProgram({ is_multiple_assignment: isMultiple })}
        onAddWeek={actions.addWeek}
        onRemoveWeek={actions.removeWeek}
        onDuplicateWeek={actions.duplicateWeek}
        onUpdateWeekName={actions.updateWeekName}
        onAddDay={actions.addDay}
        onRemoveDay={actions.removeDay}
        onDuplicateDay={actions.duplicateDay}
        onUpdateDayName={actions.updateDayName}
        onUpdateDayTestDay={actions.updateDayTestDay}
        onUpdateDayCompetitionDay={actions.updateDayCompetitionDay}
        onAddBlock={actions.addBlock}
        onRemoveBlock={actions.removeBlock}
        onDuplicateBlock={actions.duplicateBlock}
        onUpdateBlockName={actions.updateBlockName}
        onUpdateBlockTrainingType={actions.updateBlockTrainingType}
        onUpdateBlockWorkoutFormat={actions.updateBlockWorkoutFormat}
        onUpdateBlockWorkoutDuration={actions.updateBlockWorkoutDuration}
        onUpdateBlockSets={actions.updateBlockSets}
        onAddExercise={actions.addExercise}
        onRemoveExercise={actions.removeExercise}
        onUpdateExercise={actions.updateExercise}
        onDuplicateExercise={actions.duplicateExercise}
        onReorderWeeks={actions.reorderWeeks}
        onReorderDays={actions.reorderDays}
        onReorderBlocks={actions.reorderBlocks}
        onReorderExercises={actions.reorderExercises}
        onSave={handleSave}
        onAssignments={handleAssign}
        onTrainingDatesChange={handleTrainingDatesChange}
        getTotalTrainingDays={getTotalTrainingDays}
      />
    </Dialog>
  );
};
