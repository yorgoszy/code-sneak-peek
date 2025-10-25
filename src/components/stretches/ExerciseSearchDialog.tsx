import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Exercise {
  id: string;
  name: string;
}

interface ExerciseSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: Exercise[] | undefined;
  onSelect: (exerciseId: string, exerciseName: string) => void;
  title: string;
}

export const ExerciseSearchDialog: React.FC<ExerciseSearchDialogProps> = ({
  isOpen,
  onClose,
  exercises,
  onSelect,
  title
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExercises = exercises?.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise.id, exercise.name);
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Αναζήτηση άσκησης..."
              className="pl-10 rounded-none"
              autoFocus
            />
          </div>

          {/* Exercise List */}
          <ScrollArea className="h-[400px] border border-gray-200 rounded-none">
            <div className="p-2 space-y-1">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Δεν βρέθηκαν ασκήσεις
                </div>
              ) : (
                filteredExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    onClick={() => handleSelect(exercise)}
                    className="p-3 hover:bg-gray-100 cursor-pointer rounded-none border border-transparent hover:border-gray-200 transition-colors"
                  >
                    <span className="text-sm">{exercise.name}</span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Results Count */}
          <div className="text-xs text-gray-500 text-center">
            {filteredExercises.length} αποτελέσματα
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};