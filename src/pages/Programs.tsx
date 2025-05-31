import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { ProgramBuilderDialog } from "@/components/programs/ProgramBuilderDialog";
import { ProgramsList } from "@/components/programs/ProgramsList";
import { ProgramDetails } from "@/components/programs/ProgramDetails";
import { Program, User, Exercise, Week, Day, Block } from "@/components/programs/types";

const Programs = () => {
  console.log('Programs component rendered');
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  // Program builder states
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [builderDialogOpen, setBuilderDialogOpen] = useState(false);

  // Dialog states
  const [showNewWeek, setShowNewWeek] = useState(false);
  const [showNewDay, setShowNewDay] = useState(false);
  const [showNewBlock, setShowNewBlock] = useState(false);
  const [showNewExercise, setShowNewExercise] = useState(false);

  // Form states
  const [newWeek, setNewWeek] = useState({ name: '', week_number: 1 });
  const [newDay, setNewDay] = useState({ name: '', day_number: 1 });
  const [newBlock, setNewBlock] = useState({ name: '', block_order: 1 });
  const [newExercise, setNewExercise] = useState({
    exercise_id: '',
    sets: 1,
    reps: '',
    kg: '',
    percentage_1rm: 0,
    tempo: '',
    rest: '',
    notes: '',
    exercise_order: 1
  });

  // Current context for adding items
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [currentDay, setCurrentDay] = useState<Day | null>(null);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);

  useEffect(() => {
    fetchPrograms();
    fetchUsers();
    fetchExercises();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        app_users(name),
        program_weeks(
          *,
          program_days(
            *,
            program_blocks(
              *,
              program_exercises(
                *,
                exercises(name)
              )
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Σφάλμα φόρτωσης προγραμμάτων');
      console.error(error);
    } else {
      setPrograms(data || []);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('app_users')
      .select('id, name, email')
      .order('name');
    setUsers(data || []);
  };

  const fetchExercises = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('id, name')
      .order('name');
    setExercises(data || []);
  };

  const createProgramFromBuilder = async (programData: any) => {
    console.log('createProgramFromBuilder called', programData);
    
    if (!programData.name) {
      toast.error('Το όνομα προγράμματος είναι υποχρεωτικό');
      return;
    }

    try {
      if (programData.id) {
        // Update existing program
        await updateExistingProgram(programData);
      } else {
        // Create new program
        await createNewProgram(programData);
      }
    } catch (error) {
      console.error('Error saving program:', error);
      toast.error('Σφάλμα αποθήκευσης προγράμματος');
    }
  };

  const createNewProgram = async (programData: any) => {
    // Create the main program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .insert([{
        name: programData.name,
        description: programData.description,
        athlete_id: programData.athlete_id || null
      }])
      .select()
      .single();

    if (programError) throw programError;

    await createProgramStructure(program.id, programData);
    toast.success('Το πρόγραμμα δημιουργήθηκε επιτυχώς');
    fetchPrograms();
  };

  const updateExistingProgram = async (programData: any) => {
    // Update the main program
    const { error: programError } = await supabase
      .from('programs')
      .update({
        name: programData.name,
        description: programData.description,
        athlete_id: programData.athlete_id || null
      })
      .eq('id', programData.id);

    if (programError) throw programError;

    // Delete existing structure
    await supabase.from('program_weeks').delete().eq('program_id', programData.id);

    // Create new structure
    await createProgramStructure(programData.id, programData);
    toast.success('Το πρόγραμμα ενημερώθηκε επιτυχώς');
    fetchPrograms();
  };

  const createProgramStructure = async (programId: string, programData: any) => {
    // Create weeks, days, blocks, and exercises
    for (const week of programData.weeks) {
      const { data: weekData, error: weekError } = await supabase
        .from('program_weeks')
        .insert([{
          program_id: programId,
          name: week.name,
          week_number: week.week_number
        }])
        .select()
        .single();

      if (weekError) throw weekError;

      for (const day of week.days) {
        const { data: dayData, error: dayError } = await supabase
          .from('program_days')
          .insert([{
            week_id: weekData.id,
            name: day.name,
            day_number: day.day_number
          }])
          .select()
          .single();

        if (dayError) throw dayError;

        for (const block of day.blocks) {
          const { data: blockData, error: blockError } = await supabase
            .from('program_blocks')
            .insert([{
              day_id: dayData.id,
              name: block.name,
              block_order: block.block_order
            }])
            .select()
            .single();

          if (blockError) throw blockError;

          for (const exercise of block.exercises) {
            if (!exercise.exercise_id) continue;

            let calculatedKg = exercise.kg;
            let suggestedVelocity = null;

            // Calculate kg from percentage if athlete is selected and percentage is provided
            if (programData.athlete_id && exercise.percentage_1rm > 0) {
              const { data: oneRmData } = await supabase
                .rpc('get_latest_1rm', {
                  athlete_id: programData.athlete_id,
                  exercise_id: exercise.exercise_id
                });

              if (oneRmData) {
                calculatedKg = Math.round(oneRmData * (exercise.percentage_1rm / 100)).toString();
                
                // Get suggested velocity
                const { data: velocityData } = await supabase
                  .rpc('get_suggested_velocity', {
                    athlete_id: programData.athlete_id,
                    exercise_id: exercise.exercise_id,
                    percentage: exercise.percentage_1rm
                  });

                if (velocityData) {
                  suggestedVelocity = velocityData;
                }
              }
            }

            const { error: exerciseError } = await supabase
              .from('program_exercises')
              .insert([{
                block_id: blockData.id,
                exercise_id: exercise.exercise_id,
                sets: exercise.sets,
                reps: exercise.reps,
                kg: calculatedKg,
                percentage_1rm: exercise.percentage_1rm || null,
                velocity_ms: exercise.velocity_ms ? parseFloat(exercise.velocity_ms) : suggestedVelocity,
                tempo: exercise.tempo,
                rest: exercise.rest,
                notes: '',
                exercise_order: exercise.exercise_order
              }]);

            if (exerciseError) throw exerciseError;
          }
        }
      }
    }
  };

  const deleteProgram = async (programId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα;')) return;

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);

    if (error) {
      toast.error('Σφάλμα διαγραφής προγράμματος');
      console.error(error);
    } else {
      toast.success('Το πρόγραμμα διαγράφηκε επιτυχώς');
      fetchPrograms();
      if (selectedProgram?.id === programId) {
        setSelectedProgram(null);
      }
    }
  };

  const deleteWeek = async (weekId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την εβδομάδα;')) return;

    const { error } = await supabase
      .from('program_weeks')
      .delete()
      .eq('id', weekId);

    if (error) {
      toast.error('Σφάλμα διαγραφής εβδομάδας');
      console.error(error);
    } else {
      toast.success('Η εβδομάδα διαγράφηκε επιτυχώς');
      fetchPrograms();
    }
  };

  const deleteDay = async (dayId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την ημέρα;')) return;

    const { error } = await supabase
      .from('program_days')
      .delete()
      .eq('id', dayId);

    if (error) {
      toast.error('Σφάλμα διαγραφής ημέρας');
      console.error(error);
    } else {
      toast.success('Η ημέρα διαγράφηκε επιτυχώς');
      fetchPrograms();
    }
  };

  const deleteBlock = async (blockId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το block;')) return;

    const { error } = await supabase
      .from('program_blocks')
      .delete()
      .eq('id', blockId);

    if (error) {
      toast.error('Σφάλμα διαγραφής block');
      console.error(error);
    } else {
      toast.success('Το block διαγράφηκε επιτυχώς');
      fetchPrograms();
    }
  };

  const deleteExercise = async (exerciseId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την άσκηση;')) return;

    const { error } = await supabase
      .from('program_exercises')
      .delete()
      .eq('id', exerciseId);

    if (error) {
      toast.error('Σφάλμα διαγραφής άσκησης');
      console.error(error);
    } else {
      toast.success('Η άσκηση διαγράφηκε επιτυχώς');
      fetchPrograms();
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
      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Προγράμματα Προπόνησης</h1>
          <ProgramBuilderDialog
            users={users}
            exercises={exercises}
            onCreateProgram={createProgramFromBuilder}
            editingProgram={editingProgram}
            isOpen={builderDialogOpen}
            onOpenChange={handleBuilderDialogClose}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Programs List */}
          <div className="lg:col-span-1">
            <ProgramsList
              programs={programs}
              selectedProgram={selectedProgram}
              onSelectProgram={handleSelectProgram}
              onDeleteProgram={deleteProgram}
              onEditProgram={handleEditProgram}
            />
          </div>

          {/* Program Details */}
          <div className="lg:col-span-3">
            <ProgramDetails
              selectedProgram={selectedProgram}
              users={users}
              exercises={exercises}
              showNewWeek={showNewWeek}
              setShowNewWeek={setShowNewWeek}
              newWeek={newWeek}
              setNewWeek={setNewWeek}
              onCreateWeek={createWeek}
              onDeleteWeek={deleteWeek}
              onDeleteDay={deleteDay}
              onDeleteBlock={deleteBlock}
              onDeleteExercise={deleteExercise}
              onSetCurrentWeek={setCurrentWeek}
              onSetCurrentDay={setCurrentDay}
              onSetCurrentBlock={setCurrentBlock}
              showNewDay={showNewDay}
              setShowNewDay={setShowNewDay}
              newDay={newDay}
              setNewDay={setNewDay}
              onCreateDay={createDay}
              showNewBlock={showNewBlock}
              setShowNewBlock={setShowNewBlock}
              newBlock={newBlock}
              setNewBlock={setNewBlock}
              onCreateBlock={createBlock}
              showNewExercise={showNewExercise}
              setShowNewExercise={setShowNewExercise}
              newExercise={newExercise}
              setNewExercise={setNewExercise}
              onCreateExercise={createExercise}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Programs;
