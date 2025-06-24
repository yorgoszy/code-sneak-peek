
import React from 'react';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
  categories?: string[];
}

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect: (exerciseId: string) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onSelect
}) => {
  const videoUrl = exercise.video_url;
  const hasValidVideo = videoUrl && isValidVideoUrl(videoUrl);
  const thumbnailUrl = hasValidVideo ? getVideoThumbnail(videoUrl) : null;

  return (
    <div
      className="border rounded-none p-3 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"
      onClick={() => onSelect(exercise.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{exercise.name}</h4>
          {exercise.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {exercise.description}
            </p>
          )}
          {exercise.categories && exercise.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {exercise.categories.slice(0, 3).map((category, index) => (
                <span
                  key={index}
                  className="text-xs bg-[#00ffba] text-black px-1 py-0.5 rounded-none"
                >
                  {category}
                </span>
              ))}
              {exercise.categories.length > 3 && (
                <span className="text-xs text-gray-500">+{exercise.categories.length - 3}</span>
              )}
            </div>
          )}
        </div>
        
        {/* Video Thumbnail */}
        <div className="flex-shrink-0">
          {hasValidVideo && thumbnailUrl ? (
            <div className="w-16 h-12 rounded-none overflow-hidden bg-gray-100">
              <img
                src={thumbnailUrl}
                alt={`${exercise.name} video thumbnail`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs text-gray-400">Video</span>
              </div>
            </div>
          ) : (
            <div className="w-16 h-12 rounded-none bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-400">-</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
