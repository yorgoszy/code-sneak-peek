
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Link } from "lucide-react";
import { ExerciseLinkDialog } from "@/components/tests/strength/ExerciseLinkDialog";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  categories: { name: string; type: string }[];
  coach_id?: string | null;
}

interface ExercisesActionsProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exerciseId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const ExercisesActions: React.FC<ExercisesActionsProps> = ({
  exercise,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true
}) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const handleDelete = () => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την άσκηση;')) {
      return;
    }
    onDelete(exercise.id);
  };

  return (
    <>
      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          className="rounded-none"
          onClick={() => setLinkDialogOpen(true)}
          title="Σύνδεση με άλλες ασκήσεις (για 1RM)"
        >
          <Link className="h-3 w-3" />
        </Button>
        {canEdit && (
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-none"
            onClick={() => onEdit(exercise)}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
        {canDelete && (
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-none text-red-600 hover:text-red-700"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <ExerciseLinkDialog
        isOpen={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        exerciseId={exercise.id}
        exerciseName={exercise.name}
        onLinksUpdated={() => {}}
      />
    </>
  );
};
