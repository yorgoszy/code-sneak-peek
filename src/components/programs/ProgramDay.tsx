
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ProgramBlock } from './ProgramBlock';
import { Exercise, Day } from './types';

interface ProgramDayProps {
  day: Day;
  onDeleteDay: (dayId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  exercises: Exercise[];
}

export const ProgramDay: React.FC<ProgramDayProps> = ({
  day,
  onDeleteDay,
  onDeleteBlock,
  onDeleteExercise,
  exercises
}) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">{day.name}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteDay(day.id)}
            className="rounded-none"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {day.program_blocks?.map(block => (
            <ProgramBlock
              key={block.id}
              block={block}
              onDeleteBlock={onDeleteBlock}
              onDeleteExercise={onDeleteExercise}
              exercises={exercises}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
