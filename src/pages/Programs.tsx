import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { NewProgramDialog } from "@/components/programs/NewProgramDialog";
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

  // Dialog states
  const [showNewProgram, setShowNewProgram] = useState(false);
  const [showNewWeek, setShowNewWeek] = useState(false);
  const [showNewDay, setShowNewDay] = useState(false);
  const [showNewBlock, setShowNewBlock] = useState(false);
  const [showNewExercise, setShowNewExercise] = useState(false);

  console.log('showNewProgram state:', showNewProgram);

  // Form states
  const [newProgram, setNewProgram] = useState({ name: '', description: '', athlete_id: '' });
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

  const createProgram = async () => {
    console.log('createProgram called');
    if (!newProgram.name) {
      toast.error('Το όνομα προγράμματος είναι υποχρεωτικό');
      return;
    }

    const { data, error } = await supabase
      .from('programs')
      .insert([{
        name: newProgram.name,
        description: newProgram.description,
        athlete_id: newProgram.athlete_id || null
      }])
      .select()
      .single();

    if (error) {
      toast.error('Σφάλμα δημιουργίας προγράμματος');
      console.error(error);
    } else {
      toast.success('Το πρόγραμμα δημιουργήθηκε επιτυχώς');
      setNewProgram({ name: '', description: '', athlete_id: '' });
      setShowNewProgram(false);
      fetchPrograms();
    }
  };

  const createWeek = async () => {
    if (!selectedProgram || !newWeek.name) {
      toast.error('Συμπληρώστε όλα τα απαραίτητα πεδία');
      return;
    }

    const { error } = await supabase
      .from('program_weeks')
      .insert([{
        program_id: selectedProgram.id,
        name: newWeek.name,
        week_number: newWeek.week_number
      }]);

    if (error) {
      toast.error('Σφάλμα δημιουργίας εβδομάδας');
      console.error(error);
    } else {
      toast.success('Η εβδομάδα δημιουργήθηκε επιτυχώς');
      setNewWeek({ name: '', week_number: 1 });
      setShowNewWeek(false);
      fetchPrograms();
    }
  };

  const createDay = async () => {
    if (!currentWeek || !newDay.name) {
      toast.error('Συμπληρώστε όλα τα απαραίτητα πεδία');
      return;
    }

    const { error } = await supabase
      .from('program_days')
      .insert([{
        week_id: currentWeek.id,
        name: newDay.name,
        day_number: newDay.day_number
      }]);

    if (error) {
      toast.error('Σφάλμα δημιουργίας ημέρας');
      console.error(error);
    } else {
      toast.success('Η ημέρα δημιουργήθηκε επιτυχώς');
      setNewDay({ name: '', day_number: 1 });
      setShowNewDay(false);
      fetchPrograms();
    }
  };

  const createBlock = async () => {
    if (!currentDay || !newBlock.name) {
      toast.error('Συμπληρώστε όλα τα απαραίτητα πεδία');
      return;
    }

    const { error } = await supabase
      .from('program_blocks')
      .insert([{
        day_id: currentDay.id,
        name: newBlock.name,
        block_order: newBlock.block_order
      }]);

    if (error) {
      toast.error('Σφάλμα δημιουργίας block');
      console.error(error);
    } else {
      toast.success('Το block δημιουργήθηκε επιτυχώς');
      setNewBlock({ name: '', block_order: 1 });
      setShowNewBlock(false);
      fetchPrograms();
    }
  };

  const createExercise = async () => {
    if (!currentBlock || !newExercise.exercise_id) {
      toast.error('Συμπληρώστε όλα τα απαραίτητα πεδία');
      return;
    }

    let calculatedKg = newExercise.kg;
    let suggestedVelocity = null;

    // Calculate kg from percentage if athlete is selected and percentage is provided
    if (selectedProgram?.athlete_id && newExercise.percentage_1rm > 0) {
      const { data: oneRmData } = await supabase
        .rpc('get_latest_1rm', {
          athlete_id: selectedProgram.athlete_id,
          exercise_id: newExercise.exercise_id
        });

      if (oneRmData) {
        calculatedKg = Math.round(oneRmData * (newExercise.percentage_1rm / 100)).toString();
        
        // Get suggested velocity
        const { data: velocityData } = await supabase
          .rpc('get_suggested_velocity', {
            athlete_id: selectedProgram.athlete_id,
            exercise_id: newExercise.exercise_id,
            percentage: newExercise.percentage_1rm
          });

        if (velocityData) {
          suggestedVelocity = velocityData;
        }
      }
    }

    const { error } = await supabase
      .from('program_exercises')
      .insert([{
        block_id: currentBlock.id,
        exercise_id: newExercise.exercise_id,
        sets: newExercise.sets,
        reps: newExercise.reps,
        kg: calculatedKg,
        percentage_1rm: newExercise.percentage_1rm || null,
        velocity_ms: suggestedVelocity,
        tempo: newExercise.tempo,
        rest: newExercise.rest,
        notes: newExercise.notes,
        exercise_order: newExercise.exercise_order
      }]);

    if (error) {
      toast.error('Σφάλμα προσθήκης άσκησης');
      console.error(error);
    } else {
      toast.success('Η άσκηση προστέθηκε επιτυχώς');
      setNewExercise({
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
      setShowNewExercise(false);
      fetchPrograms();
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

  const handleNewProgramDialogChange = (open: boolean) => {
    console.log('Dialog open change:', open);
    setShowNewProgram(open);
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
          <NewProgramDialog
            open={showNewProgram}
            onOpenChange={handleNewProgramDialogChange}
            newProgram={newProgram}
            setNewProgram={setNewProgram}
            users={users}
            onCreateProgram={createProgram}
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
