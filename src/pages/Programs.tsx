
import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { ProgramsLayout } from "@/components/programs/ProgramsLayout";
import { Program } from "@/components/programs/types";
import { usePrograms } from "@/hooks/usePrograms";
import { useProgramsData } from "@/hooks/useProgramsData";

const Programs = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  
  // Builder dialog state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  
  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewProgram, setPreviewProgram] = useState<Program | null>(null);

  const { users, exercises } = useProgramsData();
  const { loading, fetchPrograms, saveProgram, deleteProgram, duplicateProgram } = usePrograms();

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    const data = await fetchPrograms();
    setPrograms(data);
  };

  const handleCreateProgram = async (programData: any) => {
    try {
      await saveProgram(programData);
      await loadPrograms();
      setBuilderOpen(false);
      setEditingProgram(null);
    } catch (error) {
      console.error('Error creating program:', error);
    }
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setBuilderOpen(true);
  };

  const handleDeleteProgram = async (programId: string) => {
    const success = await deleteProgram(programId);
    if (success) {
      if (selectedProgram?.id === programId) {
        setSelectedProgram(null);
      }
      await loadPrograms();
    }
  };

  const handleDuplicateProgram = async (program: Program) => {
    try {
      await duplicateProgram(program);
      await loadPrograms();
    } catch (error) {
      console.error('Error duplicating program:', error);
    }
  };

  const handlePreviewProgram = (program: Program) => {
    setPreviewProgram(program);
    setPreviewOpen(true);
  };

  const handleBuilderClose = () => {
    setBuilderOpen(false);
    setEditingProgram(null);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewProgram(null);
  };

  const handleOpenBuilder = () => {
    setEditingProgram(null);
    setBuilderOpen(true);
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
        <ProgramsLayout
          programs={programs}
          selectedProgram={selectedProgram}
          users={users}
          exercises={exercises}
          editingProgram={editingProgram}
          builderDialogOpen={builderOpen}
          previewProgram={previewProgram}
          previewDialogOpen={previewOpen}
          onSelectProgram={setSelectedProgram}
          onDeleteProgram={handleDeleteProgram}
          onEditProgram={handleEditProgram}
          onCreateProgram={handleCreateProgram}
          onBuilderDialogClose={handleBuilderClose}
          onDuplicateProgram={handleDuplicateProgram}
          onPreviewProgram={handlePreviewProgram}
          onPreviewDialogClose={handlePreviewClose}
          onDeleteWeek={() => {}}
          onDeleteDay={() => {}}
          onDeleteBlock={() => {}}
          onDeleteExercise={() => {}}
          onOpenBuilder={handleOpenBuilder}
        />
      </div>
    </div>
  );
};

export default Programs;
