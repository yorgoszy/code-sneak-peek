
import React from 'react';
import { ProgramCardStatusBadge } from './actions/ProgramCardStatusBadge';
import { ProgramCardActionButtons } from './actions/ProgramCardActionButtons';
import { ProgramCardDialogManager } from './actions/ProgramCardDialogManager';
import { useProgramCardActions } from './actions/useProgramCardActions';
import { useProgramsData } from "@/hooks/useProgramsData";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardActionsProps {
  assignment: EnrichedAssignment;
  onRefresh?: () => void;
}

export const ProgramCardActions: React.FC<ProgramCardActionsProps> = ({ assignment, onRefresh }) => {
  const { users, exercises } = useProgramsData();
  
  const {
    dayProgramDialogOpen,
    programViewDialogOpen,
    selectedDate,
    daySelectorOpen,
    attendanceOpen,
    editDialogOpen,
    handleStart,
    handleDaySelected,
    handleView,
    handleEdit,
    handleComplete,
    handleEditSave,
    handleDialogClose,
    handleStartWorkoutFromView,
    onDaySelectorClose,
    onProgramViewClose,
    onAttendanceClose,
    onEditDialogClose
  } = useProgramCardActions(assignment, onRefresh);

  return (
    <>
      <div className="flex items-center gap-2 flex-shrink-0">
        <ProgramCardStatusBadge status={assignment.status} />
        <ProgramCardActionButtons
          onStart={handleStart}
          onView={handleView}
          onEdit={handleEdit}
          onComplete={handleComplete}
        />
      </div>

      <ProgramCardDialogManager
        assignment={assignment}
        daySelectorOpen={daySelectorOpen}
        programViewDialogOpen={programViewDialogOpen}
        dayProgramDialogOpen={dayProgramDialogOpen}
        attendanceOpen={attendanceOpen}
        editDialogOpen={editDialogOpen}
        selectedDate={selectedDate}
        users={users}
        exercises={exercises}
        onDaySelectorClose={onDaySelectorClose}
        onProgramViewClose={onProgramViewClose}
        onDayProgramClose={handleDialogClose}
        onAttendanceClose={onAttendanceClose}
        onEditDialogClose={onEditDialogClose}
        onSelectDay={handleDaySelected}
        onEditSave={handleEditSave}
        onRefresh={onRefresh}
        onStartWorkoutFromView={handleStartWorkoutFromView}
      />
    </>
  );
};
