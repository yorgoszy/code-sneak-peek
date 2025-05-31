
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Copy } from "lucide-react";
import { DayCardContent } from './DayCardContent';
import { DayCalculations } from './DayCalculations';
import { Exercise } from '../types';

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

interface Block {
  id: string;
  name: string;
  block_order: number;
  exercises: ProgramExercise[];
}

interface Day {
  id: string;
  name: string;
  day_number: number;
  blocks: Block[];
}

interface DayCardProps {
  day: Day;
  exercises: Exercise[];
  onUpdateDayName: (name: string) => void;
  onAddBlock: () => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onUpdateBlockName: (blockId: string, name: string) => void;
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveExercise: (blockId: string, exerciseId: string) => void;
  onUpdateExercise: (blockId: string, exerciseId: string, field: string, value: any) => void;
  onDuplicateExercise: (blockId: string, exerciseId: string) => void;
  onRemoveDay: () => void;
  onDuplicateDay: () => void;
  onReorderBlocks: (oldIndex: number, newIndex: number) => void;
  onReorderExercises: (blockId: string, oldIndex: number, newIndex: number) => void;
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  exercises,
  onUpdateDayName,
  onAddBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onDuplicateExercise,
  onRemoveDay,
  onDuplicateDay,
  onReorderBlocks,
  onReorderExercises
}) => {
  return (
    <div className="border bg-white" style={{ borderRadius: '0px' }}>
      {/* Day Header */}
      <div className="p-3 border-b bg-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-medium">Ημέρα {day.day_number}:</span>
          <Input
            value={day.name}
            onChange={(e) => onUpdateDayName(e.target.value)}
            className="flex-1 h-8"
            style={{ borderRadius: '0px', fontSize: '12px' }}
            placeholder="Όνομα ημέρας"
          />
        </div>
        <div className="flex gap-1 ml-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddBlock}
            className="h-8 px-2"
            style={{ borderRadius: '0px', fontSize: '11px' }}
          >
            <Plus className="w-3 h-3 mr-1" />
            Block
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDuplicateDay}
            className="h-8 px-2"
            style={{ borderRadius: '0px' }}
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemoveDay}
            className="h-8 px-2"
            style={{ borderRadius: '0px' }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Day Content */}
      <div className="p-3">
        <DayCardContent
          blocks={day.blocks}
          exercises={exercises}
          onRemoveBlock={onRemoveBlock}
          onDuplicateBlock={onDuplicateBlock}
          onUpdateBlockName={onUpdateBlockName}
          onAddExercise={onAddExercise}
          onRemoveExercise={onRemoveExercise}
          onUpdateExercise={onUpdateExercise}
          onDuplicateExercise={onDuplicateExercise}
          onReorderBlocks={onReorderBlocks}
          onReorderExercises={onReorderExercises}
        />
        
        {/* Day Calculations */}
        <DayCalculations blocks={day.blocks} />
      </div>
    </div>
  );
};
