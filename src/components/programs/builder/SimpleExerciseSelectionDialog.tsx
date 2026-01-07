
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Video } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { matchesSearchTerm } from "@/lib/utils";

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
}

interface SimpleExerciseSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: Exercise[];
  onSelectExercise: (exerciseId: string) => void;
}

export const SimpleExerciseSelectionDialog: React.FC<SimpleExerciseSelectionDialogProps> = ({
  open,
  onOpenChange,
  exercises,
  onSelectExercise
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExercises = useMemo(() => {
    if (!searchTerm.trim()) return exercises;
    return exercises.filter(exercise => matchesSearchTerm(exercise.name, searchTerm));
  }, [exercises, searchTerm]);

  const handleSelect = (exerciseId: string) => {
    onSelectExercise(exerciseId);
    onOpenChange(false);
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] rounded-none">
        <DialogHeader>
          <DialogTitle className="text-sm">Επιλογή Άσκησης</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Αναζήτηση άσκησης..."
              className="pl-8 rounded-none h-8 text-xs"
            />
          </div>

          {/* Exercise List */}
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-2 gap-2 pr-3">
              {filteredExercises.map(exercise => (
                <Button
                  key={exercise.id}
                  variant="outline"
                  className="h-auto py-2 px-3 rounded-none justify-start text-left"
                  onClick={() => handleSelect(exercise.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {exercise.video_url && (
                      <Video className="w-3 h-3 text-[#00ffba] flex-shrink-0" />
                    )}
                    <span className="text-xs truncate">{exercise.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>

          {filteredExercises.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              Δεν βρέθηκαν ασκήσεις
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
