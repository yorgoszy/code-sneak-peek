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
  const { loading, fetchProgramsWithAssignments, saveProgram, deleteProgram, duplicateProgram } = usePrograms();

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      console.log('🔄 Loading draft/template programs...');
      const data = await fetchProgramsWithAssignments();
      // Filter to show only programs without assignments (draft/template programs)
      const draftPrograms = data.filter(program => 
        !program.program_assignments || program.program_assignments.length === 0
      );
      console.log('✅ Draft programs loaded:', draftPrograms.length);
      setPrograms(draftPrograms);
    } catch (error) {
      console.error('❌ Error loading programs:', error);
    }
  };

  const handleCreateProgram = async (programData: any) => {
    try {
      console.log('Creating/updating program:', programData);
      const savedProgram = await saveProgram(programData);
      console.log('✅ Program saved, result:', savedProgram);
      await loadPrograms(); // Ξαναφόρτωση για να ενημερωθούν τα δεδομένα
      setBuilderOpen(false);
      setEditingProgram(null);
      return savedProgram; // ΕΠΙΣΤΡΕΦΟΥΜΕ το αποθηκευμένο πρόγραμμα
    } catch (error) {
      console.error('Error creating program:', error);
      throw error; // Ξαναπετάμε το error για να το πιάσει το useAssignmentDialog
    }
  };

  const handleEditProgram = (program: Program) => {
    console.log('Editing program:', program);
    setEditingProgram(program);
    setBuilderOpen(true);
  };

  const handleDeleteProgram = async (programId: string) => {
    try {
      const success = await deleteProgram(programId);
      if (success) {
        if (selectedProgram?.id === programId) {
          setSelectedProgram(null);
        }
        await loadPrograms(); // Ξαναφόρτωση μετά τη διαγραφή
      }
    } catch (error) {
      console.error('Error deleting program:', error);
    }
  };

  const handleDuplicateProgram = async (program: Program) => {
    try {
      await duplicateProgram(program);
      await loadPrograms(); // Ξαναφόρτωση μετά την αντιγραφή
    } catch (error) {
      console.error('Error duplicating program:', error);
    }
  };

  const handlePreviewProgram = (program: Program) => {
    setPreviewProgram(program);
    setPreviewOpen(true);
  };

  const handleBuilderClose = () => {
    console.log('Closing builder dialog');
    setBuilderOpen(false);
    setEditingProgram(null);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewProgram(null);
  };

  const handleOpenBuilder = () => {
    console.log('Opening new program builder');
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
