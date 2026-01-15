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

const ProgramTemplates = () => {
  const { user, signOut } = useAuth();
  const { userProfile: dashboardUserProfile } = useDashboard();
  const { isAdmin } = useRoleCheck();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useIsMobile();
  const [isTablet, setIsTablet] = useState(false);
  const [templates, setTemplates] = useState<Program[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Program | null>(null);
  
  // Builder dialog state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Program | null>(null);
  
  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Program | null>(null);

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
    if (dashboardUserProfile?.id) {
      loadTemplates();
    }
  }, [dashboardUserProfile?.id, isAdmin]);

  const loadTemplates = async () => {
    try {
      console.log('🔄 Loading template programs...', { isAdmin, userProfile: dashboardUserProfile?.id });
      const data = await fetchProgramsWithAssignments();
      
      // Filter to show only templates AND filter by coach_id
      const templatePrograms = data.filter(program => {
        if (!program.is_template) return false;
        
        // Admin: βλέπει μόνο templates χωρίς coach_id (admin templates)
        // Coach: βλέπει μόνο templates με το δικό του coach_id
        if (isAdmin) {
          return !program.coach_id && !program.created_by;
        } else {
          return program.coach_id === dashboardUserProfile?.id || program.created_by === dashboardUserProfile?.id;
        }
      });
      
      console.log('✅ Template programs loaded:', templatePrograms.length);
      setTemplates(templatePrograms);
    } catch (error) {
      console.error('❌ Error loading templates:', error);
    }
  };

  const handleCreateTemplate = async (programData: any) => {
    try {
      console.log('Creating/updating template:', programData);
      // Mark as template
      const templateData = { ...programData, is_template: true };
      const savedTemplate = await saveProgram(templateData);
      console.log('✅ Template saved, result:', savedTemplate);
      await loadTemplates();
      setBuilderOpen(false);
      setEditingTemplate(null);
      return savedTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  };

  const handleEditTemplate = (template: Program) => {
    console.log('Editing template:', template);
    setEditingTemplate(template);
    setBuilderOpen(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      console.log('🗑️ Templates page - Attempting to delete template:', templateId);
      
      const success = await deleteProgram(templateId);
      if (success) {
        console.log('✅ Templates page - Template deleted successfully');
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
        }
        await loadTemplates();
      } else {
        console.log('❌ Templates page - Delete operation failed');
      }
    } catch (error) {
      console.error('❌ Templates page - Error deleting template:', error);
    }
  };

  const handleDuplicateTemplate = async (template: Program) => {
    try {
      await duplicateProgram(template);
      await loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const handlePreviewTemplate = (template: Program) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handleBuilderClose = () => {
    console.log('Closing builder dialog');
    setBuilderOpen(false);
    setEditingTemplate(null);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewTemplate(null);
  };

  const handleOpenBuilder = () => {
    console.log('Opening new template builder');
    setEditingTemplate(null);
    setBuilderOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex w-full">
        {!showSidebarButton && (
          <div className="block">
            <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
          </div>
        )}

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
      {!showSidebarButton && (
        <div className="block">
          <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
        </div>
      )}

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

        <div className={`flex-1 ${isMobile ? 'p-3' : 'p-6'}`}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Templates Προγραμμάτων</h1>
            <p className="text-gray-600 mt-1">
              Δημιουργία προτύπων προγραμμάτων με υποστήριξη %1RM για γρήγορη ανάθεση
            </p>
          </div>
          
          <ProgramsLayout
            programs={templates}
            selectedProgram={selectedTemplate}
            users={users}
            exercises={exercises}
            editingProgram={editingTemplate}
            builderDialogOpen={builderOpen}
            previewProgram={previewTemplate}
            previewDialogOpen={previewOpen}
            onSelectProgram={setSelectedTemplate}
            onDeleteProgram={handleDeleteTemplate}
            onEditProgram={handleEditTemplate}
            onCreateProgram={handleCreateTemplate}
            onBuilderDialogClose={handleBuilderClose}
            onDuplicateProgram={handleDuplicateTemplate}
            onPreviewProgram={handlePreviewTemplate}
            onPreviewDialogClose={handlePreviewClose}
            onDeleteWeek={() => {}}
            onDeleteDay={() => {}}
            onDeleteBlock={() => {}}
            onDeleteExercise={() => {}}
            onOpenBuilder={handleOpenBuilder}
            isTemplateMode={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgramTemplates;
