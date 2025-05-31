import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { ProgramsLayout } from "@/components/programs/ProgramsLayout";
import { Program } from "@/components/programs/types";
import { useProgramOperations } from "@/hooks/useProgramOperations";
import { useProgramFormState } from "@/hooks/useProgramFormState";
import { useProgramData } from "@/hooks/useProgramData";

const Programs = () => {
  console.log('Programs component rendered');
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const { users, exercises } = useProgramData();
  const { loading, fetchPrograms, createProgramFromBuilder, deleteProgram, deleteWeek, deleteDay, deleteBlock, deleteExercise, operations } = useProgramOperations();
  const formState = useProgramFormState();

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
    formState.setEditingProgram(program);
    formState.setBuilderDialogOpen(true);
  };

  const handleBuilderDialogClose = (open: boolean) => {
    formState.setBuilderDialogOpen(open);
    if (!open) {
      formState.setEditingProgram(null);
    }
  };

  const handleDuplicateProgram = async (program: Program) => {
    console.log('Duplicate program:', program);
    await operations.duplicateProgram(program);
    await loadPrograms();
  };

  const handlePreviewProgram = (program: Program) => {
    console.log('Preview program:', program);
    setSelectedProgram(program);
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
          editingProgram={formState.editingProgram}
          builderDialogOpen={formState.builderDialogOpen}
          onSelectProgram={handleSelectProgram}
          onDeleteProgram={handleDeleteProgram}
          onEditProgram={handleEditProgram}
          onCreateProgram={handleCreateProgram}
          onBuilderDialogClose={handleBuilderDialogClose}
          onDuplicateProgram={handleDuplicateProgram}
          onPreviewProgram={handlePreviewProgram}
          showNewWeek={formState.showNewWeek}
          setShowNewWeek={formState.setShowNewWeek}
          newWeek={formState.newWeek}
          setNewWeek={formState.setNewWeek}
          onDeleteWeek={handleDeleteWeek}
          onDeleteDay={handleDeleteDay}
          onDeleteBlock={handleDeleteBlock}
          onDeleteExercise={handleDeleteExercise}
          onSetCurrentWeek={formState.setCurrentWeek}
          onSetCurrentDay={formState.setCurrentDay}
          onSetCurrentBlock={formState.setCurrentBlock}
          showNewDay={formState.showNewDay}
          setShowNewDay={formState.setShowNewDay}
          newDay={formState.newDay}
          setNewDay={formState.setNewDay}
          showNewBlock={formState.showNewBlock}
          setShowNewBlock={formState.setShowNewBlock}
          newBlock={formState.newBlock}
          setNewBlock={formState.setNewBlock}
          showNewExercise={formState.showNewExercise}
          setShowNewExercise={formState.setShowNewExercise}
          newExercise={formState.newExercise}
          setNewExercise={formState.setNewExercise}
        />
      </div>
    </div>
  );
};

export default Programs;
