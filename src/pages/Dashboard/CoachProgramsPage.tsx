import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from "react-router-dom";
import { CoachSidebar } from "@/components/CoachSidebar";
import { ProgramsLayout } from "@/components/programs/ProgramsLayout";
import { Program } from "@/components/programs/types";
import { usePrograms } from "@/hooks/usePrograms";
import { useProgramsData } from "@/hooks/useProgramsData";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";

const CoachProgramsPage = () => {
  const { user, signOut, isAuthenticated, loading: authLoading } = useAuth();
  const { userProfile, isAdmin, isCoach, loading: rolesLoading } = useRoleCheck();
  const [searchParams] = useSearchParams();
  const coachIdFromUrl = searchParams.get('coachId');
  
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

  // Get the effective coach ID
  const effectiveCoachId = coachIdFromUrl || userProfile?.id;

  const { users, exercises } = useProgramsData();
  const { loading, fetchProgramsWithAssignments, saveProgram, deleteProgram, duplicateProgram } = usePrograms();

  // Filter users to only show coach's athletes
  const [coachAthletes, setCoachAthletes] = useState<any[]>([]);

  useEffect(() => {
    const fetchCoachAthletes = async () => {
      if (!effectiveCoachId) return;
      
      const { data, error } = await supabase
        .from('coach_users')
        .select('*')
        .eq('coach_id', effectiveCoachId);
      
      if (!error && data) {
        setCoachAthletes(data);
      }
    };

    fetchCoachAthletes();
  }, [effectiveCoachId]);

  // Fetch exercises including coach's own + admin exercises
  const [allExercises, setAllExercises] = useState<any[]>([]);

  useEffect(() => {
    const fetchExercises = async () => {
      if (!effectiveCoachId) return;
      
      // Get admin exercises (coach_id is null) + coach's own exercises
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(`coach_id.is.null,coach_id.eq.${effectiveCoachId}`);
      
      if (!error && data) {
        setAllExercises(data);
      }
    };

    fetchExercises();
  }, [effectiveCoachId]);

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
  }, [effectiveCoachId]);

  const loadPrograms = async () => {
    if (!effectiveCoachId) return;
    
    try {
      console.log('🔄 Loading coach programs for:', effectiveCoachId);
      
      // Fetch only coach's programs directly from database
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          program_assignments(*),
          program_weeks(
            *,
            program_days(
              *,
              program_blocks(
                *,
                program_exercises(*, exercises(*))
              )
            )
          )
        `)
        .eq('created_by', effectiveCoachId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Filter programs - only those without assignments (drafts)
      const coachPrograms = (data || []).filter(program => 
        !program.program_assignments || program.program_assignments.length === 0
      );
      
      console.log('✅ Coach programs loaded:', coachPrograms.length);
      setPrograms(coachPrograms);
    } catch (error) {
      console.error('❌ Error loading programs:', error);
    }
  };

  const handleCreateProgram = async (programData: any) => {
    try {
      console.log('Creating/updating program:', programData);
      // Ensure the program is created with the coach's ID
      const dataWithCoach = {
        ...programData,
        created_by: effectiveCoachId,
      };
      const savedProgram = await saveProgram(dataWithCoach);
      console.log('✅ Program saved, result:', savedProgram);
      await loadPrograms();
      setBuilderOpen(false);
      setEditingProgram(null);
      return savedProgram;
    } catch (error) {
      console.error('Error creating program:', error);
      throw error;
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
        await loadPrograms();
      }
    } catch (error) {
      console.error('❌ Error deleting program:', error);
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

  const handleConvertToTemplate = async (program: Program) => {
    try {
      const templateData = { 
        ...program, 
        is_template: true 
      };
      await saveProgram(templateData);
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

  // Handle loading and auth
  if (authLoading || rolesLoading) {
    return <div className="min-h-screen flex items-center justify-center">Φόρτωση...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex w-full">
        <div className="hidden lg:block">
          <CoachSidebar 
            isCollapsed={sidebarCollapsed} 
            setIsCollapsed={setSidebarCollapsed}
            contextCoachId={effectiveCoachId}
          />
        </div>
        <div className="flex-1 flex items-center justify-center">Φόρτωση...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Desktop Sidebar */}
      {!showSidebarButton && (
        <div className="block">
          <CoachSidebar 
            isCollapsed={sidebarCollapsed} 
            setIsCollapsed={setSidebarCollapsed}
            contextCoachId={effectiveCoachId}
          />
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
            <CoachSidebar 
              isCollapsed={false} 
              setIsCollapsed={setSidebarCollapsed}
              contextCoachId={effectiveCoachId}
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
            users={coachAthletes}
            exercises={allExercises.length > 0 ? allExercises : exercises}
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

export default CoachProgramsPage;
