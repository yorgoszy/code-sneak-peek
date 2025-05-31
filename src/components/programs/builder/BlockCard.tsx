import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { ExerciseRow } from './ExerciseRow';
import { ExerciseSelectionDialog } from './ExerciseSelectionDialog';
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

interface BlockCardProps {
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
}

const SortableExercise: React.FC<{
  exercise: ProgramExercise;
  exercises: Exercise[];
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ExerciseRow {...props} />
    </div>
  );
};

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  exercises,
  onAddExercise,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderExercises
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(block.name);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);

  const handleNameDoubleClick = () => {
    setIsEditing(true);
    setEditingName(block.name);
  };

  const handleNameSave = () => {
    if (editingName.trim()) {
      onUpdateBlockName(editingName.trim());
    }
    setIsEditing(false);
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingName(block.name);
    }
  };

  const handleAddExerciseClick = () => {
    setShowExerciseDialog(true);
  };

  const handleExerciseSelect = (exerciseId: string) => {
    onAddExercise(exerciseId);
    setShowExerciseDialog(false);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = block.exercises.findIndex(exercise => exercise.id === active.id);
      const newIndex = block.exercises.findIndex(exercise => exercise.id === over.id);
      onReorderExercises(oldIndex, newIndex);
    }
  };

  const exercisesCount = block.exercises.length;

  return (
    <>
      <Card className="rounded-none bg-gray-50">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CollapsibleTrigger className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded">
                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <h6 
                  className="text-xs font-medium cursor-pointer flex items-center gap-2"
                  onDoubleClick={handleNameDoubleClick}
                >
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={handleNameSave}
                      onKeyDown={handleNameKeyPress}
                      className="bg-transparent border border-gray-300 rounded px-1 outline-none text-xs"
                      autoFocus
                    />
                  ) : (
                    <>
                      {block.name}
                      {!isOpen && exercisesCount > 0 && (
                        <span className="text-xs bg-gray-300 px-2 py-1 rounded-full">
                          {exercisesCount}
                        </span>
                      )}
                    </>
                  )}
                </h6>
              </CollapsibleTrigger>
              <div className="flex gap-1">
                <Button
                  onClick={handleAddExerciseClick}
                  size="sm"
                  variant="ghost"
                  className="rounded-none"
                >
                  <Plus className="w-2 h-2" />
                </Button>
                <Button
                  onClick={onDuplicateBlock}
                  size="sm"
                  variant="ghost"
                  className="rounded-none"
                >
                  <Copy className="w-2 h-2" />
                </Button>
                <Button
                  onClick={onRemoveBlock}
                  size="sm"
                  variant="ghost"
                  className="rounded-none"
                >
                  <Trash2 className="w-2 h-2" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-2">
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={block.exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {block.exercises.map((exercise) => (
                      <SortableExercise
                        key={exercise.id}
                        exercise={exercise}
                        exercises={exercises}
                        onUpdate={(field, value) => onUpdateExercise(exercise.id, field, value)}
                        onRemove={() => onRemoveExercise(exercise.id)}
                        onDuplicate={() => onDuplicateExercise(exercise.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <ExerciseSelectionDialog
        open={showExerciseDialog}
        onOpenChange={setShowExerciseDialog}
        exercises={exercises}
        onSelectExercise={handleExerciseSelect}
      />
    </>
  );
};
