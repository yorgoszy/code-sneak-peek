
import React from 'react';
import { ExerciseInteractionHandler } from './ExerciseInteractionHandler';
import { ProgramInfo } from './ProgramInfo';
import { ProgramBlocks } from './ProgramBlocks';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface DayProgramMainContentProps {
  program: EnrichedAssignment;
  dayProgram: any;
  workoutInProgress: boolean;
  dynamicStatus: string;
  selectedDate: Date;
  exerciseCompletion: any;
  onExerciseClick: (exercise: any, event: React.MouseEvent) => void;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  onVideoClick: (exercise: any) => void;
}

export const DayProgramMainContent: React.FC<DayProgramMainContentProps> = ({
  program,
  dayProgram,
  workoutInProgress,
  dynamicStatus,
  selectedDate,
  exerciseCompletion,
  onExerciseClick,
  onSetClick,
  onVideoClick
}) => {
  return (
    <>
      <ProgramInfo
        program={program}
        dayProgram={dayProgram}
        workoutInProgress={workoutInProgress}
        workoutStatus={dynamicStatus}
      />

      {dayProgram ? (
        <div className="space-y-1 md:space-y-2">
          <h4 className="text-xs md:text-sm font-medium text-gray-900 flex items-center space-x-2 px-1 md:px-0">
            <span>{dayProgram.name}</span>
          </h4>

          <ExerciseInteractionHandler
            workoutInProgress={workoutInProgress}
            onVideoClick={onVideoClick}
            onSetClick={onSetClick}
          >
            <ProgramBlocks
              blocks={dayProgram.program_blocks}
              workoutInProgress={workoutInProgress}
              getRemainingText={exerciseCompletion.getRemainingText}
              isExerciseComplete={exerciseCompletion.isExerciseComplete}
              onExerciseClick={onExerciseClick}
              onSetClick={onSetClick}
              onVideoClick={onVideoClick}
              getNotes={exerciseCompletion.getNotes}
              updateNotes={exerciseCompletion.updateNotes}
              clearNotes={exerciseCompletion.clearNotes}
              updateKg={exerciseCompletion.updateKg}
              clearKg={exerciseCompletion.clearKg}
              updateVelocity={exerciseCompletion.updateVelocity}
              clearVelocity={exerciseCompletion.clearVelocity}
              updateReps={exerciseCompletion.updateReps}
              clearReps={exerciseCompletion.clearReps}
              selectedDate={selectedDate}
              program={program}
            />
          </ExerciseInteractionHandler>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-none p-3 md:p-6 text-center text-gray-500 text-xs md:text-sm">
          Δεν βρέθηκε πρόγραμμα για αυτή την ημέρα
        </div>
      )}
    </>
  );
};
