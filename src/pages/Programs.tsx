
import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { ProgramsLayout } from "@/components/programs/ProgramsLayout";
import { Program } from "@/components/programs/types";
import { useProgramOperations } from "@/hooks/useProgramOperations";
import { useProgramData } from "@/hooks/useProgramData";

const Programs = () => {
  console.log('Programs component rendered');
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [previewProgram, setPreviewProgram] = useState<Program | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // Program builder states - moved here from useProgramFormState
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [builderDialogOpen, setBuilderDialogOpen] = useState(false);

  const { users, exercises } = useProgramData();
  const { loading, fetchPrograms, createProgramFromBuilder, duplicateProgram, deleteProgram, deleteWeek, deleteDay, deleteBlock, deleteExercise } = useProgramOperations();

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    const data = await fetchPrograms();
    setPrograms(data);
  };

  const handleCreateProgram = async (programData: any) => {
    await createProgramFromBuilder(programData);
    await loadPrograms();
  };

  const handleDeleteProgram = async (programId: string) => {
    const success = await deleteProgram(programId, selectedProgram, setSelectedProgram);
    if (success) {
      await loadPrograms();
    }
  };

  const handleDeleteWeek = async (weekId: string) => {
    const success = await deleteWeek(weekId);
    if (success) {
      await loadPrograms();
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    const success = await deleteDay(dayId);
    if (success) {
      await loadPrograms();
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    const success = await deleteBlock(blockId);
    if (success) {
      await loadPrograms();
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    const success = await deleteExercise(exerciseId);
    if (success) {
      await loadPrograms();
    }
  };

  const handleSelectProgram = (program: Program) => {
    console.log('Program selected:', program);
    setSelectedProgram(program);
  };

  const handleEditProgram = (program: Program) => {
    console.log('Edit program:', program);
    setEditingProgram(program);
    setBuilderDialogOpen(true);
  };

  const handleBuilderDialogClose = (open: boolean) => {
    setBuilderDialogOpen(open);
    if (!open) {
      setEditingProgram(null);
    }
  };

  const handleDuplicateProgram = async (program: Program) => {
    console.log('Duplicate program:', program);
    await duplicateProgram(program);
    await loadPrograms();
  };

  const handlePreviewProgram = (program: Program) => {
    console.log('Preview program:', program);
    setPreviewProgram(program);
    setPreviewDialogOpen(true);
  };

  const handlePreviewDialogClose = (open: boolean) => {
    setPreviewDialogOpen(open);
    if (!open) {
      setPreviewProgram(null);
    }
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
          builderDialogOpen={builderDialogOpen}
          previewProgram={previewProgram}
          previewDialogOpen={previewDialogOpen}
          onSelectProgram={handleSelectProgram}
          onDeleteProgram={handleDeleteProgram}
          onEditProgram={handleEditProgram}
          onCreateProgram={handleCreateProgram}
          onBuilderDialogClose={handleBuilderDialogClose}
          onDuplicateProgram={handleDuplicateProgram}
          onPreviewProgram={handlePreviewProgram}
          onPreviewDialogClose={handlePreviewDialogClose}
          onDeleteWeek={handleDeleteWeek}
          onDeleteDay={handleDeleteDay}
          onDeleteBlock={handleDeleteBlock}
          onDeleteExercise={handleDeleteExercise}
        />
      </div>
    </div>
  );
};

export default Programs;
