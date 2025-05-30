
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Edit, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AthleteSelector } from "@/components/AthleteSelector";

interface Exercise {
  id: string;
  name: string;
}

interface ProgramExercise {
  id?: string;
  exercise_id: string;
  exercise_name?: string;
  sets: number;
  reps: string;
  percentage_1rm?: number;
  kg?: string;
  velocity_ms?: number;
  tempo?: string;
  rest?: string;
  notes?: string;
  exercise_order: number;
}

interface Block {
  id?: string;
  name: string;
  block_order: number;
  exercises: ProgramExercise[];
}

interface Day {
  id?: string;
  name: string;
  day_number: number;
  blocks: Block[];
}

interface Week {
  id?: string;
  name: string;
  week_number: number;
  days: Day[];
}

interface Program {
  id?: string;
  name: string;
  description?: string;
  athlete_id?: string;
  weeks: Week[];
}

const Programs = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [currentProgram, setCurrentProgram] = useState<Program>({
    name: '',
    description: '',
    weeks: []
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrograms();
    fetchExercises();
    fetchAthletes();
  }, []);

  const fetchAthletes = async () => {
    const { data } = await supabase
      .from('app_users')
      .select('id, name')
      .eq('role', 'athlete')
      .order('name');
    
    if (data) setAthletes(data);
  };

  const fetchExercises = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('id, name')
      .order('name');
    
    if (data) setExercises(data);
  };

  const fetchPrograms = async () => {
    setLoading(true);
    const { data: programsData } = await supabase
      .from('programs')
      .select(`
        *,
        app_users(name)
      `)
      .order('created_at', { ascending: false });

    if (programsData) {
      const programsWithStructure = await Promise.all(
        programsData.map(async (program) => {
          const { data: weeks } = await supabase
            .from('program_weeks')
            .select('*')
            .eq('program_id', program.id)
            .order('week_number');

          const weeksWithDays = await Promise.all(
            (weeks || []).map(async (week) => {
              const { data: days } = await supabase
                .from('program_days')
                .select('*')
                .eq('week_id', week.id)
                .order('day_number');

              const daysWithBlocks = await Promise.all(
                (days || []).map(async (day) => {
                  const { data: blocks } = await supabase
                    .from('program_blocks')
                    .select('*')
                    .eq('day_id', day.id)
                    .order('block_order');

                  const blocksWithExercises = await Promise.all(
                    (blocks || []).map(async (block) => {
                      const { data: exercises } = await supabase
                        .from('program_exercises')
                        .select(`
                          *,
                          exercises(name)
                        `)
                        .eq('block_id', block.id)
                        .order('exercise_order');

                      return {
                        ...block,
                        exercises: exercises?.map(ex => ({
                          ...ex,
                          exercise_name: ex.exercises?.name
                        })) || []
                      };
                    })
                  );

                  return {
                    ...day,
                    blocks: blocksWithExercises
                  };
                })
              );

              return {
                ...week,
                days: daysWithBlocks
              };
            })
          );

          return {
            ...program,
            weeks: weeksWithDays
          };
        })
      );

      setPrograms(programsWithStructure);
    }
    setLoading(false);
  };

  const calculateWeight = async (exerciseId: string, percentage: number) => {
    if (!selectedAthleteId || !percentage) return null;

    const { data, error } = await supabase.rpc('get_latest_1rm', {
      athlete_id: selectedAthleteId,
      exercise_id: exerciseId
    });

    if (error) {
      console.error('Error getting 1RM:', error);
      return null;
    }

    return data ? Math.round((data * percentage) / 100) : null;
  };

  const getSuggestedVelocity = async (exerciseId: string, percentage: number) => {
    if (!selectedAthleteId || !percentage) return null;

    const { data, error } = await supabase.rpc('get_suggested_velocity', {
      athlete_id: selectedAthleteId,
      exercise_id: exerciseId,
      percentage: percentage
    });

    if (error) {
      console.error('Error getting suggested velocity:', error);
      return null;
    }

    return data ? parseFloat(data.toFixed(2)) : null;
  };

  const saveProgram = async () => {
    if (!currentProgram.name) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ εισάγετε όνομα προγράμματος",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let programId = currentProgram.id;

      if (editingProgramId) {
        // Update existing program
        const { error: updateError } = await supabase
          .from('programs')
          .update({
            name: currentProgram.name,
            description: currentProgram.description,
            athlete_id: selectedAthleteId || null
          })
          .eq('id', editingProgramId);

        if (updateError) throw updateError;
        programId = editingProgramId;

        // Delete existing structure
        await supabase.from('program_weeks').delete().eq('program_id', editingProgramId);
      } else {
        // Create new program
        const { data: programData, error: programError } = await supabase
          .from('programs')
          .insert({
            name: currentProgram.name,
            description: currentProgram.description,
            athlete_id: selectedAthleteId || null
          })
          .select()
          .single();

        if (programError) throw programError;
        programId = programData.id;
      }

      // Save weeks, days, blocks, and exercises
      for (const week of currentProgram.weeks) {
        const { data: weekData, error: weekError } = await supabase
          .from('program_weeks')
          .insert({
            program_id: programId,
            name: week.name,
            week_number: week.week_number
          })
          .select()
          .single();

        if (weekError) throw weekError;

        for (const day of week.days) {
          const { data: dayData, error: dayError } = await supabase
            .from('program_days')
            .insert({
              week_id: weekData.id,
              name: day.name,
              day_number: day.day_number
            })
            .select()
            .single();

          if (dayError) throw dayError;

          for (const block of day.blocks) {
            const { data: blockData, error: blockError } = await supabase
              .from('program_blocks')
              .insert({
                day_id: dayData.id,
                name: block.name,
                block_order: block.block_order
              })
              .select()
              .single();

            if (blockError) throw blockError;

            for (const exercise of block.exercises) {
              const { error: exerciseError } = await supabase
                .from('program_exercises')
                .insert({
                  block_id: blockData.id,
                  exercise_id: exercise.exercise_id,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  percentage_1rm: exercise.percentage_1rm,
                  kg: exercise.kg,
                  velocity_ms: exercise.velocity_ms,
                  tempo: exercise.tempo,
                  rest: exercise.rest,
                  notes: exercise.notes,
                  exercise_order: exercise.exercise_order
                });

              if (exerciseError) throw exerciseError;
            }
          }
        }
      }

      toast({
        title: "Επιτυχία",
        description: "Το πρόγραμμα αποθηκεύτηκε επιτυχώς"
      });

      resetForm();
      fetchPrograms();
    } catch (error) {
      console.error('Error saving program:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την αποθήκευση",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const resetForm = () => {
    setCurrentProgram({
      name: '',
      description: '',
      weeks: []
    });
    setSelectedAthleteId('');
    setEditingProgramId(null);
  };

  const addWeek = () => {
    const newWeek: Week = {
      name: `Εβδομάδα ${currentProgram.weeks.length + 1}`,
      week_number: currentProgram.weeks.length + 1,
      days: []
    };

    setCurrentProgram(prev => ({
      ...prev,
      weeks: [...prev.weeks, newWeek]
    }));
  };

  const addDay = (weekIndex: number) => {
    const newDay: Day = {
      name: `Ημέρα ${currentProgram.weeks[weekIndex].days.length + 1}`,
      day_number: currentProgram.weeks[weekIndex].days.length + 1,
      blocks: []
    };

    setCurrentProgram(prev => ({
      ...prev,
      weeks: prev.weeks.map((week, idx) => 
        idx === weekIndex 
          ? { ...week, days: [...week.days, newDay] }
          : week
      )
    }));
  };

  const addBlock = (weekIndex: number, dayIndex: number) => {
    const newBlock: Block = {
      name: `Block ${currentProgram.weeks[weekIndex].days[dayIndex].blocks.length + 1}`,
      block_order: currentProgram.weeks[weekIndex].days[dayIndex].blocks.length + 1,
      exercises: []
    };

    setCurrentProgram(prev => ({
      ...prev,
      weeks: prev.weeks.map((week, wIdx) => 
        wIdx === weekIndex 
          ? {
              ...week,
              days: week.days.map((day, dIdx) => 
                dIdx === dayIndex 
                  ? { ...day, blocks: [...day.blocks, newBlock] }
                  : day
              )
            }
          : week
      )
    }));
  };

  const addExercise = (weekIndex: number, dayIndex: number, blockIndex: number) => {
    const newExercise: ProgramExercise = {
      exercise_id: '',
      sets: 1,
      reps: '',
      exercise_order: currentProgram.weeks[weekIndex].days[dayIndex].blocks[blockIndex].exercises.length + 1
    };

    setCurrentProgram(prev => ({
      ...prev,
      weeks: prev.weeks.map((week, wIdx) => 
        wIdx === weekIndex 
          ? {
              ...week,
              days: week.days.map((day, dIdx) => 
                dIdx === dayIndex 
                  ? {
                      ...day,
                      blocks: day.blocks.map((block, bIdx) => 
                        bIdx === blockIndex 
                          ? { ...block, exercises: [...block.exercises, newExercise] }
                          : block
                      )
                    }
                  : day
              )
            }
          : week
      )
    }));
  };

  const updateExercise = async (weekIndex: number, dayIndex: number, blockIndex: number, exerciseIndex: number, field: string, value: any) => {
    const updatedProgram = { ...currentProgram };
    const exercise = updatedProgram.weeks[weekIndex].days[dayIndex].blocks[blockIndex].exercises[exerciseIndex];
    
    if (field === 'exercise_id') {
      const selectedExercise = exercises.find(ex => ex.id === value);
      exercise.exercise_name = selectedExercise?.name;
    }
    
    exercise[field as keyof ProgramExercise] = value;

    // Auto-calculate weight and velocity when percentage changes
    if (field === 'percentage_1rm' && value && exercise.exercise_id && selectedAthleteId) {
      const weight = await calculateWeight(exercise.exercise_id, value);
      const velocity = await getSuggestedVelocity(exercise.exercise_id, value);
      
      if (weight !== null) {
        exercise.kg = weight.toString();
      }
      if (velocity !== null) {
        exercise.velocity_ms = velocity;
      }
    }

    setCurrentProgram(updatedProgram);
  };

  const deleteWeek = (weekIndex: number) => {
    setCurrentProgram(prev => ({
      ...prev,
      weeks: prev.weeks.filter((_, idx) => idx !== weekIndex)
    }));
  };

  const deleteDay = (weekIndex: number, dayIndex: number) => {
    setCurrentProgram(prev => ({
      ...prev,
      weeks: prev.weeks.map((week, wIdx) => 
        wIdx === weekIndex 
          ? { ...week, days: week.days.filter((_, dIdx) => dIdx !== dayIndex) }
          : week
      )
    }));
  };

  const deleteBlock = (weekIndex: number, dayIndex: number, blockIndex: number) => {
    setCurrentProgram(prev => ({
      ...prev,
      weeks: prev.weeks.map((week, wIdx) => 
        wIdx === weekIndex 
          ? {
              ...week,
              days: week.days.map((day, dIdx) => 
                dIdx === dayIndex 
                  ? { ...day, blocks: day.blocks.filter((_, bIdx) => bIdx !== blockIndex) }
                  : day
              )
            }
          : week
      )
    }));
  };

  const deleteExercise = (weekIndex: number, dayIndex: number, blockIndex: number, exerciseIndex: number) => {
    setCurrentProgram(prev => ({
      ...prev,
      weeks: prev.weeks.map((week, wIdx) => 
        wIdx === weekIndex 
          ? {
              ...week,
              days: week.days.map((day, dIdx) => 
                dIdx === dayIndex 
                  ? {
                      ...day,
                      blocks: day.blocks.map((block, bIdx) => 
                        bIdx === blockIndex 
                          ? { ...block, exercises: block.exercises.filter((_, eIdx) => eIdx !== exerciseIndex) }
                          : block
                      )
                    }
                  : day
              )
            }
          : week
      )
    }));
  };

  const editProgram = (program: Program) => {
    setCurrentProgram(program);
    setSelectedAthleteId(program.athlete_id || '');
    setEditingProgramId(program.id || null);
  };

  const deleteProgram = async (programId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα;')) return;

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);

    if (error) {
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη διαγραφή",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Επιτυχία",
        description: "Το πρόγραμμα διαγράφηκε επιτυχώς"
      });
      fetchPrograms();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Προγράμματα Προπόνησης</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Νέο Πρόγραμμα
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProgramId ? 'Επεξεργασία Προγράμματος' : 'Νέο Πρόγραμμα Προπόνησης'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Program Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="program-name">Όνομα Προγράμματος</Label>
                  <Input
                    id="program-name"
                    value={currentProgram.name}
                    onChange={(e) => setCurrentProgram(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Εισάγετε όνομα προγράμματος"
                  />
                </div>
                
                <div>
                  <Label htmlFor="athlete-select">Αθλητής (προαιρετικό)</Label>
                  <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Επιλέξτε αθλητή" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Χωρίς αθλητή</SelectItem>
                      {athletes.map(athlete => (
                        <SelectItem key={athlete.id} value={athlete.id}>
                          {athlete.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="program-description">Περιγραφή</Label>
                <Textarea
                  id="program-description"
                  value={currentProgram.description || ''}
                  onChange={(e) => setCurrentProgram(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Περιγραφή προγράμματος..."
                />
              </div>

              {/* Weeks */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Εβδομάδες</h3>
                  <Button onClick={addWeek} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Προσθήκη Εβδομάδας
                  </Button>
                </div>

                {currentProgram.weeks.map((week, weekIndex) => (
                  <Card key={weekIndex} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Input
                            value={week.name}
                            onChange={(e) => {
                              const updatedProgram = { ...currentProgram };
                              updatedProgram.weeks[weekIndex].name = e.target.value;
                              setCurrentProgram(updatedProgram);
                            }}
                            className="font-semibold text-lg"
                          />
                          <Badge variant="outline">Εβδομάδα {week.week_number}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => addDay(weekIndex)} size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" />
                            Ημέρα
                          </Button>
                          <Button onClick={() => deleteWeek(weekIndex)} size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Days */}
                      {week.days.map((day, dayIndex) => (
                        <Card key={dayIndex} className="border-l-4 border-l-green-500">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={day.name}
                                  onChange={(e) => {
                                    const updatedProgram = { ...currentProgram };
                                    updatedProgram.weeks[weekIndex].days[dayIndex].name = e.target.value;
                                    setCurrentProgram(updatedProgram);
                                  }}
                                  className="font-medium"
                                />
                                <Badge variant="outline">Ημέρα {day.day_number}</Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => addBlock(weekIndex, dayIndex)} size="sm" variant="outline">
                                  <Plus className="h-4 w-4 mr-1" />
                                  Block
                                </Button>
                                <Button onClick={() => deleteDay(weekIndex, dayIndex)} size="sm" variant="destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Blocks */}
                            {day.blocks.map((block, blockIndex) => (
                              <Card key={blockIndex} className="border-l-4 border-l-orange-500">
                                <CardHeader className="pb-2">
                                  <div className="flex justify-between items-center">
                                    <Input
                                      value={block.name}
                                      onChange={(e) => {
                                        const updatedProgram = { ...currentProgram };
                                        updatedProgram.weeks[weekIndex].days[dayIndex].blocks[blockIndex].name = e.target.value;
                                        setCurrentProgram(updatedProgram);
                                      }}
                                      className="font-medium max-w-xs"
                                    />
                                    <div className="flex gap-2">
                                      <Button onClick={() => addExercise(weekIndex, dayIndex, blockIndex)} size="sm" variant="outline">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Άσκηση
                                      </Button>
                                      <Button onClick={() => deleteBlock(weekIndex, dayIndex, blockIndex)} size="sm" variant="destructive">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  {/* Exercises */}
                                  <div className="space-y-4">
                                    {block.exercises.map((exercise, exerciseIndex) => (
                                      <div key={exerciseIndex} className="grid grid-cols-8 gap-2 items-center p-3 border rounded">
                                        <div className="col-span-1">
                                          <Label className="text-xs">Άσκηση</Label>
                                          <Select 
                                            value={exercise.exercise_id} 
                                            onValueChange={(value) => updateExercise(weekIndex, dayIndex, blockIndex, exerciseIndex, 'exercise_id', value)}
                                          >
                                            <SelectTrigger className="h-8">
                                              <SelectValue placeholder="Επιλογή" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {exercises.map(ex => (
                                                <SelectItem key={ex.id} value={ex.id}>
                                                  {ex.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div>
                                          <Label className="text-xs">Sets</Label>
                                          <Input
                                            type="number"
                                            value={exercise.sets}
                                            onChange={(e) => updateExercise(weekIndex, dayIndex, blockIndex, exerciseIndex, 'sets', parseInt(e.target.value))}
                                            className="h-8"
                                          />
                                        </div>

                                        <div>
                                          <Label className="text-xs">Reps</Label>
                                          <Input
                                            value={exercise.reps}
                                            onChange={(e) => updateExercise(weekIndex, dayIndex, blockIndex, exerciseIndex, 'reps', e.target.value)}
                                            placeholder="8-12"
                                            className="h-8"
                                          />
                                        </div>

                                        <div>
                                          <Label className="text-xs">%1RM</Label>
                                          <Input
                                            type="number"
                                            value={exercise.percentage_1rm || ''}
                                            onChange={(e) => updateExercise(weekIndex, dayIndex, blockIndex, exerciseIndex, 'percentage_1rm', e.target.value ? parseFloat(e.target.value) : null)}
                                            placeholder="80"
                                            className="h-8"
                                          />
                                        </div>

                                        <div>
                                          <Label className="text-xs">Kg</Label>
                                          <Input
                                            value={exercise.kg || ''}
                                            onChange={(e) => updateExercise(weekIndex, dayIndex, blockIndex, exerciseIndex, 'kg', e.target.value)}
                                            className="h-8"
                                            readOnly={!!exercise.percentage_1rm}
                                          />
                                        </div>

                                        <div>
                                          <Label className="text-xs">m/s</Label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value={exercise.velocity_ms || ''}
                                            onChange={(e) => updateExercise(weekIndex, dayIndex, blockIndex, exerciseIndex, 'velocity_ms', e.target.value ? parseFloat(e.target.value) : null)}
                                            className="h-8"
                                          />
                                        </div>

                                        <div>
                                          <Label className="text-xs">Rest</Label>
                                          <Input
                                            value={exercise.rest || ''}
                                            onChange={(e) => updateExercise(weekIndex, dayIndex, blockIndex, exerciseIndex, 'rest', e.target.value)}
                                            placeholder="2min"
                                            className="h-8"
                                          />
                                        </div>

                                        <div className="flex justify-center">
                                          <Button 
                                            onClick={() => deleteExercise(weekIndex, dayIndex, blockIndex, exerciseIndex)} 
                                            size="sm" 
                                            variant="destructive"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={resetForm}>
                  Ακύρωση
                </Button>
                <Button onClick={saveProgram} disabled={loading}>
                  {loading ? 'Αποθήκευση...' : editingProgramId ? 'Ενημέρωση' : 'Αποθήκευση'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Programs List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Φόρτωση προγραμμάτων...</div>
        ) : programs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Δεν υπάρχουν προγράμματα. Δημιουργήστε το πρώτο σας πρόγραμμα!
          </div>
        ) : (
          programs.map((program) => (
            <Card key={program.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{program.name}</h3>
                  {program.description && (
                    <p className="text-gray-600">{program.description}</p>
                  )}
                  {program.athlete_id && (
                    <Badge variant="secondary">
                      {athletes.find(a => a.id === program.athlete_id)?.name || 'Άγνωστος Αθλητής'}
                    </Badge>
                  )}
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{program.weeks?.length || 0} Εβδομάδες</span>
                    <span>{program.weeks?.reduce((total, week) => total + (week.days?.length || 0), 0) || 0} Ημέρες</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editProgram(program)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Επεξεργασία
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteProgram(program.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Programs;
