import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from "react-router-dom";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Program } from "@/components/programs/types";
import { usePrograms } from "@/hooks/usePrograms";
import { useProgramsData } from "@/hooks/useProgramsData";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";
import { ProgramsList } from "@/components/programs/ProgramsList";
import { CoachProgramBuilderDialog } from "@/components/programs/builder/CoachProgramBuilderDialog";
import { ProgramBuilderTrigger } from "@/components/programs/builder/ProgramBuilderTrigger";
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

  // Get the effective coach ID
  // Αν ο admin δεν έχει coachId στο URL, δεν μπορεί να χρησιμοποιήσει το coach view
  const effectiveCoachId = isAdmin() && coachIdFromUrl 
    ? coachIdFromUrl 
    : (isCoach() ? userProfile?.id : null);

  const { users, exercises } = useProgramsData();
  const { loading, fetchProgramsWithAssignments, saveProgram, deleteProgram, duplicateProgram } = usePrograms();

  // Filter users to only show coach's athletes
  const [coachAthletes, setCoachAthletes] = useState<any[]>([]);

  useEffect(() => {
    const fetchCoachAthletes = async () => {
      if (!effectiveCoachId) return;
      
      // Get athletes from app_users that belong to this coach
      const { data, error } = await supabase
        .from('app_users')
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
      
      // Fetch coach's programs directly from database
      // (σε παλιότερα saves μπορεί να είναι στο coach_id αντί για created_by)
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          program_assignments!fk_program_assignments_program_id(*),
          program_weeks!fk_program_weeks_program_id(
            *,
            program_days!fk_program_days_week_id(
              *,
              program_blocks!fk_program_blocks_day_id(
                *,
                program_exercises!fk_program_exercises_block_id(
                  *,
                  exercises!fk_program_exercises_exercise_id(*)
                )
              )
            )
          )
        `)
        .or(`created_by.eq.${effectiveCoachId},coach_id.eq.${effectiveCoachId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Coach programs loaded:', (data || []).length);
      setPrograms((data || []) as unknown as Program[]);
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
        coach_id: effectiveCoachId,
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

  const handleBuilderClose = () => {
    setBuilderOpen(false);
    setEditingProgram(null);
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

  // Admin χωρίς coachId πρέπει να πάει στο admin programs page
  if (isAdmin() && !coachIdFromUrl) {
    return <Navigate to="/dashboard/programs" replace />;
  }

  // Αν δεν είναι coach ούτε admin με coachId
  if (!effectiveCoachId) {
    return <Navigate to="/dashboard" replace />;
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
          <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
            <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}>
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'} font-bold`}>
                {isMobile ? 'Προγράμματα' : 'Προγράμματα Προπόνησης'}
              </h1>
              <ProgramBuilderTrigger onClick={handleOpenBuilder} />
            </div>

            <div className="w-full">
              <ProgramsList
                programs={programs}
                selectedProgram={selectedProgram}
                onSelectProgram={setSelectedProgram}
                onDeleteProgram={handleDeleteProgram}
                onEditProgram={handleEditProgram}
                onDuplicateProgram={handleDuplicateProgram}
                onConvertToTemplate={handleConvertToTemplate}
              />
            </div>

            {builderOpen && effectiveCoachId && (
              <CoachProgramBuilderDialog
                users={coachAthletes}
                exercises={allExercises.length > 0 ? allExercises : exercises}
                onCreateProgram={handleCreateProgram}
                editingProgram={editingProgram}
                isOpen={builderOpen}
                onOpenChange={handleBuilderClose}
                coachId={effectiveCoachId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachProgramsPage;
