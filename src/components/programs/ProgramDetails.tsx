
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgramWeek } from './ProgramWeek';
import { NewWeekDialog } from './NewWeekDialog';
import { Program, User, Exercise, Week, Day, Block } from './types';
import { Edit } from 'lucide-react';

interface ProgramDetailsProps {
  selectedProgram: Program | null;
  users: User[];
  exercises: Exercise[];
  showNewWeek: boolean;
  setShowNewWeek: (show: boolean) => void;
  newWeek: { name: string; week_number: number };
  setNewWeek: (week: { name: string; week_number: number }) => void;
  onDeleteWeek: (weekId: string) => void;
  onDeleteDay: (dayId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onSetCurrentWeek: (week: Week) => void;
  onSetCurrentDay: (day: Day) => void;
  onSetCurrentBlock: (block: Block) => void;
  showNewDay: boolean;
  setShowNewDay: (show: boolean) => void;
  newDay: { name: string; day_number: number };
  setNewDay: (day: { name: string; day_number: number }) => void;
  showNewBlock: boolean;
  setShowNewBlock: (show: boolean) => void;
  newBlock: { name: string; block_order: number };
  setNewBlock: (block: { name: string; block_order: number }) => void;
  showNewExercise: boolean;
  setShowNewExercise: (show: boolean) => void;
  newExercise: any;
  setNewExercise: (exercise: any) => void;
  onEditProgram?: (program: Program) => void;
}

export const ProgramDetails: React.FC<ProgramDetailsProps> = ({
  selectedProgram,
  users,
  exercises,
  showNewWeek,
  setShowNewWeek,
  newWeek,
  setNewWeek,
  onDeleteWeek,
  onDeleteDay,
  onDeleteBlock,
  onDeleteExercise,
  onSetCurrentWeek,
  onSetCurrentDay,
  onSetCurrentBlock,
  showNewDay,
  setShowNewDay,
  newDay,
  setNewDay,
  showNewBlock,
  setShowNewBlock,
  newBlock,
  setNewBlock,
  showNewExercise,
  setShowNewExercise,
  newExercise,
  setNewExercise,
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
          <div className="flex gap-2">
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
            <NewWeekDialog
              open={showNewWeek}
              onOpenChange={setShowNewWeek}
              newWeek={newWeek}
              setNewWeek={setNewWeek}
              onCreateWeek={() => {}} // Keep empty since we're using builder now
            />
          </div>
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
              onSetCurrentWeek={onSetCurrentWeek}
              onSetCurrentDay={onSetCurrentDay}
              onSetCurrentBlock={onSetCurrentBlock}
              showNewDay={showNewDay}
              setShowNewDay={setShowNewDay}
              newDay={newDay}
              setNewDay={setNewDay}
              onCreateDay={() => {}} // Keep empty since we're using builder now
              showNewBlock={showNewBlock}
              setShowNewBlock={setShowNewBlock}
              newBlock={newBlock}
              setNewBlock={setNewBlock}
              onCreateBlock={() => {}} // Keep empty since we're using builder now
              showNewExercise={showNewExercise}
              setShowNewExercise={setShowNewExercise}
              newExercise={newExercise}
              setNewExercise={setNewExercise}
              onCreateExercise={() => {}} // Keep empty since we're using builder now
              exercises={exercises}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
