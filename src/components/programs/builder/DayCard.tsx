
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { BlockCard } from './BlockCard';
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
  onAddBlock: () => void;
  onRemoveDay: () => void;
  onDuplicateDay: () => void;
  onUpdateDayName: (name: string) => void;
  onAddExercise: (blockId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onUpdateBlockName: (blockId: string, name: string) => void;
  onUpdateExercise: (blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (blockId: string, exerciseId: string) => void;
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  exercises,
  onAddBlock,
  onRemoveDay,
  onDuplicateDay,
  onUpdateDayName,
  onAddExercise,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateExercise,
  onRemoveExercise
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(day.name);

  const handleNameDoubleClick = () => {
    setIsEditing(true);
    setEditingName(day.name);
  };

  const handleNameSave = () => {
    if (editingName.trim()) {
      onUpdateDayName(editingName.trim());
    }
    setIsEditing(false);
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingName(day.name);
    }
  };

  return (
    <Card className="rounded-none">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CollapsibleTrigger className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <CardTitle 
                className="text-sm cursor-pointer"
                onDoubleClick={handleNameDoubleClick}
              >
                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={handleNameKeyPress}
                    className="bg-transparent border border-gray-300 rounded px-1 outline-none"
                    autoFocus
                  />
                ) : (
                  day.name
                )}
              </CardTitle>
            </CollapsibleTrigger>
            <div className="flex gap-1">
              <Button
                onClick={onAddBlock}
                size="sm"
                variant="ghost"
                className="rounded-none"
              >
                <Plus className="w-3 h-3" />
              </Button>
              <Button
                onClick={onDuplicateDay}
                size="sm"
                variant="ghost"
                className="rounded-none"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                onClick={onRemoveDay}
                size="sm"
                variant="ghost"
                className="rounded-none"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {day.blocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  exercises={exercises}
                  onAddExercise={() => onAddExercise(block.id)}
                  onRemoveBlock={() => onRemoveBlock(block.id)}
                  onDuplicateBlock={() => onDuplicateBlock(block.id)}
                  onUpdateBlockName={(name) => onUpdateBlockName(block.id, name)}
                  onUpdateExercise={(exerciseId, field, value) => 
                    onUpdateExercise(block.id, exerciseId, field, value)
                  }
                  onRemoveExercise={(exerciseId) => onRemoveExercise(block.id, exerciseId)}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
