
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { User, Exercise } from './types';

interface ProgramStructure {
  name: string;
  description: string;
  athlete_id: string;
  weeks: Week[];
}

interface Week {
  id: string;
  name: string;
  week_number: number;
  days: Day[];
}

interface Day {
  id: string;
  name: string;
  day_number: number;
  blocks: Block[];
}

interface Block {
  id: string;
  name: string;
  block_order: number;
  exercises: ProgramExercise[];
}

interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  percentage_1rm: number;
  kg: string;
  velocity_ms: string;
  tempo: string;
  rest: string;
  exercise_order: number;
}

interface ProgramBuilderDialogProps {
  users: User[];
  exercises: Exercise[];
  onCreateProgram: (program: ProgramStructure) => void;
  onOpenChange?: (open: boolean) => void;
}

export const ProgramBuilderDialog: React.FC<ProgramBuilderDialogProps> = ({
  users,
  exercises,
  onCreateProgram,
  onOpenChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [program, setProgram] = useState<ProgramStructure>({
    name: '',
    description: '',
    athlete_id: '',
    weeks: []
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addWeek = () => {
    const newWeek: Week = {
      id: generateId(),
      name: `Εβδομάδα ${program.weeks.length + 1}`,
      week_number: program.weeks.length + 1,
      days: []
    };
    setProgram({ ...program, weeks: [...program.weeks, newWeek] });
  };

  const removeWeek = (weekId: string) => {
    setProgram({
      ...program,
      weeks: program.weeks.filter(w => w.id !== weekId)
    });
  };

  const addDay = (weekId: string) => {
    const week = program.weeks.find(w => w.id === weekId);
    if (!week) return;

    const newDay: Day = {
      id: generateId(),
      name: `Ημέρα ${week.days.length + 1}`,
      day_number: week.days.length + 1,
      blocks: []
    };

    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? { ...w, days: [...w.days, newDay] }
          : w
      )
    });
  };

  const removeDay = (weekId: string, dayId: string) => {
    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? { ...w, days: w.days.filter(d => d.id !== dayId) }
          : w
      )
    });
  };

  const addBlock = (weekId: string, dayId: string) => {
    const week = program.weeks.find(w => w.id === weekId);
    const day = week?.days.find(d => d.id === dayId);
    if (!day) return;

    const newBlock: Block = {
      id: generateId(),
      name: `Block ${day.blocks.length + 1}`,
      block_order: day.blocks.length + 1,
      exercises: []
    };

    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? { ...d, blocks: [...d.blocks, newBlock] }
                  : d
              )
            }
          : w
      )
    });
  };

  const removeBlock = (weekId: string, dayId: string, blockId: string) => {
    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? { ...d, blocks: d.blocks.filter(b => b.id !== blockId) }
                  : d
              )
            }
          : w
      )
    });
  };

  const addExercise = (weekId: string, dayId: string, blockId: string) => {
    const week = program.weeks.find(w => w.id === weekId);
    const day = week?.days.find(d => d.id === dayId);
    const block = day?.blocks.find(b => b.id === blockId);
    if (!block) return;

    const newExercise: ProgramExercise = {
      id: generateId(),
      exercise_id: '',
      exercise_name: '',
      sets: 1,
      reps: '',
      percentage_1rm: 0,
      kg: '',
      velocity_ms: '',
      tempo: '',
      rest: '',
      exercise_order: block.exercises.length + 1
    };

    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? {
                      ...d,
                      blocks: d.blocks.map(b => 
                        b.id === blockId 
                          ? { ...b, exercises: [...b.exercises, newExercise] }
                          : b
                      )
                    }
                  : d
              )
            }
          : w
      )
    });
  };

  const updateExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => {
    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? {
                      ...d,
                      blocks: d.blocks.map(b => 
                        b.id === blockId 
                          ? {
                              ...b,
                              exercises: b.exercises.map(e => 
                                e.id === exerciseId 
                                  ? { 
                                      ...e, 
                                      [field]: value,
                                      ...(field === 'exercise_id' && {
                                        exercise_name: exercises.find(ex => ex.id === value)?.name || ''
                                      })
                                    }
                                  : e
                              )
                            }
                          : b
                      )
                    }
                  : d
              )
            }
          : w
      )
    });
  };

  const removeExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    setProgram({
      ...program,
      weeks: program.weeks.map(w => 
        w.id === weekId 
          ? {
              ...w,
              days: w.days.map(d => 
                d.id === dayId 
                  ? {
                      ...d,
                      blocks: d.blocks.map(b => 
                        b.id === blockId 
                          ? { ...b, exercises: b.exercises.filter(e => e.id !== exerciseId) }
                          : b
                      )
                    }
                  : d
              )
            }
          : w
      )
    });
  };

  const handleAthleteChange = (value: string) => {
    const athleteId = value === "no-athlete" ? "" : value;
    setProgram({ ...program, athlete_id: athleteId });
  };

  const handleSaveProgram = () => {
    if (!program.name) {
      alert('Το όνομα προγράμματος είναι υποχρεωτικό');
      return;
    }
    onCreateProgram(program);
    setIsOpen(false);
    setProgram({ name: '', description: '', athlete_id: '', weeks: [] });
  };

  return (
    <>
      <Button className="rounded-none" onClick={() => handleOpenChange(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Νέο Πρόγραμμα
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="rounded-none max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Βοηθός Πληροφοριών</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Program Info */}
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="text-lg">Όνομα Προγράμματος *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  className="rounded-none"
                  value={program.name}
                  onChange={(e) => setProgram({ ...program, name: e.target.value })}
                  placeholder="π.χ. Πρόγραμμα Δύναμης"
                />
                
                <div>
                  <Label>Περιγραφή</Label>
                  <Textarea
                    className="rounded-none"
                    value={program.description}
                    onChange={(e) => setProgram({ ...program, description: e.target.value })}
                    placeholder="Περιγραφή προγράμματος..."
                  />
                </div>

                <div>
                  <Label>Αθλητής (προαιρετικό)</Label>
                  <Select 
                    value={program.athlete_id || "no-athlete"} 
                    onValueChange={handleAthleteChange}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Επιλέξτε αθλητή" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-athlete">Χωρίς συγκεκριμένο αθλητή</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Training Weeks */}
            <Card className="rounded-none">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Εβδομάδες Προπόνησης</CardTitle>
                  <Button onClick={addWeek} className="rounded-none">
                    <Plus className="w-4 h-4 mr-2" />
                    +Week
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {program.weeks.map((week) => (
                    <Card key={week.id} className="rounded-none border-2">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">{week.name}</CardTitle>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => addDay(week.id)}
                              size="sm"
                              className="rounded-none"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              +Day
                            </Button>
                            <Button
                              onClick={() => removeWeek(week.id)}
                              size="sm"
                              variant="destructive"
                              className="rounded-none"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {week.days.map((day) => (
                            <Card key={day.id} className="rounded-none">
                              <CardHeader>
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-sm">{day.name}</CardTitle>
                                  <div className="flex gap-1">
                                    <Button
                                      onClick={() => addBlock(week.id, day.id)}
                                      size="sm"
                                      variant="ghost"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      onClick={() => removeDay(week.id, day.id)}
                                      size="sm"
                                      variant="ghost"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {day.blocks.map((block) => (
                                    <Card key={block.id} className="rounded-none bg-gray-50">
                                      <CardHeader className="pb-2">
                                        <div className="flex justify-between items-center">
                                          <h6 className="text-xs font-medium">{block.name}</h6>
                                          <div className="flex gap-1">
                                            <Button
                                              onClick={() => addExercise(week.id, day.id, block.id)}
                                              size="sm"
                                              variant="ghost"
                                            >
                                              <Plus className="w-2 h-2" />
                                            </Button>
                                            <Button
                                              onClick={() => removeBlock(week.id, day.id, block.id)}
                                              size="sm"
                                              variant="ghost"
                                            >
                                              <Trash2 className="w-2 h-2" />
                                            </Button>
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="pt-2">
                                        <div className="space-y-2">
                                          {block.exercises.map((exercise) => (
                                            <div key={exercise.id} className="grid grid-cols-8 gap-1 text-xs">
                                              <Select
                                                value={exercise.exercise_id}
                                                onValueChange={(value) => updateExercise(week.id, day.id, block.id, exercise.id, 'exercise_id', value)}
                                              >
                                                <SelectTrigger className="rounded-none h-8 text-xs col-span-2">
                                                  <SelectValue placeholder="Άσκηση" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {exercises.map(ex => (
                                                    <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              
                                              <Input
                                                className="rounded-none h-8 text-xs"
                                                placeholder="Sets"
                                                type="number"
                                                value={exercise.sets}
                                                onChange={(e) => updateExercise(week.id, day.id, block.id, exercise.id, 'sets', parseInt(e.target.value))}
                                              />
                                              
                                              <Input
                                                className="rounded-none h-8 text-xs"
                                                placeholder="Reps"
                                                value={exercise.reps}
                                                onChange={(e) => updateExercise(week.id, day.id, block.id, exercise.id, 'reps', e.target.value)}
                                              />
                                              
                                              <Input
                                                className="rounded-none h-8 text-xs"
                                                placeholder="%1RM"
                                                type="number"
                                                value={exercise.percentage_1rm}
                                                onChange={(e) => updateExercise(week.id, day.id, block.id, exercise.id, 'percentage_1rm', parseInt(e.target.value))}
                                              />
                                              
                                              <Input
                                                className="rounded-none h-8 text-xs"
                                                placeholder="kg"
                                                value={exercise.kg}
                                                onChange={(e) => updateExercise(week.id, day.id, block.id, exercise.id, 'kg', e.target.value)}
                                              />
                                              
                                              <Input
                                                className="rounded-none h-8 text-xs"
                                                placeholder="m/s"
                                                value={exercise.velocity_ms}
                                                onChange={(e) => updateExercise(week.id, day.id, block.id, exercise.id, 'velocity_ms', e.target.value)}
                                              />
                                              
                                              <Button
                                                onClick={() => removeExercise(week.id, day.id, block.id, exercise.id)}
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                              >
                                                <Trash2 className="w-2 h-2" />
                                              </Button>
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

            <div className="flex justify-end">
              <Button onClick={handleSaveProgram} className="rounded-none bg-green-600 hover:bg-green-700">
                Αποθήκευση Προγράμματος
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
