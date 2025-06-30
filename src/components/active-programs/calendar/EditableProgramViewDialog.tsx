import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Dumbbell, CheckCircle, Info, Plus, Save, Edit } from "lucide-react";
import { ExerciseBlock } from "@/components/user-profile/daily-program/ExerciseBlock";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { DayProgramDialog } from './DayProgramDialog';
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface EditableProgramViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: EnrichedAssignment | null;
  onStartWorkout?: (weekIndex: number, dayIndex: number) => void;
  editMode?: boolean;
  onRefresh?: () => void;
}

export const EditableProgramViewDialog: React.FC<EditableProgramViewDialogProps> = ({
  isOpen,
  onClose,
  assignment,
  onStartWorkout,
  editMode = false,
  onRefresh
}) => {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [completions, setCompletions] = useState<any[]>([]);
  const [dayProgramOpen, setDayProgramOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState<any>(null);
  const [programData, setProgramData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { getWorkoutCompletions } = useWorkoutCompletions();

  useEffect(() => {
    if (isOpen && assignment?.id) {
      fetchCompletions();
      setProgramData(assignment.programs);
    }
  }, [isOpen, assignment?.id]);

  const fetchCompletions = async () => {
    if (!assignment?.id) return;
    try {
      const data = await getWorkoutCompletions(assignment.id);
      setCompletions(data);
    } catch (error) {
      console.error('Error fetching completions:', error);
    }
  };

  const saveChanges = async () => {
    if (!programData || !assignment) return;
    
    try {
      console.log('🔄 Αποθήκευση αλλαγών προγράμματος...');
      
      // Ενημέρωση του προγράμματος στη βάση δεδομένων
      const { error } = await supabase
        .from('programs')
        .update({
          name: programData.name,
          description: programData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', programData.id);

      if (error) throw error;

      // Ενημέρωση εβδομάδων, ημερών, blocks και ασκήσεων
      for (const week of programData.program_weeks || []) {
        await updateWeek(week);
      }

      toast.success('Οι αλλαγές αποθηκεύτηκαν επιτυχώς!');
      setIsEditing(false);
      if (onRefresh) onRefresh();
      
    } catch (error) {
      console.error('❌ Σφάλμα κατά την αποθήκευση:', error);
      toast.error('Σφάλμα κατά την αποθήκευση των αλλαγών');
    }
  };

  const updateWeek = async (week: any) => {
    // Ενημέρωση εβδομάδας
    await supabase
      .from('program_weeks')
      .update({
        name: week.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', week.id);

    // Ενημέρωση ημερών
    for (const day of week.program_days || []) {
      await updateDay(day);
    }
  };

  const updateDay = async (day: any) => {
    // Ενημέρωση ημέρας
    await supabase
      .from('program_days')
      .update({
        name: day.name,
        estimated_duration_minutes: day.estimated_duration_minutes,
        updated_at: new Date().toISOString()
      })
      .eq('id', day.id);

    // Ενημέρωση blocks
    for (const block of day.program_blocks || []) {
      await updateBlock(block);
    }
  };

  const updateBlock = async (block: any) => {
    // Ενημέρωση block
    await supabase
      .from('program_blocks')
      .update({
        name: block.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', block.id);

    // Ενημέρωση ασκήσεων
    for (const exercise of block.program_exercises || []) {
      await supabase
        .from('program_exercises')
        .update({
          sets: exercise.sets,
          reps: exercise.reps,
          kg: exercise.kg,
          percentage_1rm: exercise.percentage_1rm,
          tempo: exercise.tempo,
          rest: exercise.rest,
          notes: exercise.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', exercise.id);
    }
  };

  const addNewBlock = async (dayId: string) => {
    if (!editMode) return;
    
    try {
      const { data, error } = await supabase
        .from('program_blocks')
        .insert({
          day_id: dayId,
          name: 'Νέο Block',
          block_order: 1
        })
        .select()
        .single();

      if (error) throw error;

      // Ενημέρωση του local state
      const updatedProgram = { ...programData };
      const week = updatedProgram.program_weeks?.find((w: any) => 
        w.program_days?.some((d: any) => d.id === dayId)
      );
      const day = week?.program_days?.find((d: any) => d.id === dayId);
      
      if (day) {
        if (!day.program_blocks) day.program_blocks = [];
        day.program_blocks.push({
          ...data,
          program_exercises: []
        });
        setProgramData(updatedProgram);
      }

      toast.success('Νέο block προστέθηκε!');
      
    } catch (error) {
      console.error('❌ Σφάλμα κατά την προσθήκη block:', error);
      toast.error('Σφάλμα κατά την προσθήκη block');
    }
  };

  const isWorkoutCompleted = (weekNumber: number, dayNumber: number) => {
    if (!assignment?.training_dates) return false;
    
    const program = assignment.programs;
    if (!program?.program_weeks?.[0]?.program_days) return false;
    
    const daysPerWeek = program.program_weeks[0].program_days.length;
    const totalDayIndex = ((weekNumber - 1) * daysPerWeek) + (dayNumber - 1);
    
    if (totalDayIndex >= assignment.training_dates.length) return false;
    
    const dateStr = assignment.training_dates[totalDayIndex];
    
    return completions.some(c => 
      c.scheduled_date === dateStr && 
      c.status === 'completed'
    );
  };

  const isWeekCompleted = (weekNumber: number, totalDaysInWeek: number) => {
    let completedDays = 0;
    for (let dayNumber = 1; dayNumber <= totalDaysInWeek; dayNumber++) {
      if (isWorkoutCompleted(weekNumber, dayNumber)) {
        completedDays++;
      }
    }
    return completedDays === totalDaysInWeek;
  };

  const handleDayDoubleClick = (week: any, day: any, event: React.MouseEvent) => {
    if (editMode) return; // Στη λειτουργία επεξεργασίας δεν ανοίγει προπόνηση
    
    event.preventDefault();
    event.stopPropagation();
    
    if (isWorkoutCompleted(week.week_number, day.day_number)) {
      console.log('❌ Η προπόνηση έχει ήδη ολοκληρωθεί - δεν επιτρέπεται επανάληψη');
      return;
    }
    
    console.log('✅ Έναρξη προπόνησης:', week.name, day.name);
    
    setSelectedWeek(week);
    setSelectedDay(day);
    setDayProgramOpen(true);
  };

  const getDateForDay = (week: any, day: any) => {
    if (!assignment?.training_dates) return new Date();
    
    const program = assignment.programs;
    if (!program?.program_weeks?.[0]?.program_days) return new Date();
    
    const daysPerWeek = program.program_weeks[0].program_days.length;
    const totalDayIndex = ((week.week_number - 1) * daysPerWeek) + (day.day_number - 1);
    
    if (totalDayIndex < assignment.training_dates.length) {
      return new Date(assignment.training_dates[totalDayIndex]);
    }
    
    return new Date();
  };

  if (!assignment || !programData) return null;

  const weeks = programData.program_weeks || [];

  if (weeks.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle>{programData.name}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-gray-500">
            Δεν υπάρχουν εβδομάδες στο πρόγραμμα
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[80vh] rounded-none">
          {/* Fixed Header */}
          <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 z-10 p-6 rounded-t-none">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span>{programData.name}</span>
                  {!editMode && (
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-none px-3 py-1">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700 italic">
                        Κάνε διπλό κλικ στην ημέρα που θέλεις να προπονηθείς
                      </span>
                    </div>
                  )}
                  {editMode && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setIsEditing(!isEditing)}
                        variant={isEditing ? "destructive" : "outline"}
                        size="sm"
                        className="rounded-none"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {isEditing ? 'Άκυρο' : 'Επεξεργασία'}
                      </Button>
                      {isEditing && (
                        <Button
                          onClick={saveChanges}
                          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                          size="sm"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Αποθήκευση
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="rounded-none">
                  {assignment.status}
                </Badge>
              </DialogTitle>
              {programData.description && (
                <p className="text-sm text-gray-600">{programData.description}</p>
              )}
            </DialogHeader>
          </div>

          {/* Scrollable Content */}
          <div className="pt-20 pb-4 overflow-y-auto max-h-[calc(80vh-120px)]">
            <div className="space-y-4">
              {/* Εβδομάδες - Οριζόντια Layout */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
                {weeks.map((week: any, weekIndex: number) => {
                  const isCompleted = isWeekCompleted(week.week_number, week.program_days?.length || 0);
                  
                  return (
                    <div key={week.id} className="border border-gray-200 rounded-none">
                      <div className="bg-gray-50 p-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          {isCompleted && <CheckCircle className="w-5 h-5 text-[#00ffba]" />}
                          {week.name || `Εβδομάδα ${week.week_number}`}
                        </h3>
                      </div>
                      
                      <div className="p-3">
                        {/* Ημέρες Tabs για αυτή την εβδομάδα */}
                        <Tabs defaultValue="0" className="w-full">
                          <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${week.program_days?.length || 1}, 1fr)` }}>
                            {week.program_days?.map((day: any, dayIndex: number) => {
                              const isDayCompleted = isWorkoutCompleted(week.week_number, day.day_number);
                              
                              return (
                                <TabsTrigger 
                                  key={day.id} 
                                  value={dayIndex.toString()} 
                                  className="rounded-none text-xs flex items-center gap-1"
                                  onDoubleClick={(e) => handleDayDoubleClick(week, day, e)}
                                >
                                  {isDayCompleted && <CheckCircle className="w-3 h-3 text-[#00ffba]" />}
                                  {day.name || `Ημέρα ${day.day_number}`}
                                </TabsTrigger>
                              );
                            })}
                          </TabsList>

                          {week.program_days?.map((day: any, dayIndex: number) => (
                            <TabsContent key={day.id} value={dayIndex.toString()} className="mt-4">
                              <div className="bg-white border border-gray-200 rounded-none p-3">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                                      <Dumbbell className="h-4 w-4" />
                                      <span>{day.name || `Ημέρα ${day.day_number}`}</span>
                                      {isWorkoutCompleted(week.week_number, day.day_number) && (
                                        <CheckCircle className="w-4 h-4 text-[#00ffba]" />
                                      )}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {isWorkoutCompleted(week.week_number, day.day_number) 
                                        ? 'Προπόνηση ολοκληρωμένη' 
                                        : editMode 
                                          ? 'Λειτουργία επεξεργασίας'
                                          : 'Διπλό κλικ για έναρξη προπόνησης'
                                      }
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {day.estimated_duration_minutes && (
                                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                                        <Clock className="h-3 w-3" />
                                        <span>{day.estimated_duration_minutes} λεπτά</span>
                                      </div>
                                    )}
                                    {editMode && isEditing && (
                                      <Button
                                        onClick={() => addNewBlock(day.id)}
                                        size="sm"
                                        variant="outline"
                                        className="h-6 text-xs rounded-none"
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Block
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <ExerciseBlock 
                                    blocks={day.program_blocks} 
                                    viewOnly={!isEditing} 
                                    editMode={isEditing}
                                  />
                                </div>
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DayProgramDialog για έναρξη προπόνησης */}
      <DayProgramDialog
        isOpen={dayProgramOpen}
        onClose={() => setDayProgramOpen(false)}
        program={assignment}
        selectedDate={selectedDay && selectedWeek ? getDateForDay(selectedWeek, selectedDay) : null}
        workoutStatus="scheduled"
        onRefresh={() => {
          fetchCompletions();
        }}
      />
    </>
  );
};
