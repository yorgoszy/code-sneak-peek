
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, FlaskConical, Trophy, Copy, ClipboardPaste } from "lucide-react";
import { ExerciseBlock } from "@/components/user-profile/daily-program/ExerciseBlock";
import { useProgramClipboard } from "@/contexts/ProgramClipboardContext";

interface EditableProgramDayTabProps {
  day: any;
  dayIndex: number;
  week: any;
  editMode: boolean;
  isEditing: boolean;
  isWorkoutCompleted: (weekNumber: number, dayNumber: number) => boolean;
  onAddNewBlock: (dayId: string, trainingType?: string) => void;
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onUpdateBlockTrainingType?: (blockId: string, trainingType: string) => void;
  onUpdateBlockFormat?: (blockId: string, format: string) => void;
  onUpdateBlockDuration?: (blockId: string, duration: string) => void;
  onUpdateBlockSets?: (blockId: string, sets: number) => void;
  onPasteBlock?: (dayId: string, block: any) => void;
  onPasteDay?: (dayId: string, day: any) => void;
  displayName?: string;
}

export const EditableProgramDayTab: React.FC<EditableProgramDayTabProps> = ({
  day,
  dayIndex,
  week,
  editMode,
  isEditing,
  isWorkoutCompleted,
  onAddNewBlock,
  onAddExercise,
  onRemoveBlock,
  onRemoveExercise,
  onUpdateExercise,
  onUpdateBlockTrainingType,
  onUpdateBlockFormat,
  onUpdateBlockDuration,
  onUpdateBlockSets,
  onPasteBlock,
  onPasteDay,
  displayName
}) => {
  const isTestDay = day.is_test_day === true;
  const isCompetitionDay = day.is_competition_day === true;
  const { copyDay, paste, hasDay, hasBlock, clearClipboard } = useProgramClipboard();

  const handleCopyDay = () => copyDay(day);
  const handlePaste = () => {
    const c = paste();
    if (!c) return;
    if (c.type === 'day' && onPasteDay) {
      onPasteDay(day.id, c.data);
      clearClipboard();
    } else if (c.type === 'block' && onPasteBlock) {
      onPasteBlock(day.id, c.data);
      clearClipboard();
    }
  };

  // Αν είναι ημέρα τεστ ή αγώνα, εμφάνιση μόνο του label
  if (isTestDay || isCompetitionDay) {
    return (
      <TabsContent key={day.id} value={dayIndex.toString()} className="mt-0 flex-1 overflow-y-auto">
        <div className="bg-white rounded-none p-4 flex items-center justify-center min-h-[100px]">
          {isTestDay && (
            <div className="flex items-center gap-2 bg-yellow-100 border-2 border-yellow-500 px-6 py-4">
              <FlaskConical className="w-6 h-6 text-yellow-600" />
              <span className="text-lg font-bold text-yellow-700">ΗΜΕΡΑ ΤΕΣΤ</span>
            </div>
          )}
          {isCompetitionDay && (
            <div className="flex items-center gap-2 bg-purple-100 border-2 border-purple-500 px-6 py-4">
              <Trophy className="w-6 h-6 text-purple-600" />
              <span className="text-lg font-bold text-purple-700">ΗΜΕΡΑ ΑΓΩΝΑ</span>
            </div>
          )}
        </div>
      </TabsContent>
    );
  }

  const canPaste = hasDay || hasBlock;
  const pasteTitle = hasDay
    ? "Επικόλληση ημέρας (αντικαθιστά)"
    : hasBlock
      ? "Επικόλληση block"
      : "Δεν υπάρχει αντιγραμμένο στοιχείο";

  return (
    <TabsContent key={day.id} value={dayIndex.toString()} className="mt-0 flex-1 overflow-y-auto">
      <div className="bg-white rounded-none p-1.5">
        {/* Action bar - μόνο σε edit mode */}
        {isEditing && (
          <div className="flex items-center justify-end gap-1 mb-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 rounded-none"
              title="Αντιγραφή ημέρας"
              onClick={handleCopyDay}
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 rounded-none disabled:opacity-30"
              title={pasteTitle}
              disabled={!canPaste}
              onClick={handlePaste}
            >
              <ClipboardPaste className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => onAddNewBlock(day.id)}
              size="sm"
              variant="outline"
              className="h-5 text-xs rounded-none py-0 px-2"
            >
              <Plus className="w-2 h-2 mr-1" />
              Block
            </Button>
          </div>
        )}

        <div className="space-y-1">
          {/* Χρήση του ίδιου ExerciseBlock UI για view και edit mode */}
          <ExerciseBlock 
            blocks={day.program_blocks} 
            viewOnly={true}
            editMode={isEditing}
            onAddExercise={isEditing ? onAddExercise : undefined}
            onRemoveBlock={isEditing ? onRemoveBlock : undefined}
            onRemoveExercise={isEditing ? onRemoveExercise : undefined}
            onUpdateExercise={isEditing ? onUpdateExercise : undefined}
            onUpdateBlockTrainingType={isEditing ? onUpdateBlockTrainingType : undefined}
            onUpdateBlockFormat={isEditing ? onUpdateBlockFormat : undefined}
            onUpdateBlockDuration={isEditing ? onUpdateBlockDuration : undefined}
            onUpdateBlockSets={isEditing ? onUpdateBlockSets : undefined}
          />
          
          {(day.program_blocks || []).length === 0 && isEditing && (
            <div className="text-center py-4 text-gray-500">
              <p className="mb-2 text-xs">Δεν υπάρχουν blocks σε αυτή την ημέρα</p>
              <Button
                onClick={() => onAddNewBlock(day.id)}
                variant="outline"
                size="sm"
                className="rounded-none h-6 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Προσθήκη Block
              </Button>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  );
};
