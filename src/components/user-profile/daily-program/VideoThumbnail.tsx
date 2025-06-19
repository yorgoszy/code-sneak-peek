
import React from 'react';
import { Play } from 'lucide-react';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';

interface VideoThumbnailProps {
  exercise: {
    id: string;
    exercises?: {
      name: string;
      video_url?: string | any;
    };
  };
  onVideoClick: (exercise: any) => void;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ exercise, onVideoClick }) => {
  // Διόρθωση για το video_url που μπορεί να έρθει ως object
  let videoUrl = exercise.exercises?.video_url;
  
  // Αν το video_url είναι object με value property
  if (videoUrl && typeof videoUrl === 'object' && videoUrl.value) {
    videoUrl = videoUrl.value;
  }
  
  // Αν είναι string αλλά έχει την τιμή "undefined"
  if (videoUrl === 'undefined' || videoUrl === undefined || videoUrl === null) {
    videoUrl = null;
  }
  
  // Debugging logs
  console.log('🎥 VideoThumbnail render:', {
    exerciseName: exercise.exercises?.name,
    rawVideoUrl: exercise.exercises?.video_url,
    processedVideoUrl: videoUrl,
    typeOfVideoUrl: typeof videoUrl,
    isValid: videoUrl ? isValidVideoUrl(videoUrl) : false
  });
  
  if (!videoUrl || !isValidVideoUrl(videoUrl)) {
    console.log('❌ No valid video URL, showing placeholder for:', exercise.exercises?.name);
    return (
      <div className="w-8 h-5 bg-gray-200 rounded-none flex items-center justify-center flex-shrink-0">
        <span className="text-xs text-gray-400">-</span>
      </div>
    );
  }

  const thumbnailUrl = getVideoThumbnail(videoUrl);
  console.log('🖼️ Thumbnail URL generated:', thumbnailUrl, 'for video:', videoUrl);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎬 VideoThumbnail CLICK detected for:', exercise.exercises?.name);
    console.log('🎬 Calling onVideoClick with exercise:', exercise);
    onVideoClick(exercise);
  };
  
  return (
    <div 
      className="relative w-8 h-5 rounded-none overflow-hidden cursor-pointer group flex-shrink-0 video-thumbnail"
      onClick={handleClick}
      style={{ zIndex: 20 }}
    >
      {thumbnailUrl ? (
        <>
          <img
            src={thumbnailUrl}
            alt={`${exercise.exercises?.name} thumbnail`}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.log('❌ Thumbnail failed to load:', thumbnailUrl);
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.classList.remove('hidden');
              }
            }}
            onLoad={() => {
              console.log('✅ Thumbnail loaded successfully:', thumbnailUrl);
            }}
          />
          <div className="hidden absolute inset-0 bg-gray-200 flex items-center justify-center">
            <Play className="w-2 h-2 text-gray-400" />
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <Play className="w-2 h-2 text-gray-400" />
        </div>
      )}
      
      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Play className="w-2 h-2 text-white" />
      </div>
    </div>
  );
};
