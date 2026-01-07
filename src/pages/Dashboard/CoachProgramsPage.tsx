import React, { useState, useEffect } from 'react';
import { Program } from "@/components/programs/types";
import { usePrograms } from "@/hooks/usePrograms";
import { useProgramsData } from "@/hooks/useProgramsData";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { ProgramsList } from "@/components/programs/ProgramsList";
import { CoachProgramBuilderDialog } from "@/components/programs/builder/CoachProgramBuilderDialog";
import { ProgramBuilderTrigger } from "@/components/programs/builder/ProgramBuilderTrigger";
import { CoachLayout } from "@/components/layouts/CoachLayout";
import { useCoachContext } from "@/contexts/CoachContext";

const CoachProgramsContent = () => {
  const { coachId } = useCoachContext();
  const isMobile = useIsMobile();
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [coachAthletes, setCoachAthletes] = useState<any[]>([]);
  const [allExercises, setAllExercises] = useState<any[]>([]);

  const { exercises } = useProgramsData();
  const { loading, saveProgram, deleteProgram, duplicateProgram } = usePrograms();

  // Fetch coach's athletes
  useEffect(() => {
    const fetchCoachAthletes = async () => {
      if (!coachId) return;
      
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('coach_id', coachId);
      
      if (!error && data) {
        setCoachAthletes(data);
      }
    };

    fetchCoachAthletes();
  }, [coachId]);

  // Fetch exercises (admin + coach's own)
  useEffect(() => {
    const fetchExercises = async () => {
      if (!coachId) return;
      
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(`coach_id.is.null,coach_id.eq.${coachId}`);
      
      if (!error && data) {
        setAllExercises(data);
      }
    };

    fetchExercises();
  }, [coachId]);

  // Load programs
  useEffect(() => {
    loadPrograms();
  }, [coachId]);

  const loadPrograms = async () => {
    if (!coachId) return;
    
    try {
      console.log('🔄 Loading coach programs for:', coachId);
      
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
        .or(`created_by.eq.${coachId},coach_id.eq.${coachId}`)
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
      const dataWithCoach = {
        ...programData,
        created_by: coachId,
        coach_id: coachId,
      };
      const savedProgram = await saveProgram(dataWithCoach);
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

  if (loading) {
    return <div className="flex items-center justify-center p-8">Φόρτωση...</div>;
  }

  return (
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

      {builderOpen && coachId && (
        <CoachProgramBuilderDialog
          users={coachAthletes}
          exercises={allExercises.length > 0 ? allExercises : exercises}
          onCreateProgram={handleCreateProgram}
          editingProgram={editingProgram}
          isOpen={builderOpen}
          onOpenChange={handleBuilderClose}
          coachId={coachId}
        />
      )}
    </div>
  );
};

const CoachProgramsPage = () => {
  return (
    <CoachLayout title="Προγράμματα" ContentComponent={CoachProgramsContent} />
  );
};

export default CoachProgramsPage;
