
import React from 'react';
import { AssignmentDialog } from './AssignmentDialog';
import { AssignmentsList } from './AssignmentsList';
import { AssignmentDetails } from './AssignmentDetails';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { ProgramAssignment } from "@/types/assignments";
import { User } from "@/components/programs/types";

interface AssignmentsLayoutProps {
  assignments: ProgramAssignment[];
  selectedAssignment: ProgramAssignment | null;
  users: User[];
  editingAssignment: ProgramAssignment | null;
  assignmentDialogOpen: boolean;
  onSelectAssignment: (assignment: ProgramAssignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onEditAssignment: (assignment: ProgramAssignment) => void;
  onCreateAssignment: (assignment: any) => void;
  onAssignmentDialogClose: () => void;
  onOpenAssignmentDialog: () => void;
}

export const AssignmentsLayout: React.FC<AssignmentsLayoutProps> = ({
  assignments,
  selectedAssignment,
  users,
  editingAssignment,
  assignmentDialogOpen,
  onSelectAssignment,
  onDeleteAssignment,
  onEditAssignment,
  onCreateAssignment,
  onAssignmentDialogClose,
  onOpenAssignmentDialog
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Αναθέσεις Προγραμμάτων</h1>
        <Button
          onClick={onOpenAssignmentDialog}
          className="rounded-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Νέα Ανάθεση
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AssignmentsList
            assignments={assignments}
            selectedAssignment={selectedAssignment}
            onSelectAssignment={onSelectAssignment}
            onDeleteAssignment={onDeleteAssignment}
            onEditAssignment={onEditAssignment}
          />
        </div>

        <div className="lg:col-span-1">
          <AssignmentDetails
            selectedAssignment={selectedAssignment}
            users={users}
            onEditAssignment={onEditAssignment}
          />
        </div>
      </div>

      {assignmentDialogOpen && (
        <AssignmentDialog
          users={users}
          onCreateAssignment={onCreateAssignment}
          editingAssignment={editingAssignment}
          isOpen={assignmentDialogOpen}
          onOpenChange={onAssignmentDialogClose}
        />
      )}
    </div>
  );
};
