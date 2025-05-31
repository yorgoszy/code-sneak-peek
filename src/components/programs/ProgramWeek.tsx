
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ProgramDay } from './ProgramDay';
import { Exercise, Week } from './types';

interface ProgramWeekProps {
  week: Week;
  onDeleteWeek: (weekId: string) => void;
  onDeleteDay: (dayId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  exercises: Exercise[];
}

export const ProgramWeek: React.FC<ProgramWeekProps> = ({
  week,
  onDeleteWeek,
  onDeleteDay,
  onDeleteBlock,
  onDeleteExercise,
  exercises
}) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{week.name}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteWeek(week.id)}
            className="rounded-none"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {week.program_days?.map(day => (
            <ProgramDay
              key={day.id}
              day={day}
              onDeleteDay={onDeleteDay}
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
