
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon } from "lucide-react";
import type { User as UserType } from '../types';
import type { ProgramStructure } from './hooks/useProgramBuilderState';
import { ProgramInfoCard } from './ProgramInfoCard';
import { DateSelectionCard } from './DateSelectionCard';
import { AssignmentDialogActions } from './AssignmentDialogActions';
import { GroupUserSelection } from './assignment/GroupUserSelection';
import { ReassignmentOption } from './assignment/ReassignmentOption';
import { SelectedDatesDisplay } from './assignment/SelectedDatesDisplay';
import { useGroupAssignmentDialogState } from './assignment/useGroupAssignmentDialogState';

interface ProgramAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  program: ProgramStructure;
  users: UserType[];
  onAssign: (userId: string, trainingDates: string[], assignmentType?: 'individual' | 'group', groupId?: string) => void;
  editingAssignment?: {
    user_id: string;
    training_dates: string[];
    completedDates?: string[];
  };
}

export const ProgramAssignmentDialog: React.FC<ProgramAssignmentDialogProps> = ({
  isOpen,
  onClose,
  program,
  users,
  onAssign,
  editingAssignment
}) => {
  const {
    selectedDates,
    selectedUserId,
    selectedGroupId,
    assignmentType,
    isReassignment,
    groups,
    loadingGroups,
    selectedUser,
    selectedGroup,
    completedDates,
    totalRequiredSessions,
    totalWeeks,
    daysPerWeek,
    setSelectedUserId,
    setSelectedGroupId,
    setAssignmentType,
    removeSelectedDate,
    handleDateSelect,
    clearAllDates,
    handleReassignmentToggle,
    isDateSelected,
    isDateDisabled
  } = useGroupAssignmentDialogState({
    isOpen,
    program,
    users,
    editingAssignment
  });

  const handleAssign = () => {
    if (assignmentType === 'individual' && selectedUserId && selectedDates.length === totalRequiredSessions) {
      onAssign(selectedUserId, selectedDates, 'individual');
      onClose();
    } else if (assignmentType === 'group' && selectedGroupId && selectedDates.length === totalRequiredSessions) {
      onAssign('', selectedDates, 'group', selectedGroupId);
      onClose();
    }
  };

  const canAssign = assignmentType === 'individual' 
    ? selectedUserId && selectedDates.length === totalRequiredSessions
    : selectedGroupId && selectedDates.length === totalRequiredSessions;

  const currentTarget = assignmentType === 'individual' ? selectedUser : selectedGroup;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] rounded-none flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {editingAssignment ? 'Επεξεργασία Ανάθεσης' : 'Ανάθεση Προγράμματος'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6 p-6">
          <GroupUserSelection
            users={users}
            groups={groups}
            selectedUserId={selectedUserId}
            selectedGroupId={selectedGroupId}
            assignmentType={assignmentType}
            onUserChange={setSelectedUserId}
            onGroupChange={setSelectedGroupId}
            onAssignmentTypeChange={setAssignmentType}
            selectedUser={selectedUser}
            selectedGroup={selectedGroup}
          />

          <ReassignmentOption
            isVisible={!!editingAssignment && completedDates.length > 0}
            completedDatesCount={completedDates.length}
            isReassignment={isReassignment}
            onReassignmentToggle={handleReassignmentToggle}
          />

          <SelectedDatesDisplay
            isVisible={!!editingAssignment}
            selectedDates={selectedDates}
            completedDates={completedDates}
            isReassignment={isReassignment}
            onRemoveDate={removeSelectedDate}
          />

          <ProgramInfoCard
            program={program}
            selectedUser={currentTarget}
            totalWeeks={totalWeeks}
            daysPerWeek={daysPerWeek}
            totalRequiredSessions={totalRequiredSessions}
            assignmentType={assignmentType}
          />

          <DateSelectionCard
            selectedDates={selectedDates}
            daysPerWeek={daysPerWeek}
            totalWeeks={totalWeeks}
            totalRequiredSessions={totalRequiredSessions}
            onDateSelect={handleDateSelect}
            onClearAllDates={clearAllDates}
            isDateSelected={isDateSelected}
            isDateDisabled={isDateDisabled}
            completedDates={isReassignment ? [] : completedDates}
            editMode={!!editingAssignment}
          />
        </div>

        <AssignmentDialogActions
          onClose={onClose}
          onAssign={handleAssign}
          canAssign={canAssign}
          editMode={!!editingAssignment}
          isReassignment={isReassignment}
          assignmentType={assignmentType}
          targetName={assignmentType === 'individual' ? selectedUser?.name : selectedGroup?.name}
        />
      </DialogContent>
    </Dialog>
  );
};
