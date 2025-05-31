
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Exercise } from '../types';
import { Search } from "lucide-react";

interface ExerciseSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: Exercise[];
  onSelectExercise: (exerciseId: string) => void;
}

export const ExerciseSelectionDialog: React.FC<ExerciseSelectionDialogProps> = ({
  open,
  onOpenChange,
  exercises,
  onSelectExercise
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExercises = useMemo(() => {
    if (!searchTerm) return exercises;
    return exercises.filter(exercise => 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [exercises, searchTerm]);

  const handleSelectExercise = (exerciseId: string) => {
    onSelectExercise(exerciseId);
    onOpenChange(false);
    setSearchTerm('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-none max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Επιλογή Άσκησης</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Αναζήτηση άσκησης..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-none"
            />
          </div>
          
          <div className="max-h-96 overflow-y-auto border rounded">
            {filteredExercises.length > 0 ? (
              <div className="space-y-1 p-2">
                {filteredExercises.map((exercise) => (
                  <Button
                    key={exercise.id}
                    variant="ghost"
                    className="w-full justify-start rounded-none text-left h-auto py-3 px-3"
                    onClick={() => handleSelectExercise(exercise.id)}
                  >
                    <div>
                      <div className="font-medium">{exercise.name}</div>
                      {exercise.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {exercise.description}
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Δεν βρέθηκαν ασκήσεις
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
