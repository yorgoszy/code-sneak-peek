import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { BlockCard } from './BlockCard';
import { Exercise } from '../types';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter } from '@dnd-kit/core';

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
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onUpdateBlockName: (blockId: string, name: string) => void;
  onUpdateExercise: (blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (blockId: string, exerciseId: string) => void;
  onDuplicateExercise: (blockId: string, exerciseId: string) => void;
  onReorderBlocks: (oldIndex: number, newIndex: number) => void;
  onReorderExercises: (blockId: string, oldIndex: number, newIndex: number) => void;
}

const SortableBlock: React.FC<{
  block: Block;
  exercises: Exercise[];
  onAddExercise: (exerciseId: string) => void;
  onRemoveBlock: () => void;
  onDuplicateBlock: () => void;
  onUpdateBlockName: (name: string) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onReorderExercises: (oldIndex: number, newIndex: number) => void;
}> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BlockCard {...props} />
    </div>
  );
};

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
  onRemoveExercise,
  onDuplicateExercise,
  onReorderBlocks,
  onReorderExercises
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

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = day.blocks.findIndex(block => block.id === active.id);
      const newIndex = day.blocks.findIndex(block => block.id === over.id);
      onReorderBlocks(oldIndex, newIndex);
    }
  };

  const blocksCount = day.blocks.length;

  return (
    <Card className="rounded-none">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CollapsibleTrigger className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <CardTitle 
                className="text-sm cursor-pointer flex items-center gap-2"
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
                  <>
                    {day.name}
                    {!isOpen && blocksCount > 0 && (
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                        {blocksCount}
                      </span>
                    )}
                  </>
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
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={day.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {day.blocks.map((block) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      exercises={exercises}
                      onAddExercise={(exerciseId) => onAddExercise(block.id, exerciseId)}
                      onRemoveBlock={() => onRemoveBlock(block.id)}
                      onDuplicateBlock={() => onDuplicateBlock(block.id)}
                      onUpdateBlockName={(name) => onUpdateBlockName(block.id, name)}
                      onUpdateExercise={(exerciseId, field, value) => 
                        onUpdateExercise(block.id, exerciseId, field, value)
                      }
                      onRemoveExercise={(exerciseId) => onRemoveExercise(block.id, exerciseId)}
                      onDuplicateExercise={(exerciseId) => onDuplicateExercise(block.id, exerciseId)}
                      onReorderExercises={(oldIndex, newIndex) => onReorderExercises(block.id, oldIndex, newIndex)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
