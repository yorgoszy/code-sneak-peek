
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
}

interface NewExerciseState {
  exercise_id: string;
  sets: number;
  reps: string;
  kg: string;
  percentage_1rm: number;
  tempo: string;
  rest: string;
  notes: string;
  exercise_order: number;
}

interface NewExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newExercise: NewExerciseState;
  setNewExercise: (exercise: NewExerciseState) => void;
  exercises: Exercise[];
  onCreateExercise: () => void;
  onSetCurrentBlock: () => void;
}

export const NewExerciseDialog: React.FC<NewExerciseDialogProps> = ({
  open,
  onOpenChange,
  newExercise,
  setNewExercise,
  exercises,
  onCreateExercise,
  onSetCurrentBlock
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          onClick={onSetCurrentBlock}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none max-w-2xl">
        <DialogHeader>
          <DialogTitle>Προσθήκη Άσκησης</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Άσκηση</Label>
            <Select value={newExercise.exercise_id} onValueChange={(value) => setNewExercise({...newExercise, exercise_id: value})}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε άσκηση" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map(exercise => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sets</Label>
            <Input
              className="rounded-none"
              type="number"
              value={newExercise.sets}
              onChange={(e) => setNewExercise({...newExercise, sets: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <Label>Reps</Label>
            <Input
              className="rounded-none"
              value={newExercise.reps}
              onChange={(e) => setNewExercise({...newExercise, reps: e.target.value})}
              placeholder="π.χ. 8-10, 12, AMRAP"
            />
          </div>
          <div>
            <Label>%1RM</Label>
            <Input
              className="rounded-none"
              type="number"
              value={newExercise.percentage_1rm}
              onChange={(e) => setNewExercise({...newExercise, percentage_1rm: parseInt(e.target.value)})}
              placeholder="π.χ. 80"
            />
          </div>
          <div>
            <Label>Kg</Label>
            <Input
              className="rounded-none"
              value={newExercise.kg}
              onChange={(e) => setNewExercise({...newExercise, kg: e.target.value})}
              placeholder="Αυτόματα από %1RM"
            />
          </div>
          <div>
            <Label>Tempo</Label>
            <Input
              className="rounded-none"
              value={newExercise.tempo}
              onChange={(e) => setNewExercise({...newExercise, tempo: e.target.value})}
              placeholder="π.χ. 3-1-1-0"
            />
          </div>
          <div>
            <Label>Rest</Label>
            <Input
              className="rounded-none"
              value={newExercise.rest}
              onChange={(e) => setNewExercise({...newExercise, rest: e.target.value})}
              placeholder="π.χ. 2-3 λεπτά"
            />
          </div>
          <div>
            <Label>Σειρά</Label>
            <Input
              className="rounded-none"
              type="number"
              value={newExercise.exercise_order}
              onChange={(e) => setNewExercise({...newExercise, exercise_order: parseInt(e.target.value)})}
            />
          </div>
          <div className="col-span-2">
            <Label>Σημειώσεις</Label>
            <Textarea
              className="rounded-none"
              value={newExercise.notes}
              onChange={(e) => setNewExercise({...newExercise, notes: e.target.value})}
              placeholder="Επιπλέον οδηγίες..."
            />
          </div>
          <div className="col-span-2">
            <Button className="rounded-none w-full" onClick={onCreateExercise}>
              Προσθήκη Άσκησης
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
