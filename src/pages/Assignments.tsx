
import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { AssignmentsLayout } from "@/components/assignments/AssignmentsLayout";
import { ProgramAssignment } from "@/types/assignments";
import { useAssignments } from "@/hooks/useAssignments";
import { useProgramsData } from "@/hooks/useProgramsData";

const Assignments = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [assignments, setAssignments] = useState<ProgramAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<ProgramAssignment | null>(null);
  
  // Assignment dialog state
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ProgramAssignment | null>(null);

  const { users, exercises } = useProgramsData();
  const { loading, fetchAssignments, createAssignment, updateAssignment, deleteAssignment } = useAssignments();

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const data = await fetchAssignments();
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleCreateAssignment = async (assignmentData: any) => {
    try {
      console.log('Creating/updating assignment:', assignmentData);
      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, assignmentData);
      } else {
        await createAssignment(assignmentData);
      }
      await loadAssignments();
      setAssignmentDialogOpen(false);
      setEditingAssignment(null);
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const handleEditAssignment = (assignment: ProgramAssignment) => {
    console.log('Editing assignment:', assignment);
    setEditingAssignment(assignment);
    setAssignmentDialogOpen(true);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const success = await deleteAssignment(assignmentId);
      if (success) {
        if (selectedAssignment?.id === assignmentId) {
          setSelectedAssignment(null);
        }
        await loadAssignments();
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  const handleAssignmentDialogClose = () => {
    console.log('Closing assignment dialog');
    setAssignmentDialogOpen(false);
    setEditingAssignment(null);
  };

  const handleOpenAssignmentDialog = () => {
    console.log('Opening new assignment dialog');
    setEditingAssignment(null);
    setAssignmentDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex w-full">
        <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
        <div className="flex-1 p-6">Φόρτωση...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className="flex-1 p-6">
        <AssignmentsLayout
          assignments={assignments}
          selectedAssignment={selectedAssignment}
          users={users}
          editingAssignment={editingAssignment}
          assignmentDialogOpen={assignmentDialogOpen}
          onSelectAssignment={setSelectedAssignment}
          onDeleteAssignment={handleDeleteAssignment}
          onEditAssignment={handleEditAssignment}
          onCreateAssignment={handleCreateAssignment}
          onAssignmentDialogClose={handleAssignmentDialogClose}
          onOpenAssignmentDialog={handleOpenAssignmentDialog}
        />
      </div>
    </div>
  );
};

export default Assignments;
