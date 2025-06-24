
import React from 'react';
import { Play } from 'lucide-react';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';

interface ExerciseLinkProps {
  exerciseName: string;
  videoUrl?: string;
  onClick: () => void;
}

export const ExerciseLink: React.FC<ExerciseLinkProps> = ({
  exerciseName,
  videoUrl,
  onClick
}) => {
  const hasValidVideo = videoUrl && isValidVideoUrl(videoUrl);
  const thumbnailUrl = hasValidVideo ? getVideoThumbnail(videoUrl) : null;

  return (
    <div 
      className="inline-flex items-center gap-2 bg-[#00ffba] text-black px-2 py-1 rounded-none cursor-pointer hover:bg-[#00ffba]/80 transition-colors my-1 mr-2"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="w-6 h-4 rounded-none overflow-hidden bg-gray-200 flex-shrink-0">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${exerciseName} thumbnail`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.classList.remove('hidden');
              }
            }}
          />
        ) : null}
        <div className={`w-full h-full bg-gray-300 flex items-center justify-center ${thumbnailUrl ? 'hidden' : ''}`}>
          <Play className="w-2 h-2 text-gray-500" />
        </div>
      </div>
      
      {/* Exercise Name */}
      <span className="text-xs font-medium truncate">{exerciseName}</span>
    </div>
  );
};
