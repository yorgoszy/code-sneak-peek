
import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ProgramBasicInfo } from './ProgramBasicInfo';
import { TrainingWeeks } from './TrainingWeeks';
import { User, Exercise } from '../types';
import { ProgramStructure } from './hooks/useProgramBuilderState';

interface ProgramBuilderProps {
  program: ProgramStructure;
  users: User[];
  exercises: Exercise[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAthleteChange: (athlete_id: string) => void;
  onStartDateChange?: (date: Date | undefined) => void;
  onTrainingDaysChange?: (days: string[]) => void;
  onAddWeek: () => void;
  onRemoveWeek: (weekId: string) => void;
  onDuplicateWeek: (weekId: string) => void;
  onUpdateWeekName: (weekId: string, name: string) => void;
  onAddDay: (weekId: string) => void;
  onRemoveDay: (weekId: string, dayId: string) => void;
  onDuplicateDay: (weekId: string, dayId: string) => void;
  onUpdateDayName: (weekId: string, dayId: string, name: string) => void;
  onAddBlock: (weekId: string, dayId: string) => void;
  onRemoveBlock: (weekId: string, dayId: string, blockId: string) => void;
  onDuplicateBlock: (weekId: string, dayId: string, blockId: string) => void;
  onUpdateBlockName: (weekId: string, dayId: string, blockId: string, name: string) => void;
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
  onStartDateChange,
  onTrainingDaysChange,
  ...actions
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Convert program data to the format expected by ProgramBasicInfo
  const startDateString = program.start_date || '';
  const trainingDaysNumber = program.training_days || 0;

  const handleStartDateChange = (date: string) => {
    if (onStartDateChange) {
      const dateObj = date ? new Date(date) : undefined;
      onStartDateChange(dateObj);
    }
  };

  const handleTrainingDaysChange = (days: number) => {
    if (onTrainingDaysChange) {
      // Convert number to empty array since the parent expects string[]
      onTrainingDaysChange([]);
    }
  };

  return (
    <div className="space-y-6">
      <ProgramBasicInfo
        name={program.name}
        description={program.description}
        athlete_id={program.athlete_id}
        users={users}
        start_date={startDateString}
        training_days={trainingDaysNumber}
        onNameChange={onNameChange}
        onDescriptionChange={onDescriptionChange}
        onAthleteChange={onAthleteChange}
        onStartDateChange={handleStartDateChange}
        onTrainingDaysChange={handleTrainingDaysChange}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter}>
        <TrainingWeeks
          weeks={program.weeks}
          exercises={exercises}
          {...actions}
        />
      </DndContext>
    </div>
  );
};
