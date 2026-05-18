
import React, { useEffect } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { User, Exercise, Program } from '../types';
import { ProgramBuilderDialogContent } from './ProgramBuilderDialogContent';
import { useProgramBuilderState } from './hooks/useProgramBuilderState';
import { useProgramBuilderActions } from './hooks/useProgramBuilderActions';
import { useProgramBuilderDialogLogic } from './hooks/useProgramBuilderDialogLogic';

interface ProgramBuilderDialogProps {
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
}

export const ProgramBuilderDialog: React.FC<ProgramBuilderDialogProps> = ({
  users,
  exercises,
  onCreateProgram,
  onOpenChange,
  editingProgram,
  editingAssignment,
  isOpen
}) => {
  const { program, updateProgram, resetProgram, generateId, loadProgramFromData, getTotalTrainingDays } = useProgramBuilderState(exercises);
  const actions = useProgramBuilderActions(program, updateProgram, generateId, exercises);
  
  const {
    handleClose,
    handleSave,
    handleAssign,
    availableUsers
  } = useProgramBuilderDialogLogic({
    users,
    exercises,
    onCreateProgram,
    onOpenChange,
    editingProgram,
    editingAssignment,
    isOpen,
    program,
    updateProgram
  });

  useEffect(() => {
    if (isOpen) {
      if (editingProgram) {
        console.log('🔄 Loading program for editing:', editingProgram.id, editingProgram.name);
        console.log('🔄 Program weeks:', editingProgram.program_weeks?.length || 0);
        loadProgramFromData(editingProgram);
      } else {
        console.log('🔄 Resetting program for new creation');
        resetProgram();
      }
    }
  }, [editingProgram, isOpen, loadProgramFromData, resetProgram]);

  const handleTrainingDatesChange = (dates: Date[]) => {
    updateProgram({ training_dates: dates });
  };

  const handleAthleteChange = async (userId: string) => {
    // Prefetch warm-up exercises immediately for instant effort updates
    if (userId) {
      const { prefetchAthleteWarmUpExercises } = await import('./hooks/useAthleteWarmUpExercises');
      prefetchAthleteWarmUpExercises(userId);
    }
    
    // 🔄 Καθαρισμός kg για ασκήσεις με percentage_1rm
    const clearKgForPercentageExercises = (weeks: any[]) => {
      return weeks.map(week => ({
        ...week,
        program_days: week.program_days?.map((day: any) => ({
          ...day,
          program_blocks: day.program_blocks?.map((block: any) => ({
            ...block,
            program_exercises: block.program_exercises?.map((exercise: any) => {
              if (exercise.percentage_1rm && parseFloat(exercise.percentage_1rm.toString().replace(',', '.')) > 0) {
                console.log('🔄 Clearing kg for exercise with %1RM:', exercise.exercise_id);
                return { ...exercise, kg: '' };
              }
              return exercise;
            }) || []
          })) || []
        })) || []
      }));
    };
    
    const updatedWeeks = clearKgForPercentageExercises(program.weeks);
    
    updateProgram({ 
      user_id: userId,
      is_multiple_assignment: false,
      user_ids: [],
      weeks: updatedWeeks
    });
  };

  const handleMultipleAthleteChange = async (userIds: string[]) => {
    console.log('🔄 ProgramBuilderDialog - handleMultipleAthleteChange called with:', userIds);
    
    // Prefetch warm-up exercises for ALL selected users so per-user warm-ups load instantly
    if (userIds.length > 0) {
      const { prefetchAthleteWarmUpExercises } = await import('./hooks/useAthleteWarmUpExercises');
      userIds.forEach(uid => prefetchAthleteWarmUpExercises(uid));
    }
    
    // 🔄 Καθαρισμός kg για ασκήσεις με percentage_1rm ώστε να επαναυπολογιστούν
    // με βάση το 1RM του νέου χρήστη
    const clearKgForPercentageExercises = (weeks: any[]) => {
      return weeks.map(week => ({
        ...week,
        program_days: week.program_days?.map((day: any) => ({
          ...day,
          program_blocks: day.program_blocks?.map((block: any) => ({
            ...block,
            program_exercises: block.program_exercises?.map((exercise: any) => {
              // Αν η άσκηση έχει percentage_1rm, καθαρίζουμε το kg
              // για να επαναυπολογιστεί με το 1RM του νέου χρήστη
              if (exercise.percentage_1rm && parseFloat(exercise.percentage_1rm.toString().replace(',', '.')) > 0) {
                console.log('🔄 Clearing kg for exercise with %1RM:', exercise.exercise_id);
                return { ...exercise, kg: '' };
              }
              return exercise;
            }) || []
          })) || []
        })) || []
      }));
    };
    
    const updatedWeeks = clearKgForPercentageExercises(program.weeks);
    
    updateProgram({ 
      user_ids: userIds,
      is_multiple_assignment: true,
      user_id: '',
      weeks: updatedWeeks
    });
  };

  const handleGroupChange = (groupId: string) => {
    console.log('🔄 ProgramBuilderDialog - handleGroupChange called with:', groupId);
    updateProgram({ 
      selected_group_id: groupId
    });
  };

  const handleToggleAssignmentMode = (isMultiple: boolean) => {
    actions.handleToggleAssignmentMode(isMultiple);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <ProgramBuilderDialogContent
        program={program}
        users={users}
        exercises={exercises}
        onNameChange={(name) => updateProgram({ name })}
        onDescriptionChange={(description) => updateProgram({ description })}
        onAthleteChange={handleAthleteChange}
        onMultipleAthleteChange={handleMultipleAthleteChange}
        onGroupChange={handleGroupChange}
        onToggleAssignmentMode={handleToggleAssignmentMode}
        onAddWeek={actions.addWeek}
        onRemoveWeek={actions.removeWeek}
        onDuplicateWeek={actions.duplicateWeek}
        onUpdateWeekName={actions.updateWeekName}
        onPasteWeek={actions.pasteWeek}
        onAddDay={actions.addDay}
        onRemoveDay={actions.removeDay}
        onUpdateDayName={actions.updateDayName}
        onUpdateDayTestDay={actions.updateDayTestDay}
        onUpdateDayCompetitionDay={actions.updateDayCompetitionDay}
        onUpdateDayEsdRecovery={actions.updateDayEsdRecovery}
        onUpdateDayEffort={actions.updateDayEffort}
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
        onPasteBlock={actions.pasteBlock}
        onPasteBlockAtBlock={actions.pasteBlockAtBlock}
        onPasteDay={actions.pasteDay}
        onSave={handleSave}
        onAssignments={handleAssign}
        onTrainingDatesChange={handleTrainingDatesChange}
        getTotalTrainingDays={getTotalTrainingDays}
        updateProgram={updateProgram}
      />
    </Dialog>
  );
};
