
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon } from "lucide-react";
import type { User as UserType } from '../types';
import type { ProgramStructure } from './hooks/useProgramBuilderState';
import { ProgramInfoCard } from './ProgramInfoCard';
import { DateSelectionCard } from './DateSelectionCard';
import { AssignmentDialogActions } from './AssignmentDialogActions';
import { UserSelection } from './assignment/UserSelection';
import { ReassignmentOption } from './assignment/ReassignmentOption';
import { SelectedDatesDisplay } from './assignment/SelectedDatesDisplay';
import { useAssignmentDialogState } from './assignment/useAssignmentDialogState';

interface ProgramAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  program: ProgramStructure;
  users: UserType[];
  onAssign: (userId: string, trainingDates: string[]) => void;
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
    isReassignment,
    selectedUser,
    completedDates,
    totalRequiredSessions,
    totalWeeks,
    daysPerWeek,
    setSelectedUserId,
    removeSelectedDate,
    handleDateSelect,
    clearAllDates,
    handleReassignmentToggle,
    isDateSelected,
    isDateDisabled
  } = useAssignmentDialogState({
    isOpen,
    program,
    users,
    editingAssignment
  });

  const handleAssign = () => {
    if (selectedUserId && selectedDates.length === totalRequiredSessions) {
      onAssign(selectedUserId, selectedDates);
      onClose();
    }
  };

  const canAssign = selectedUserId && selectedDates.length === totalRequiredSessions;

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
          <UserSelection
            users={users}
            selectedUserId={selectedUserId}
            onUserChange={setSelectedUserId}
            selectedUser={selectedUser}
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
            selectedUser={selectedUser}
            totalWeeks={totalWeeks}
            daysPerWeek={daysPerWeek}
            totalRequiredSessions={totalRequiredSessions}
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
        />
      </DialogContent>
    </Dialog>
  );
};
