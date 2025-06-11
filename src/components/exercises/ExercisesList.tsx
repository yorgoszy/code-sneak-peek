
import React, { useState } from 'react';
import { ExerciseCard } from './ExerciseCard';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ExercisesListProps {
  exercises: any[];
  onEdit: (exercise: any) => void;
  onDelete: (exercise: any) => void;
  onVideoPlay?: (exercise: any) => void;
}

export const ExercisesList: React.FC<ExercisesListProps> = ({
  exercises,
  onEdit,
  onDelete,
  onVideoPlay
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const totalPages = Math.ceil(exercises.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExercises = exercises.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 border-b border-gray-200">
        <div className="col-span-2 text-sm font-medium text-gray-700">Βίντεο</div>
        <div className="col-span-3 text-sm font-medium text-gray-700">Όνομα</div>
        <div className="col-span-3 text-sm font-medium text-gray-700">Περιγραφή</div>
        <div className="col-span-2 text-sm font-medium text-gray-700">Κατηγορίες</div>
        <div className="col-span-2 text-sm font-medium text-gray-700 text-right">Ενέργειες</div>
      </div>

      {/* Exercises List */}
      <div className="space-y-2">
        {currentExercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onEdit={onEdit}
            onDelete={onDelete}
            onVideoPlay={onVideoPlay}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-gray-600">
            Σελίδα {currentPage} από {totalPages} ({exercises.length} συνολικά ασκήσεις)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="rounded-none"
            >
              <ChevronLeft className="w-4 h-4" />
              Προηγούμενη
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="rounded-none"
            >
              Επόμενη
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
