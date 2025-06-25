
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon } from "lucide-react";
import type { User as UserType } from '../types';
import type { ProgramStructure } from './hooks/useProgramBuilderState';
import { ProgramInfoCard } from './ProgramInfoCard';
import { DateSelectionCard } from './DateSelectionCard';
import { AssignmentDialogActions } from './AssignmentDialogActions';
import { MultipleUserSelection } from './assignment/MultipleUserSelection';
import { SelectedDatesDisplay } from './assignment/SelectedDatesDisplay';
import { useMultipleUserAssignmentState } from './assignment/useMultipleUserAssignmentState';

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
    selectedUserIds,
    selectedUsers,
    totalRequiredSessions,
    totalWeeks,
    daysPerWeek,
    handleUserToggle,
    handleClearAllUsers,
    handleDateSelect,
    removeSelectedDate,
    clearAllDates,
    isDateSelected,
    isDateDisabled
  } = useMultipleUserAssignmentState({
    isOpen,
    program,
    users,
    editingAssignment
  });

  const handleAssign = async () => {
    if (selectedUserIds.length === 0 || selectedDates.length !== totalRequiredSessions) {
      return;
    }

    try {
      // Create assignments for each selected user
      for (const userId of selectedUserIds) {
        await onAssign(userId, selectedDates, 'individual');
      }
      onClose();
    } catch (error) {
      console.error('Error creating multiple assignments:', error);
    }
  };

  const canAssign = selectedUserIds.length > 0 && selectedDates.length === totalRequiredSessions;

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
          <MultipleUserSelection
            users={users}
            selectedUserIds={selectedUserIds}
            onUserToggle={handleUserToggle}
            onClearAll={handleClearAllUsers}
          />

          {selectedUsers.length > 0 && (
            <ProgramInfoCard
              program={program}
              selectedUser={selectedUsers.length === 1 ? selectedUsers[0] : undefined}
              totalWeeks={totalWeeks}
              daysPerWeek={daysPerWeek}
              totalRequiredSessions={totalRequiredSessions}
              assignmentType="individual"
              multipleUsers={selectedUsers.length > 1}
              selectedUsersCount={selectedUsers.length}
            />
          )}

          <DateSelectionCard
            selectedDates={selectedDates}
            daysPerWeek={daysPerWeek}
            totalWeeks={totalWeeks}
            totalRequiredSessions={totalRequiredSessions}
            onDateSelect={handleDateSelect}
            onClearAllDates={clearAllDates}
            isDateSelected={isDateSelected}
            isDateDisabled={isDateDisabled}
            completedDates={[]}
            editMode={!!editingAssignment}
          />

          {selectedDates.length > 0 && (
            <SelectedDatesDisplay
              isVisible={true}
              selectedDates={selectedDates}
              completedDates={[]}
              isReassignment={false}
              onRemoveDate={removeSelectedDate}
            />
          )}
        </div>

        <AssignmentDialogActions
          onClose={onClose}
          onAssign={handleAssign}
          canAssign={canAssign}
          editMode={!!editingAssignment}
          isReassignment={false}
          assignmentType="individual"
          targetName={
            selectedUsers.length === 1
              ? selectedUsers[0].name
              : `${selectedUsers.length} αθλητές`
          }
        />
      </DialogContent>
    </Dialog>
  );
};
