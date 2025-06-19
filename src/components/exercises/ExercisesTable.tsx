
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Video } from "lucide-react";
import { getVideoThumbnail } from "@/utils/videoUtils";
import { ExercisesActions } from './ExercisesActions';

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  categories: { name: string; type: string }[];
}

interface ExercisesTableProps {
  exercises: Exercise[];
  loadingExercises: boolean;
  searchQuery: string;
  activeFiltersCount: number;
  onEditExercise: (exercise: Exercise) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onVideoClick: (exercise: Exercise) => void;
}

export const ExercisesTable: React.FC<ExercisesTableProps> = ({
  exercises,
  loadingExercises,
  searchQuery,
  activeFiltersCount,
  onEditExercise,
  onDeleteExercise,
  onVideoClick
}) => {
  if (loadingExercises) {
    return (
      <div className="bg-white rounded shadow">
        <div className="p-8 text-center">
          <p className="text-gray-600">Φόρτωση ασκήσεων...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Όνομα</TableHead>
            <TableHead>Περιγραφή</TableHead>
            <TableHead>Κατηγορίες</TableHead>
            <TableHead>Βίντεο</TableHead>
            <TableHead className="text-right">Ενέργειες</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exercises.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                {searchQuery || activeFiltersCount > 0 ? 'Δεν βρέθηκαν ασκήσεις' : 'Δεν υπάρχουν ασκήσεις'}
              </TableCell>
            </TableRow>
          ) : (
            exercises.map((exercise) => (
              <TableRow key={exercise.id}>
                <TableCell className="font-medium">{exercise.name}</TableCell>
                <TableCell>
                  <div className="max-w-xs truncate" title={exercise.description || ''}>
                    {exercise.description || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {exercise.categories.map((category, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {exercise.video_url ? (
                    <div className="flex items-center space-x-2">
                      {getVideoThumbnail(exercise.video_url) ? (
                        <img 
                          src={getVideoThumbnail(exercise.video_url)}
                          alt="Video thumbnail"
                          className="w-16 h-12 object-cover border cursor-pointer"
                          onClick={() => onVideoClick(exercise)}
                        />
                      ) : (
                        <div 
                          className="w-16 h-12 bg-gray-100 border flex items-center justify-center cursor-pointer"
                          onClick={() => onVideoClick(exercise)}
                        >
                          <Video className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <ExercisesActions
                    exercise={exercise}
                    onEdit={onEditExercise}
                    onDelete={onDeleteExercise}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
