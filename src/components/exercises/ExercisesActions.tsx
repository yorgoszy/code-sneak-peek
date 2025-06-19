
import React from 'react';
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  categories: { name: string; type: string }[];
}

interface ExercisesActionsProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exerciseId: string) => void;
}

export const ExercisesActions: React.FC<ExercisesActionsProps> = ({
  exercise,
  onEdit,
  onDelete
}) => {
  const handleDelete = () => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την άσκηση;')) {
      return;
    }
    onDelete(exercise.id);
  };

  return (
    <div className="flex justify-end space-x-2">
      <Button 
        variant="outline" 
        size="sm"
        className="rounded-none"
        onClick={() => onEdit(exercise)}
      >
        <Edit2 className="h-3 w-3" />
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        className="rounded-none text-red-600 hover:text-red-700"
        onClick={handleDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};
