
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Video, Play } from "lucide-react";
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
      <div className="bg-white rounded-none shadow">
        <div className="p-8 text-center">
          <p className="text-gray-600">Φόρτωση ασκήσεων...</p>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="bg-white rounded-none shadow p-8 text-center text-gray-500">
        {searchQuery || activeFiltersCount > 0 ? 'Δεν βρέθηκαν ασκήσεις' : 'Δεν υπάρχουν ασκήσεις'}
      </div>
    );
  }

  return (
    <>
      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-2">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="bg-white border p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{exercise.name}</h3>
                {exercise.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{exercise.description}</p>
                )}
              </div>
              
              {/* Video thumbnail - compact for mobile */}
              {exercise.video_url && (
                <div 
                  className="flex-shrink-0 w-14 h-10 bg-gray-100 border flex items-center justify-center cursor-pointer relative overflow-hidden"
                  onClick={() => onVideoClick(exercise)}
                >
                  {getVideoThumbnail(exercise.video_url) ? (
                    <>
                      <img 
                        src={getVideoThumbnail(exercise.video_url)}
                        alt="Video"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="h-4 w-4 text-white fill-white" />
                      </div>
                    </>
                  ) : (
                    <Video className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>
            
            {/* Categories */}
            {exercise.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {exercise.categories.slice(0, 4).map((category, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {category.name}
                  </Badge>
                ))}
                {exercise.categories.length > 4 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    +{exercise.categories.length - 4}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-end pt-1 border-t">
              <ExercisesActions
                exercise={exercise}
                onEdit={onEditExercise}
                onDelete={onDeleteExercise}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-none shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Όνομα</TableHead>
              <TableHead className="text-xs">Περιγραφή</TableHead>
              <TableHead className="text-xs">Κατηγορίες</TableHead>
              <TableHead className="text-xs">Βίντεο</TableHead>
              <TableHead className="text-right text-xs">Ενέργειες</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.map((exercise) => (
              <TableRow key={exercise.id}>
                <TableCell className="font-medium text-sm py-2">{exercise.name}</TableCell>
                <TableCell className="py-2">
                  <div className="max-w-xs truncate text-sm" title={exercise.description || ''}>
                    {exercise.description || '-'}
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex flex-wrap gap-1">
                    {exercise.categories.map((category, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-[10px] px-1.5 py-0"
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  {exercise.video_url ? (
                    <div className="flex items-center">
                      {getVideoThumbnail(exercise.video_url) ? (
                        <img 
                          src={getVideoThumbnail(exercise.video_url)}
                          alt="Video thumbnail"
                          className="w-14 h-10 object-cover border cursor-pointer"
                          onClick={() => onVideoClick(exercise)}
                        />
                      ) : (
                        <div 
                          className="w-14 h-10 bg-gray-100 border flex items-center justify-center cursor-pointer"
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
                <TableCell className="text-right py-2">
                  <ExercisesActions
                    exercise={exercise}
                    onEdit={onEditExercise}
                    onDelete={onDeleteExercise}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
