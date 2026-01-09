import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Play, RefreshCw } from "lucide-react";
import { Exercise } from '../types';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { useFmsExerciseStatusContext } from '@/contexts/FmsExerciseStatusContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RedExerciseAlternativesPopup } from './RedExerciseAlternativesPopup';

interface ExerciseSelectionButtonProps {
  selectedExercise: Exercise | undefined;
  exerciseNumber: number | null;
  allExercises?: Exercise[];
  onSelectExercise: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onReplaceExercise?: (newExerciseId: string) => void;
}

export const ExerciseSelectionButton: React.FC<ExerciseSelectionButtonProps> = ({
  selectedExercise,
  exerciseNumber,
  allExercises = [],
  onSelectExercise,
  onDuplicate,
  onRemove,
  onReplaceExercise
}) => {
  const [showAlternativesPopup, setShowAlternativesPopup] = useState(false);
  
  const videoUrl = selectedExercise?.video_url;
  const hasValidVideo = videoUrl && isValidVideoUrl(videoUrl);
  const thumbnailUrl = hasValidVideo ? getVideoThumbnail(videoUrl) : null;
  
  // Get FMS status for this exercise
  const { exerciseStatusMap } = useFmsExerciseStatusContext();
  const fmsStatus = selectedExercise ? exerciseStatusMap.get(selectedExercise.id) : null;
  
  // Determine background color based on FMS status
  const getBgColor = () => {
    if (fmsStatus === 'red') return 'bg-red-100 hover:bg-red-200 border-red-300';
    if (fmsStatus === 'yellow') return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300';
    return 'bg-gray-200 hover:bg-gray-300';
  };

  const handleReplaceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAlternativesPopup(true);
  };

  const handleAlternativeSelected = (alternativeId: string) => {
    setShowAlternativesPopup(false);
    if (onReplaceExercise) {
      onReplaceExercise(alternativeId);
    }
  };

  const buttonContent = (
    <Button
      variant="outline"
      size="sm"
      className={`flex-1 text-sm h-6 justify-start px-2 ${getBgColor()}`}
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
  );

  return (
    <div className="px-2 py-0 border-b bg-gray-100 flex items-center w-full" style={{ minHeight: '28px' }}>
      {/* Exercise button - takes remaining space with overflow hidden */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {buttonContent}
      </div>
      
      {/* Icons - fixed position on the right */}
      <div className="flex gap-1 flex-shrink-0 ml-1">
        {/* Replace button - only show for red exercises */}
        {fmsStatus === 'red' && (
          <RedExerciseAlternativesPopup
            open={showAlternativesPopup}
            onOpenChange={setShowAlternativesPopup}
            redExercise={selectedExercise || null}
            allExercises={allExercises}
            onSelectAlternative={handleAlternativeSelected}
            onUseAnyway={() => setShowAlternativesPopup(false)}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReplaceClick}
                    className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-100"
                    style={{ borderRadius: '0px' }}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-none">
                  <p>Αντικατάσταση άσκησης</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </RedExerciseAlternativesPopup>
        )}
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
