
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Play } from "lucide-react";

interface ExerciseCardProps {
  exercise: any;
  onEdit: (exercise: any) => void;
  onDelete: (exercise: any) => void;
  onVideoPlay?: (exercise: any) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onEdit,
  onDelete,
  onVideoPlay
}) => {
  const hasVideo = exercise.video_url && exercise.video_url.trim() !== '';

  return (
    <Card className="rounded-none hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Video Column */}
          <div className="col-span-2">
            {hasVideo ? (
              <div className="relative w-16 h-12 bg-gray-100 rounded-none overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onVideoPlay?.(exercise)}
                    className="p-1 h-auto rounded-none"
                  >
                    <Play className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-16 h-12 bg-gray-200 rounded-none flex items-center justify-center">
                <span className="text-xs text-gray-500">No Video</span>
              </div>
            )}
          </div>

          {/* Name Column */}
          <div className="col-span-3">
            <h3 className="font-medium text-gray-900 truncate">
              {exercise.name}
            </h3>
          </div>

          {/* Description Column */}
          <div className="col-span-3">
            <p className="text-sm text-gray-600 truncate">
              {exercise.description || 'Χωρίς περιγραφή'}
            </p>
          </div>

          {/* Categories Column */}
          <div className="col-span-2">
            {exercise.exercise_categories?.name && (
              <Badge variant="outline" className="text-xs rounded-none">
                {exercise.exercise_categories.name}
              </Badge>
            )}
          </div>

          {/* Actions Column */}
          <div className="col-span-2 flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(exercise)}
              className="p-2 h-8 w-8 rounded-none"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(exercise)}
              className="p-2 h-8 w-8 rounded-none text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
