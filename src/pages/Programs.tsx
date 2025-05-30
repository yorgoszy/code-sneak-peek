import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AthleteSelector } from "@/components/AthleteSelector";
import { Trash2, Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Exercise {
  id: string;
  name: string;
}

interface ProgramExercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  kg: string;
  percentage_1rm?: number;
  velocity_ms?: number;
  tempo?: string;
  rest?: string;
  notes?: string;
  exercise_order: number;
  exercises?: { name: string };
}

interface Block {
  id: string;
  name: string;
  block_order: number;
  program_exercises: ProgramExercise[];
}

interface Day {
  id: string;
  name: string;
  day_number: number;
  program_blocks: Block[];
}

interface Week {
  id: string;
  name: string;
  week_number: number;
  program_days: Day[];
}

interface Program {
  id: string;
  name: string;
  description?: string;
  athlete_id?: string;
  app_users?: { name: string };
  program_weeks: Week[];
}

const Programs = () => {
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
          <Dialog open={showNewProgram} onOpenChange={setShowNewProgram}>
            <DialogTrigger asChild>
              <Button className="rounded-none">
                <Plus className="w-4 h-4 mr-2" />
                Νέο Πρόγραμμα
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none">
              <DialogHeader>
                <DialogTitle>Δημιουργία Νέου Προγράμματος</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Όνομα Προγράμματος</Label>
                  <Input
                    className="rounded-none"
                    value={newProgram.name}
                    onChange={(e) => setNewProgram({...newProgram, name: e.target.value})}
                    placeholder="π.χ. Πρόγραμμα Δύναμης"
                  />
                </div>
                <div>
                  <Label>Περιγραφή</Label>
                  <Textarea
                    className="rounded-none"
                    value={newProgram.description}
                    onChange={(e) => setNewProgram({...newProgram, description: e.target.value})}
                    placeholder="Περιγραφή προγράμματος..."
                  />
                </div>
                <div>
                  <Label>Αθλητής (προαιρετικό)</Label>
                  <Select value={newProgram.athlete_id} onValueChange={(value) => setNewProgram({...newProgram, athlete_id: value})}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Επιλέξτε αθλητή" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Χωρίς συγκεκριμένο αθλητή</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="rounded-none w-full" onClick={createProgram}>
                  Δημιουργία
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Programs List */}
          <div className="lg:col-span-1">
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle>Προγράμματα</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {programs.map(program => (
                    <div
                      key={program.id}
                      className={`p-3 border cursor-pointer hover:bg-gray-50 ${
                        selectedProgram?.id === program.id ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                      onClick={() => setSelectedProgram(program)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{program.name}</h4>
                          {program.app_users && (
                            <p className="text-sm text-gray-600">{program.app_users.name}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProgram(program.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Program Details */}
          <div className="lg:col-span-3">
            {selectedProgram ? (
              <Card className="rounded-none">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{selectedProgram.name}</CardTitle>
                    <Dialog open={showNewWeek} onOpenChange={setShowNewWeek}>
                      <DialogTrigger asChild>
                        <Button className="rounded-none">
                          <Plus className="w-4 h-4 mr-2" />
                          Προσθήκη Εβδομάδας
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-none">
                        <DialogHeader>
                          <DialogTitle>Νέα Εβδομάδα</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Όνομα Εβδομάδας</Label>
                            <Input
                              className="rounded-none"
                              value={newWeek.name}
                              onChange={(e) => setNewWeek({...newWeek, name: e.target.value})}
                              placeholder="π.χ. Εβδομάδα 1"
                            />
                          </div>
                          <div>
                            <Label>Αριθμός Εβδομάδας</Label>
                            <Input
                              className="rounded-none"
                              type="number"
                              value={newWeek.week_number}
                              onChange={(e) => setNewWeek({...newWeek, week_number: parseInt(e.target.value)})}
                            />
                          </div>
                          <Button className="rounded-none w-full" onClick={createWeek}>
                            Δημιουργία
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedProgram.program_weeks?.map(week => (
                      <Card key={week.id} className="rounded-none">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{week.name}</CardTitle>
                            <div className="flex gap-2">
                              <Dialog open={showNewDay} onOpenChange={setShowNewDay}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="rounded-none"
                                    onClick={() => setCurrentWeek(week)}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Προσθήκη Ημέρας
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-none">
                                  <DialogHeader>
                                    <DialogTitle>Νέα Ημέρα</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Όνομα Ημέρας</Label>
                                      <Input
                                        className="rounded-none"
                                        value={newDay.name}
                                        onChange={(e) => setNewDay({...newDay, name: e.target.value})}
                                        placeholder="π.χ. Δευτέρα - Upper Body"
                                      />
                                    </div>
                                    <div>
                                      <Label>Αριθμός Ημέρας</Label>
                                      <Input
                                        className="rounded-none"
                                        type="number"
                                        value={newDay.day_number}
                                        onChange={(e) => setNewDay({...newDay, day_number: parseInt(e.target.value)})}
                                      />
                                    </div>
                                    <Button className="rounded-none w-full" onClick={createDay}>
                                      Δημιουργία
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteWeek(week.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {week.program_days?.map(day => (
                              <Card key={day.id} className="rounded-none">
                                <CardHeader>
                                  <div className="flex justify-between items-center">
                                    <CardTitle className="text-base">{day.name}</CardTitle>
                                    <div className="flex gap-1">
                                      <Dialog open={showNewBlock} onOpenChange={setShowNewBlock}>
                                        <DialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setCurrentDay(day)}
                                          >
                                            <Plus className="w-4 h-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-none">
                                          <DialogHeader>
                                            <DialogTitle>Νέο Block</DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <div>
                                              <Label>Όνομα Block</Label>
                                              <Input
                                                className="rounded-none"
                                                value={newBlock.name}
                                                onChange={(e) => setNewBlock({...newBlock, name: e.target.value})}
                                                placeholder="π.χ. Warm-up, Main Set"
                                              />
                                            </div>
                                            <div>
                                              <Label>Σειρά</Label>
                                              <Input
                                                className="rounded-none"
                                                type="number"
                                                value={newBlock.block_order}
                                                onChange={(e) => setNewBlock({...newBlock, block_order: parseInt(e.target.value)})}
                                              />
                                            </div>
                                            <Button className="rounded-none w-full" onClick={createBlock}>
                                              Δημιουργία
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteDay(day.id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    {day.program_blocks?.map(block => (
                                      <Card key={block.id} className="rounded-none border-gray-200">
                                        <CardHeader className="pb-2">
                                          <div className="flex justify-between items-center">
                                            <h5 className="font-medium text-sm">{block.name}</h5>
                                            <div className="flex gap-1">
                                              <Dialog open={showNewExercise} onOpenChange={setShowNewExercise}>
                                                <DialogTrigger asChild>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setCurrentBlock(block)}
                                                  >
                                                    <Plus className="w-3 h-3" />
                                                  </Button>
                                                </DialogTrigger>
                                                <DialogContent className="rounded-none max-w-2xl">
                                                  <DialogHeader>
                                                    <DialogTitle>Προσθήκη Άσκησης</DialogTitle>
                                                  </DialogHeader>
                                                  <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                      <Label>Άσκηση</Label>
                                                      <Select value={newExercise.exercise_id} onValueChange={(value) => setNewExercise({...newExercise, exercise_id: value})}>
                                                        <SelectTrigger className="rounded-none">
                                                          <SelectValue placeholder="Επιλέξτε άσκηση" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          {exercises.map(exercise => (
                                                            <SelectItem key={exercise.id} value={exercise.id}>
                                                              {exercise.name}
                                                            </SelectItem>
                                                          ))}
                                                        </SelectContent>
                                                      </Select>
                                                    </div>
                                                    <div>
                                                      <Label>Sets</Label>
                                                      <Input
                                                        className="rounded-none"
                                                        type="number"
                                                        value={newExercise.sets}
                                                        onChange={(e) => setNewExercise({...newExercise, sets: parseInt(e.target.value)})}
                                                      />
                                                    </div>
                                                    <div>
                                                      <Label>Reps</Label>
                                                      <Input
                                                        className="rounded-none"
                                                        value={newExercise.reps}
                                                        onChange={(e) => setNewExercise({...newExercise, reps: e.target.value})}
                                                        placeholder="π.χ. 8-10, 12, AMRAP"
                                                      />
                                                    </div>
                                                    <div>
                                                      <Label>%1RM</Label>
                                                      <Input
                                                        className="rounded-none"
                                                        type="number"
                                                        value={newExercise.percentage_1rm}
                                                        onChange={(e) => setNewExercise({...newExercise, percentage_1rm: parseInt(e.target.value)})}
                                                        placeholder="π.χ. 80"
                                                      />
                                                    </div>
                                                    <div>
                                                      <Label>Kg</Label>
                                                      <Input
                                                        className="rounded-none"
                                                        value={newExercise.kg}
                                                        onChange={(e) => setNewExercise({...newExercise, kg: e.target.value})}
                                                        placeholder="Αυτόματα από %1RM"
                                                      />
                                                    </div>
                                                    <div>
                                                      <Label>Tempo</Label>
                                                      <Input
                                                        className="rounded-none"
                                                        value={newExercise.tempo}
                                                        onChange={(e) => setNewExercise({...newExercise, tempo: e.target.value})}
                                                        placeholder="π.χ. 3-1-1-0"
                                                      />
                                                    </div>
                                                    <div>
                                                      <Label>Rest</Label>
                                                      <Input
                                                        className="rounded-none"
                                                        value={newExercise.rest}
                                                        onChange={(e) => setNewExercise({...newExercise, rest: e.target.value})}
                                                        placeholder="π.χ. 2-3 λεπτά"
                                                      />
                                                    </div>
                                                    <div>
                                                      <Label>Σειρά</Label>
                                                      <Input
                                                        className="rounded-none"
                                                        type="number"
                                                        value={newExercise.exercise_order}
                                                        onChange={(e) => setNewExercise({...newExercise, exercise_order: parseInt(e.target.value)})}
                                                      />
                                                    </div>
                                                    <div className="col-span-2">
                                                      <Label>Σημειώσεις</Label>
                                                      <Textarea
                                                        className="rounded-none"
                                                        value={newExercise.notes}
                                                        onChange={(e) => setNewExercise({...newExercise, notes: e.target.value})}
                                                        placeholder="Επιπλέον οδηγίες..."
                                                      />
                                                    </div>
                                                    <div className="col-span-2">
                                                      <Button className="rounded-none w-full" onClick={createExercise}>
                                                        Προσθήκη Άσκησης
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </DialogContent>
                                              </Dialog>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteBlock(block.id)}
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        </CardHeader>
                                        <CardContent className="pt-2">
                                          <div className="space-y-2">
                                            {block.program_exercises?.map(exercise => (
                                              <div key={exercise.id} className="text-xs p-2 bg-gray-50 rounded">
                                                <div className="flex justify-between items-start">
                                                  <div className="flex-1">
                                                    <div className="font-medium">
                                                      {exercise.exercises?.name}
                                                    </div>
                                                    <div className="text-gray-600 mt-1">
                                                      {exercise.sets} sets × {exercise.reps} reps
                                                      {exercise.kg && ` @ ${exercise.kg}kg`}
                                                      {exercise.percentage_1rm && ` (${exercise.percentage_1rm}%1RM)`}
                                                      {exercise.velocity_ms && ` @ ${exercise.velocity_ms}m/s`}
                                                    </div>
                                                    {exercise.tempo && (
                                                      <div className="text-gray-500">Tempo: {exercise.tempo}</div>
                                                    )}
                                                    {exercise.rest && (
                                                      <div className="text-gray-500">Rest: {exercise.rest}</div>
                                                    )}
                                                    {exercise.notes && (
                                                      <div className="text-gray-500 italic">{exercise.notes}</div>
                                                    )}
                                                  </div>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteExercise(exercise.id)}
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-none">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">Επιλέξτε ένα πρόγραμμα για να δείτε τις λεπτομέρειες</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Programs;
