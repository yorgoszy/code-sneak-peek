
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";
import { useExercises } from "@/hooks/useExercises";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: EnrichedAssignment | null;
  onRefresh?: () => void;
}

export const ProgramEditDialog: React.FC<ProgramEditDialogProps> = ({
  isOpen,
  onClose,
  assignment,
  onRefresh
}) => {
  const [programData, setProgramData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { data: exercises = [] } = useExercises();

  useEffect(() => {
    if (isOpen && assignment) {
      setProgramData(assignment.programs);
    }
  }, [isOpen, assignment]);

  const handleSave = async () => {
    if (!programData || !assignment) return;

    setLoading(true);
    try {
      // Save program weeks structure
      for (const week of programData.program_weeks || []) {
        for (const day of week.program_days || []) {
          for (const block of day.program_blocks || []) {
            for (const exercise of block.program_exercises || []) {
              const { error } = await supabase
                .from('program_exercises')
                .update({
                  sets: exercise.sets,
                  reps: exercise.reps,
                  kg: exercise.kg,
                  tempo: exercise.tempo,
                  rest: exercise.rest,
                  percentage_1rm: exercise.percentage_1rm || null
                })
                .eq('id', exercise.id);

              if (error) throw error;
            }
          }
        }
      }

      toast.success('Το πρόγραμμα ενημερώθηκε επιτυχώς');
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Error updating program:', error);
      toast.error('Σφάλμα κατά την ενημέρωση του προγράμματος');
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseUpdate = (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => {
    setProgramData((prev: any) => ({
      ...prev,
      program_weeks: prev.program_weeks?.map((week: any) =>
        week.id === weekId
          ? {
              ...week,
              program_days: week.program_days?.map((day: any) =>
                day.id === dayId
                  ? {
                      ...day,
                      program_blocks: day.program_blocks?.map((block: any) =>
                        block.id === blockId
                          ? {
                              ...block,
                              program_exercises: block.program_exercises?.map((exercise: any) =>
                                exercise.id === exerciseId
                                  ? { ...exercise, [field]: value }
                                  : exercise
                              )
                            }
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

  const addExerciseToBlock = async (weekId: string, dayId: string, blockId: string) => {
    if (!exercises.length) return;

    try {
      const { data, error } = await supabase
        .from('program_exercises')
        .insert({
          exercise_id: exercises[0].id,
          sets: 3,
          reps: '10',
          kg: '',
          tempo: '',
          rest: '60',
          exercise_order: 999
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setProgramData((prev: any) => ({
        ...prev,
        program_weeks: prev.program_weeks?.map((week: any) =>
          week.id === weekId
            ? {
                ...week,
                program_days: week.program_days?.map((day: any) =>
                  day.id === dayId
                    ? {
                        ...day,
                        program_blocks: day.program_blocks?.map((block: any) =>
                          block.id === blockId
                            ? {
                                ...block,
                                program_exercises: [
                                  ...(block.program_exercises || []),
                                  {
                                    ...data,
                                    exercises: exercises[0]
                                  }
                                ]
                              }
                            : block
                        )
                      }
                    : day
                )
              }
            : week
        )
      }));

      toast.success('Άσκηση προστέθηκε επιτυχώς');
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast.error('Σφάλμα κατά την προσθήκη άσκησης');
    }
  };

  const addBlockToDay = async (weekId: string, dayId: string) => {
    try {
      const { data, error } = await supabase
        .from('program_blocks')
        .insert({
          name: 'Νέο Block',
          block_order: 999
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setProgramData((prev: any) => ({
        ...prev,
        program_weeks: prev.program_weeks?.map((week: any) =>
          week.id === weekId
            ? {
                ...week,
                program_days: week.program_days?.map((day: any) =>
                  day.id === dayId
                    ? {
                        ...day,
                        program_blocks: [
                          ...(day.program_blocks || []),
                          {
                            ...data,
                            program_exercises: []
                          }
                        ]
                      }
                    : day
                )
              }
            : week
        )
      }));

      toast.success('Block προστέθηκε επιτυχώς');
    } catch (error) {
      console.error('Error adding block:', error);
      toast.error('Σφάλμα κατά την προσθήκη block');
    }
  };

  if (!programData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Επεξεργασία Προγράμματος: {programData.name}</span>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <Save className="w-4 h-4 mr-2" />
              Αποθήκευση
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {programData.program_weeks?.map((week: any) => (
            <Card key={week.id} className="rounded-none">
              <CardHeader>
                <CardTitle>{week.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="0" className="w-full">
                  <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${week.program_days?.length || 1}, 1fr)` }}>
                    {week.program_days?.map((day: any, dayIndex: number) => (
                      <TabsTrigger key={day.id} value={dayIndex.toString()} className="rounded-none">
                        {day.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {week.program_days?.map((day: any, dayIndex: number) => (
                    <TabsContent key={day.id} value={dayIndex.toString()} className="mt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-semibold">{day.name}</h4>
                          <Button
                            onClick={() => addBlockToDay(week.id, day.id)}
                            size="sm"
                            variant="outline"
                            className="rounded-none"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Προσθήκη Block
                          </Button>
                        </div>

                        {day.program_blocks?.map((block: any) => (
                          <Card key={block.id} className="rounded-none">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center justify-between">
                                <span>{block.name}</span>
                                <Button
                                  onClick={() => addExerciseToBlock(week.id, day.id, block.id)}
                                  size="sm"
                                  variant="outline"
                                  className="rounded-none"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Άσκηση
                                </Button>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {block.program_exercises?.map((exercise: any, exerciseIndex: number) => (
                                <div key={exercise.id} className="grid grid-cols-8 gap-2 items-center p-2 bg-gray-50 rounded">
                                  <div className="col-span-2">
                                    <Select
                                      value={exercise.exercise_id}
                                      onValueChange={(value) => handleExerciseUpdate(week.id, day.id, block.id, exercise.id, 'exercise_id', value)}
                                    >
                                      <SelectTrigger className="rounded-none">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {exercises.map((ex) => (
                                          <SelectItem key={ex.id} value={ex.id}>
                                            {ex.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <Input
                                    type="number"
                                    placeholder="Sets"
                                    value={exercise.sets}
                                    onChange={(e) => handleExerciseUpdate(week.id, day.id, block.id, exercise.id, 'sets', parseInt(e.target.value))}
                                    className="rounded-none"
                                  />
                                  
                                  <Input
                                    placeholder="Reps"
                                    value={exercise.reps}
                                    onChange={(e) => handleExerciseUpdate(week.id, day.id, block.id, exercise.id, 'reps', e.target.value)}
                                    className="rounded-none"
                                  />
                                  
                                  <Input
                                    placeholder="% 1RM"
                                    value={exercise.percentage_1rm || ''}
                                    onChange={(e) => handleExerciseUpdate(week.id, day.id, block.id, exercise.id, 'percentage_1rm', e.target.value)}
                                    className="rounded-none"
                                  />
                                  
                                  <Input
                                    placeholder="kg"
                                    value={exercise.kg}
                                    onChange={(e) => handleExerciseUpdate(week.id, day.id, block.id, exercise.id, 'kg', e.target.value)}
                                    className="rounded-none"
                                  />
                                  
                                  <Input
                                    placeholder="Tempo"
                                    value={exercise.tempo}
                                    onChange={(e) => handleExerciseUpdate(week.id, day.id, block.id, exercise.id, 'tempo', e.target.value)}
                                    className="rounded-none"
                                  />
                                  
                                  <Input
                                    placeholder="Rest"
                                    value={exercise.rest}
                                    onChange={(e) => handleExerciseUpdate(week.id, day.id, block.id, exercise.id, 'rest', e.target.value)}
                                    className="rounded-none"
                                  />
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
