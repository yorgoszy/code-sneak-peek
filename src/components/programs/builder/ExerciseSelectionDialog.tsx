
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Exercise } from '../types';
import { Search, Play } from "lucide-react";

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
      <DialogContent className="rounded-none max-w-4xl max-h-[80vh]">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                {filteredExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="border rounded p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSelectExercise(exercise.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{exercise.name}</h4>
                        {exercise.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {exercise.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle video play - you can implement this later
                          }}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Άσκηση
                      </span>
                      {/* Add more badges based on exercise properties when available */}
                    </div>
                  </div>
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
