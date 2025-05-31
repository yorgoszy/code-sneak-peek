
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Copy, Trash2, GripVertical } from "lucide-react";
import { WeekCard } from './WeekCard';
import { Exercise } from '../types';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface Week {
  id: string;
  name: string;
  week_number: number;
  days: Day[];
}

interface TrainingWeeksProps {
  weeks: Week[];
  exercises: Exercise[];
  onAddWeek: () => void;
  onRemoveWeek: (weekId: string) => void;
  onDuplicateWeek: (weekId: string) => void;
  onUpdateWeekName: (weekId: string, name: string) => void;
  onAddDay: (weekId: string) => void;
  onRemoveDay: (weekId: string, dayId: string) => void;
  onDuplicateDay: (weekId: string, dayId: string) => void;
  onUpdateDayName: (weekId: string, dayId: string, name: string) => void;
  onAddBlock: (weekId: string, dayId: string) => void;
  onRemoveBlock: (weekId: string, dayId: string, blockId: string) => void;
  onDuplicateBlock: (weekId: string, dayId: string, blockId: string) => void;
  onUpdateBlockName: (weekId: string, dayId: string, blockId: string, name: string) => void;
  onAddExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onRemoveExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onUpdateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onDuplicateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onReorderWeeks: (oldIndex: number, newIndex: number) => void;
  onReorderDays: (weekId: string, oldIndex: number, newIndex: number) => void;
  onReorderBlocks: (weekId: string, dayId: string, oldIndex: number, newIndex: number) => void;
  onReorderExercises: (weekId: string, dayId: string, blockId: string, oldIndex: number, newIndex: number) => void;
}

const SortableWeekTab: React.FC<{
  week: Week;
  isActive: boolean;
  editingWeekId: string | null;
  editingWeekName: string;
  onWeekNameDoubleClick: (week: Week) => void;
  onWeekNameSave: () => void;
  onWeekNameKeyPress: (e: React.KeyboardEvent) => void;
  setEditingWeekName: (name: string) => void;
  onDuplicateWeek: (weekId: string) => void;
  onRemoveWeek: (weekId: string) => void;
}> = ({
  week,
  isActive,
  editingWeekId,
  editingWeekName,
  onWeekNameDoubleClick,
  onWeekNameSave,
  onWeekNameKeyPress,
  setEditingWeekName,
  onDuplicateWeek,
  onRemoveWeek
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: week.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center group flex-shrink-0 relative"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-move z-10"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3 h-3 text-gray-400" />
      </div>
      
      <div className="ml-4 flex items-center">
        <TabsTrigger 
          value={week.id} 
          className="rounded-none whitespace-nowrap px-4"
          onDoubleClick={() => onWeekNameDoubleClick(week)}
        >
          {editingWeekId === week.id ? (
            <input
              type="text"
              value={editingWeekName}
              onChange={(e) => setEditingWeekName(e.target.value)}
              onBlur={onWeekNameSave}
              onKeyDown={onWeekNameKeyPress}
              className="bg-transparent border-none outline-none text-center min-w-0"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            week.name
          )}
        </TabsTrigger>
        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateWeek(week.id);
            }}
            className="h-6 w-6 p-0 rounded-none"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveWeek(week.id);
            }}
            className="h-6 w-6 p-0 rounded-none text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const TrainingWeeks: React.FC<TrainingWeeksProps> = ({
  weeks,
  exercises,
  onAddWeek,
  onRemoveWeek,
  onDuplicateWeek,
  onUpdateWeekName,
  onAddDay,
  onRemoveDay,
  onDuplicateDay,
  onUpdateDayName,
  onAddBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onDuplicateExercise,
  onReorderWeeks,
  onReorderDays,
  onReorderBlocks,
  onReorderExercises
}) => {
  const [activeWeek, setActiveWeek] = useState(weeks[0]?.id || '');
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null);
  const [editingWeekName, setEditingWeekName] = useState('');

  const handleWeekNameDoubleClick = (week: Week) => {
    setEditingWeekId(week.id);
    setEditingWeekName(week.name);
  };

  const handleWeekNameSave = () => {
    if (editingWeekId && editingWeekName.trim()) {
      onUpdateWeekName(editingWeekId, editingWeekName.trim());
    }
    setEditingWeekId(null);
    setEditingWeekName('');
  };

  const handleWeekNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleWeekNameSave();
    } else if (e.key === 'Escape') {
      setEditingWeekId(null);
      setEditingWeekName('');
    }
  };

  React.useEffect(() => {
    if (weeks.length > 0 && !activeWeek) {
      setActiveWeek(weeks[0].id);
    }
  }, [weeks, activeWeek]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = weeks.findIndex(week => week.id === active.id);
      const newIndex = weeks.findIndex(week => week.id === over.id);
      onReorderWeeks(oldIndex, newIndex);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Εβδομάδες Προπόνησης</CardTitle>
          <Button onClick={onAddWeek} className="rounded-none">
            <Plus className="w-4 h-4 mr-2" />
            +Week
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {weeks.length > 0 ? (
          <Tabs value={activeWeek} onValueChange={setActiveWeek} className="w-full">
            <div className="w-full overflow-x-auto">
              <TabsList className="inline-flex h-10 items-center justify-start rounded-none bg-muted p-1 text-muted-foreground min-w-full">
                <SortableContext items={weeks.map(w => w.id)} strategy={horizontalListSortingStrategy}>
                  {weeks.map((week) => (
                    <SortableWeekTab
                      key={week.id}
                      week={week}
                      isActive={activeWeek === week.id}
                      editingWeekId={editingWeekId}
                      editingWeekName={editingWeekName}
                      onWeekNameDoubleClick={handleWeekNameDoubleClick}
                      onWeekNameSave={handleWeekNameSave}
                      onWeekNameKeyPress={handleWeekNameKeyPress}
                      setEditingWeekName={setEditingWeekName}
                      onDuplicateWeek={onDuplicateWeek}
                      onRemoveWeek={onRemoveWeek}
                    />
                  ))}
                </SortableContext>
              </TabsList>
            </div>
            
            {weeks.map((week) => (
              <TabsContent key={week.id} value={week.id} className="mt-4">
                <WeekCard
                  week={week}
                  exercises={exercises}
                  onAddDay={() => onAddDay(week.id)}
                  onRemoveWeek={() => onRemoveWeek(week.id)}
                  onAddBlock={(dayId) => onAddBlock(week.id, dayId)}
                  onRemoveDay={(dayId) => onRemoveDay(week.id, dayId)}
                  onDuplicateDay={(dayId) => onDuplicateDay(week.id, dayId)}
                  onUpdateDayName={(dayId, name) => onUpdateDayName(week.id, dayId, name)}
                  onAddExercise={(dayId, blockId, exerciseId) => onAddExercise(week.id, dayId, blockId, exerciseId)}
                  onRemoveBlock={(dayId, blockId) => onRemoveBlock(week.id, dayId, blockId)}
                  onDuplicateBlock={(dayId, blockId) => onDuplicateBlock(week.id, dayId, blockId)}
                  onUpdateBlockName={(dayId, blockId, name) => onUpdateBlockName(week.id, dayId, blockId, name)}
                  onUpdateExercise={(dayId, blockId, exerciseId, field, value) => 
                    onUpdateExercise(week.id, dayId, blockId, exerciseId, field, value)
                  }
                  onRemoveExercise={(dayId, blockId, exerciseId) => 
                    onRemoveExercise(week.id, dayId, blockId, exerciseId)
                  }
                  onDuplicateExercise={(dayId, blockId, exerciseId) => 
                    onDuplicateExercise(week.id, dayId, blockId, exerciseId)
                  }
                  onReorderDays={(oldIndex, newIndex) => onReorderDays(week.id, oldIndex, newIndex)}
                  onReorderBlocks={(dayId, oldIndex, newIndex) => onReorderBlocks(week.id, dayId, oldIndex, newIndex)}
                  onReorderExercises={(dayId, blockId, oldIndex, newIndex) => onReorderExercises(week.id, dayId, blockId, oldIndex, newIndex)}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Προσθέστε μια εβδομάδα για να ξεκινήσετε
          </div>
        )}
      </CardContent>
    </Card>
  );
};
