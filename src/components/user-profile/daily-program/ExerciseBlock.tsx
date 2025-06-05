
import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, Zap, Play } from "lucide-react";
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import type { ProgramBlock } from './types';

interface ExerciseBlockProps {
  blocks: ProgramBlock[];
  viewOnly?: boolean;
  showVideoThumbnails?: boolean;
}

export const ExerciseBlock: React.FC<ExerciseBlockProps> = ({ 
  blocks, 
  viewOnly = false,
  showVideoThumbnails = false 
}) => {
  return (
    <div className="space-y-4">
      {blocks?.map((block) => (
        <Card key={block.id} className="rounded-none">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{block.name}</h3>
              {block.rest_between_exercises && (
                <Badge variant="outline" className="rounded-none text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {block.rest_between_exercises}s διάλειμμα
                </Badge>
              )}
            </div>
            
            <div className="space-y-3">
              {block.program_exercises?.map((exercise) => (
                <div key={exercise.id} className="border border-gray-200 rounded-none p-3">
                  <div className="flex items-start gap-3">
                    {/* Video Thumbnail */}
                    {showVideoThumbnails && exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url) && (
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-12 bg-gray-100 border border-gray-200 rounded-none overflow-hidden">
                          <img
                            src={getVideoThumbnail(exercise.exercises.video_url) || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=64&h=48&fit=crop&crop=center'}
                            alt={exercise.exercises?.name || 'Video thumbnail'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to placeholder image
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=64&h=48&fit=crop&crop=center';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {exercise.exercises?.name || 'Άσκηση'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          {exercise.order && (
                            <span>#{exercise.order}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {exercise.sets && (
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>{exercise.sets} sets</span>
                          </div>
                        )}
                        {exercise.reps && (
                          <div className="flex items-center gap-1">
                            <span>{exercise.reps} reps</span>
                          </div>
                        )}
                        {exercise.kg && (
                          <div className="flex items-center gap-1">
                            <span>{exercise.kg} kg</span>
                          </div>
                        )}
                        {exercise.rest_seconds && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{exercise.rest_seconds}s</span>
                          </div>
                        )}
                        {exercise.tempo && (
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            <span>{exercise.tempo}</span>
                          </div>
                        )}
                        {exercise.velocity && (
                          <div className="flex items-center gap-1">
                            <span>{exercise.velocity} m/s</span>
                          </div>
                        )}
                      </div>
                      
                      {exercise.notes && (
                        <p className="text-xs text-gray-600 mt-2">{exercise.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
