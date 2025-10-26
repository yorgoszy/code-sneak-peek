
import React from 'react';
import { User, Exercise } from '../types';
import { ProgramBasicInfo } from './ProgramBasicInfo';
import { TrainingWeeks } from './TrainingWeeks';
import { ProgramStructure } from './hooks/useProgramBuilderState';

interface ProgramBuilderProps {
  program: ProgramStructure;
  users: User[];
  exercises: Exercise[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAthleteChange: (user_id: string) => void;
  onMultipleAthleteChange: (userIds: string[]) => void;
  onGroupChange: (groupId: string) => void;
  onToggleAssignmentMode: (isMultiple: boolean) => void;
  onStartDateChange?: (date: Date | undefined) => void;
  onAddWeek: () => void;
  onRemoveWeek: (weekId: string) => void;
  onDuplicateWeek: (weekId: string) => void;
  onUpdateWeekName: (weekId: string, name: string) => void;
  onAddDay: (weekId: string) => void;
  onRemoveDay: (weekId: string, dayId: string) => void;
  onDuplicateDay: (weekId: string, dayId: string) => void;
  onUpdateDayName: (weekId: string, dayId: string, name: string) => void;
  onUpdateDayTestDay: (weekId: string, dayId: string, isTestDay: boolean, testTypes: string[]) => void;
  onAddBlock: (weekId: string, dayId: string) => void;
  onRemoveBlock: (weekId: string, dayId: string, blockId: string) => void;
  onDuplicateBlock: (weekId: string, dayId: string, blockId: string) => void;
  onUpdateBlockName: (weekId: string, dayId: string, blockId: string, name: string) => void;
  onUpdateBlockTrainingType: (weekId: string, dayId: string, blockId: string, trainingType: string) => void;
  onAddExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onRemoveExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onUpdateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onDuplicateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onReorderWeeks: (oldIndex: number, newIndex: number) => void;
  onReorderDays: (weekId: string, oldIndex: number, newIndex: number) => void;
  onReorderBlocks: (weekId: string, dayId: string, oldIndex: number, newIndex: number) => void;
  onReorderExercises: (weekId: string, dayId: string, blockId: string, oldIndex: number, newIndex: number) => void;
}

export const ProgramBuilder: React.FC<ProgramBuilderProps> = ({
  program,
  users,
  exercises,
  onNameChange,
  onDescriptionChange,
  onAthleteChange,
  onMultipleAthleteChange,
  onGroupChange,
  onToggleAssignmentMode,
  onStartDateChange,
  onAddWeek,
  onRemoveWeek,
  onDuplicateWeek,
  onUpdateWeekName,
  onAddDay,
  onRemoveDay,
  onDuplicateDay,
  onUpdateDayName,
  onUpdateDayTestDay,
  onAddBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateBlockTrainingType,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onDuplicateExercise,
  onReorderWeeks,
  onReorderDays,
  onReorderBlocks,
  onReorderExercises
}) => {
  console.log('🔄 ProgramBuilder render - user_ids:', program.user_ids);
  
  return (
    <div className="space-y-6">
      <ProgramBasicInfo
        name={program.name}
        description={program.description}
        selectedUserId={program.user_id}
        selectedUserIds={program.user_ids || []}
        selectedGroupId={program.selected_group_id}
        users={users}
        onNameChange={onNameChange}
        onDescriptionChange={onDescriptionChange}
        onAthleteChange={onAthleteChange}
        onMultipleAthleteChange={onMultipleAthleteChange}
        onGroupChange={onGroupChange}
        isMultipleMode={true}
        onToggleMode={onToggleAssignmentMode}
      />
      
      <TrainingWeeks
        weeks={program.weeks}
        exercises={exercises}
        selectedUserId={program.user_id}
        onAddWeek={onAddWeek}
        onRemoveWeek={onRemoveWeek}
        onDuplicateWeek={onDuplicateWeek}
        onUpdateWeekName={onUpdateWeekName}
        onAddDay={onAddDay}
        onRemoveDay={onRemoveDay}
        onDuplicateDay={onDuplicateDay}
        onUpdateDayName={onUpdateDayName}
        onUpdateDayTestDay={onUpdateDayTestDay}
        onAddBlock={onAddBlock}
        onRemoveBlock={onRemoveBlock}
        onDuplicateBlock={onDuplicateBlock}
        onUpdateBlockName={onUpdateBlockName}
        onUpdateBlockTrainingType={onUpdateBlockTrainingType}
        onAddExercise={onAddExercise}
        onRemoveExercise={onRemoveExercise}
        onUpdateExercise={onUpdateExercise}
        onDuplicateExercise={onDuplicateExercise}
        onReorderWeeks={onReorderWeeks}
        onReorderDays={onReorderDays}
        onReorderBlocks={onReorderBlocks}
        onReorderExercises={onReorderExercises}
      />
    </div>
  );
};
