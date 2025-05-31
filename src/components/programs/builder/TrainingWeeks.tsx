
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Copy, Trash2 } from "lucide-react";
import { WeekCard } from './WeekCard';
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
  onAddBlock: (weekId: string, dayId: string) => void;
  onRemoveBlock: (weekId: string, dayId: string, blockId: string) => void;
  onAddExercise: (weekId: string, dayId: string, blockId: string) => void;
  onRemoveExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onUpdateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
}

export const TrainingWeeks: React.FC<TrainingWeeksProps> = ({
  weeks,
  exercises,
  onAddWeek,
  onRemoveWeek,
  onDuplicateWeek,
  onUpdateWeekName,
  onAddDay,
  onRemoveDay,
  onAddBlock,
  onRemoveBlock,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise
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
            <TabsList className="grid w-full grid-cols-auto overflow-x-auto rounded-none">
              {weeks.map((week) => (
                <div key={week.id} className="flex items-center group">
                  <TabsTrigger 
                    value={week.id} 
                    className="rounded-none flex-1"
                    onDoubleClick={() => handleWeekNameDoubleClick(week)}
                  >
                    {editingWeekId === week.id ? (
                      <input
                        type="text"
                        value={editingWeekName}
                        onChange={(e) => setEditingWeekName(e.target.value)}
                        onBlur={handleWeekNameSave}
                        onKeyDown={handleWeekNameKeyPress}
                        className="bg-transparent border-none outline-none text-center"
                        autoFocus
                      />
                    ) : (
                      week.name
                    )}
                  </TabsTrigger>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDuplicateWeek(week.id)}
                      className="h-6 w-6 p-0 rounded-none"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveWeek(week.id)}
                      className="h-6 w-6 p-0 rounded-none text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </TabsList>
            
            {weeks.map((week) => (
              <TabsContent key={week.id} value={week.id} className="mt-4">
                <WeekCard
                  week={week}
                  exercises={exercises}
                  onAddDay={() => onAddDay(week.id)}
                  onRemoveWeek={() => onRemoveWeek(week.id)}
                  onAddBlock={(dayId) => onAddBlock(week.id, dayId)}
                  onRemoveDay={(dayId) => onRemoveDay(week.id, dayId)}
                  onAddExercise={(dayId, blockId) => onAddExercise(week.id, dayId, blockId)}
                  onRemoveBlock={(dayId, blockId) => onRemoveBlock(week.id, dayId, blockId)}
                  onUpdateExercise={(dayId, blockId, exerciseId, field, value) => 
                    onUpdateExercise(week.id, dayId, blockId, exerciseId, field, value)
                  }
                  onRemoveExercise={(dayId, blockId, exerciseId) => 
                    onRemoveExercise(week.id, dayId, blockId, exerciseId)
                  }
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
