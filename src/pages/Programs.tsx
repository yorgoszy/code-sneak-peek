
import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { ProgramsLayout } from "@/components/programs/ProgramsLayout";
import { Program } from "@/components/programs/types";
import { usePrograms } from "@/hooks/usePrograms";
import { useProgramsData } from "@/hooks/useProgramsData";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useRoleCheck } from "@/hooks/useRoleCheck";

const Programs = () => {
  const { user, signOut } = useAuth();
  const { userProfile: dashboardUserProfile } = useDashboard();
  const { isAdmin } = useRoleCheck();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useIsMobile();
  const [isTablet, setIsTablet] = useState(false);
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

  // Check for tablet size
  React.useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1024);
    };
    
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  const showSidebarButton = isMobile || isTablet;

  const handleSignOut = async () => {
    await signOut();
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      console.log('🔄 Loading draft/template programs...');
      const data = await fetchProgramsWithAssignments();
      // Δείχνουμε ΜΟΝΟ admin/global draft/template προγράμματα (όχι coach-owned)
      const draftPrograms = data.filter(program =>
        (!program.program_assignments || program.program_assignments.length === 0) &&
        !program.created_by &&
        !program.coach_id
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
      console.log('🗑️ Programs page - Attempting to delete program:', programId);
      
      const success = await deleteProgram(programId);
      if (success) {
        console.log('✅ Programs page - Program deleted successfully');
        if (selectedProgram?.id === programId) {
          setSelectedProgram(null);
        }
        await loadPrograms(); // Ξαναφόρτωση μετά τη διαγραφή
      } else {
        console.log('❌ Programs page - Delete operation failed');
      }
    } catch (error) {
      console.error('❌ Programs page - Error deleting program:', error);
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

  const handleConvertToTemplate = async (program: Program) => {
    try {
      console.log('🔄 Converting program to template:', program.id);
      const templateData = { 
        ...program, 
        is_template: true 
      };
      await saveProgram(templateData);
      console.log('✅ Program converted to template successfully');
      await loadPrograms();
    } catch (error) {
      console.error('❌ Error converting program to template:', error);
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
      <div className="min-h-screen bg-gray-50 flex w-full">
        {/* Desktop Sidebar */}
        {!showSidebarButton && (
          <div className="block">
            <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
          </div>
        )}

        {/* Mobile/Tablet Sidebar Overlay */}
        {showSidebarButton && showMobileSidebar && (
          <div className="fixed inset-0 z-50">
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowMobileSidebar(false)}
            />
            <div className="relative w-64 h-full">
              <Sidebar 
                isCollapsed={false} 
                setIsCollapsed={setSidebarCollapsed}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with mobile menu button */}
          {showSidebarButton && (
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 p-3 md:p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileSidebar(true)}
                  className="rounded-none"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    className="rounded-none"
                    onClick={handleSignOut}
                    size="sm"
                  >
                    <LogOut className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="flex-1 p-6">Φόρτωση...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Desktop Sidebar */}
      {!showSidebarButton && (
        <div className="block">
          <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
        </div>
      )}

      {/* Mobile/Tablet Sidebar Overlay */}
      {showSidebarButton && showMobileSidebar && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="relative w-64 h-full">
            <Sidebar 
              isCollapsed={false} 
              setIsCollapsed={setSidebarCollapsed}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with mobile menu button */}
        {showSidebarButton && (
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 p-3 md:p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileSidebar(true)}
                className="rounded-none"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  className="rounded-none"
                  onClick={handleSignOut}
                  size="sm"
                >
                  <LogOut className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Programs Layout Content */}
        <div className={`flex-1 ${isMobile ? 'p-3' : 'p-6'}`}>
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
            onConvertToTemplate={handleConvertToTemplate}
          />
        </div>
      </div>
    </div>
  );
};

export default Programs;
