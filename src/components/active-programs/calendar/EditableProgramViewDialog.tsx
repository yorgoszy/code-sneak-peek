
import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DayProgramDialog } from './DayProgramDialog';
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { EditableProgramDialogHeader } from './EditableProgramDialogHeader';
import { EditableProgramWeekCard } from './EditableProgramWeekCard';
import { useEditableProgramState } from './hooks/useEditableProgramState';
import { useEditableProgramActions } from './hooks/useEditableProgramActions';
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
  const {
    selectedWeekIndex,
    setSelectedWeekIndex,
    completions,
    dayProgramOpen,
    setDayProgramOpen,
    selectedDay,
    setSelectedDay,
    selectedWeek,
    setSelectedWeek,
    programData,
    setProgramData,
    originalProgramData,
    isEditing,
    setIsEditing,
    fetchCompletions,
    isWorkoutCompleted,
    isWeekCompleted,
    getDayRpe,
    resetToOriginal,
    updateOriginalData
  } = useEditableProgramState(isOpen, assignment);

  const { 
    saveChanges, 
    addNewBlock, 
    removeBlock, 
    addExercise, 
    removeExercise, 
    updateExercise,
    reorderDays 
  } = useEditableProgramActions(
    programData,
    assignment,
    onRefresh
  );

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

  const handleSaveChanges = async () => {
    await saveChanges();
    updateOriginalData(); // Ενημέρωση του backup μετά την επιτυχή αποθήκευση
    setIsEditing(false);
  };

  const handleCancelEditing = () => {
    resetToOriginal(); // Επαναφορά στα αρχικά δεδομένα
    setIsEditing(false);
  };

  const handleAddNewBlock = (dayId: string) => {
    if (!editMode) return;
    addNewBlock(dayId, setProgramData);
  };

  const handleRemoveBlock = (blockId: string) => {
    if (!editMode) return;
    removeBlock(blockId, setProgramData);
  };

  const handleAddExercise = (blockId: string, exerciseId: string) => {
    if (!editMode) return;
    addExercise(blockId, exerciseId, setProgramData);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    if (!editMode) return;
    removeExercise(exerciseId, setProgramData);
  };

  const handleUpdateExercise = (exerciseId: string, field: string, value: any) => {
    if (!editMode) return;
    updateExercise(exerciseId, field, value, setProgramData);
  };

  const handleReorderDays = (weekId: string, oldIndex: number, newIndex: number) => {
    if (!editMode || !isEditing) return;
    reorderDays(weekId, oldIndex, newIndex, setProgramData);
  };

  if (!assignment || !programData) return null;

  // Χρήση της πραγματικής δομής εβδομάδων του προγράμματος με σωστή σειρά
  const baseWeeks = programData.program_weeks || [];
  if (baseWeeks.length === 0) return null;

  // Ταξινόμηση εβδομάδων και ημερών βάσει order fields
  const weeks = [...baseWeeks]
    .sort((a: any, b: any) => (a.week_number || 0) - (b.week_number || 0))
    .map((week: any) => ({
      ...week,
      program_days: [...(week.program_days || [])]
        .sort((a: any, b: any) => (a.day_number || 0) - (b.day_number || 0))
    }));

  if (weeks.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto rounded-none">
          <EditableProgramDialogHeader
            programData={programData}
            assignment={assignment}
            editMode={editMode}
            isEditing={isEditing}
            onToggleEditing={() => setIsEditing(!isEditing)}
            onSaveChanges={handleSaveChanges}
            onCancelEditing={handleCancelEditing}
            onClose={onClose}
          />
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
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden rounded-none p-4">
          <EditableProgramDialogHeader
            programData={programData}
            assignment={assignment}
            editMode={editMode}
            isEditing={isEditing}
            onToggleEditing={() => setIsEditing(!isEditing)}
            onSaveChanges={handleSaveChanges}
            onCancelEditing={handleCancelEditing}
            onClose={onClose}
          />

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">
            {/* Εβδομάδες - Οριζόντια Layout */}
            <div className="grid gap-4" style={{ 
              gridTemplateColumns: editMode && isEditing 
                ? `repeat(${weeks.length}, 35%)` 
                : `repeat(${weeks.length}, 1fr)` 
            }}>
                {weeks.map((week: any, weekIndex: number) => (
                  <EditableProgramWeekCard
                    key={week.id}
                    week={week}
                    weekIndex={weekIndex}
                    editMode={editMode}
                    isEditing={isEditing}
                    isWeekCompleted={isWeekCompleted}
                    isWorkoutCompleted={isWorkoutCompleted}
                    getDayRpe={getDayRpe}
                    onDayDoubleClick={handleDayDoubleClick}
                    onAddNewBlock={handleAddNewBlock}
                    onAddExercise={handleAddExercise}
                    onRemoveBlock={handleRemoveBlock}
                    onRemoveExercise={handleRemoveExercise}
                    onUpdateExercise={handleUpdateExercise}
                    onReorderDays={handleReorderDays}
                    getDayLabel={(w, d) => {
                      const date = getDateForDay(w, d);
                      try {
                        return format(date, 'EEEE', { locale: el });
                      } catch {
                        return d.name || `Ημέρα ${d.day_number}`;
                      }
                    }}
                  />
                ))}
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
