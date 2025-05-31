
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgramWeek } from './ProgramWeek';
import { Program, User, Exercise, Week, Day, Block } from './types';
import { Edit } from 'lucide-react';

interface ProgramDetailsProps {
  selectedProgram: Program | null;
  users: User[];
  exercises: Exercise[];
  onDeleteWeek: (weekId: string) => void;
  onDeleteDay: (dayId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onEditProgram?: (program: Program) => void;
}

export const ProgramDetails: React.FC<ProgramDetailsProps> = ({
  selectedProgram,
  users,
  exercises,
  onDeleteWeek,
  onDeleteDay,
  onDeleteBlock,
  onDeleteExercise,
  onEditProgram
}) => {
  if (!selectedProgram) {
    return null;
  }

  const handleEditProgram = () => {
    if (onEditProgram && selectedProgram) {
      onEditProgram(selectedProgram);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{selectedProgram.name}</CardTitle>
          <Button
            onClick={handleEditProgram}
            variant="outline"
            size="sm"
            className="rounded-none"
            title="Επεξεργασία Προγράμματος"
          >
            <Edit className="w-4 h-4 mr-1" />
            Επεξεργασία
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {selectedProgram.program_weeks?.map(week => (
            <ProgramWeek
              key={week.id}
              week={week}
              onDeleteWeek={onDeleteWeek}
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
