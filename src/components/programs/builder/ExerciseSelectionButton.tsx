
import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Play } from "lucide-react";
import { Exercise } from '../types';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';

interface ExerciseSelectionButtonProps {
  selectedExercise: Exercise | undefined;
  exerciseNumber: number | null;
  onSelectExercise: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export const ExerciseSelectionButton: React.FC<ExerciseSelectionButtonProps> = ({
  selectedExercise,
  exerciseNumber,
  onSelectExercise,
  onDuplicate,
  onRemove
}) => {
  const videoUrl = selectedExercise?.video_url;
  const hasValidVideo = videoUrl && isValidVideoUrl(videoUrl);
  const thumbnailUrl = hasValidVideo ? getVideoThumbnail(videoUrl) : null;

  return (
    <div className="px-2 py-0 border-b bg-gray-100 flex items-center gap-2 w-full" style={{ minHeight: '28px' }}>
      <Button
        variant="outline"
        size="sm"
        className="flex-1 text-sm h-6 justify-start px-2 bg-gray-200 hover:bg-gray-300"
        style={{ borderRadius: '0px', fontSize: '12px' }}
        onClick={onSelectExercise}
      >
        {selectedExercise ? (
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-1 flex-1">
              {exerciseNumber && (
                <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded-sm">
                  {exerciseNumber}
                </span>
              )}
              <span className="truncate">{selectedExercise.name}</span>
            </div>
            
            {/* Video Thumbnail */}
            {hasValidVideo && thumbnailUrl ? (
              <div className="w-8 h-5 rounded-none overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={thumbnailUrl}
                  alt={`${selectedExercise.name} video thumbnail`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full bg-gray-200 flex items-center justify-center">
                  <Play className="w-2 h-2 text-gray-400" />
                </div>
              </div>
            ) : hasValidVideo ? (
              <div className="w-8 h-5 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Play className="w-2 h-2 text-gray-400" />
              </div>
            ) : (
              <div className="w-8 h-5 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-gray-400">-</span>
              </div>
            )}
          </div>
        ) : 'Επιλογή...'}
      </Button>
      
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDuplicate}
          className="p-1 h-6 w-6"
          style={{ borderRadius: '0px' }}
        >
          <Copy className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="p-1 h-6 w-6"
          style={{ borderRadius: '0px' }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
