
import React from 'react';
import { Play } from 'lucide-react';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';

interface VideoThumbnailProps {
  exercise: {
    id: string;
    exercises?: {
      name: string;
      video_url?: string;
    };
  };
  onVideoClick: (exercise: any) => void;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ exercise, onVideoClick }) => {
  const videoUrl = exercise.exercises?.video_url;
  
  console.log('🎥 VideoThumbnail render:', {
    exerciseName: exercise.exercises?.name,
    videoUrl: videoUrl,
    isValid: videoUrl ? isValidVideoUrl(videoUrl) : false
  });
  
  if (!videoUrl || !isValidVideoUrl(videoUrl)) {
    console.log('❌ No valid video URL, showing placeholder');
    return (
      <div className="w-10 h-6 bg-gray-200 rounded-none flex items-center justify-center flex-shrink-0 mr-2">
        <span className="text-xs text-gray-400">-</span>
      </div>
    );
  }

  const thumbnailUrl = getVideoThumbnail(videoUrl);
  console.log('🖼️ Thumbnail URL generated:', thumbnailUrl);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎬 VideoThumbnail CLICK detected for:', exercise.exercises?.name);
    console.log('🎬 Calling onVideoClick with exercise:', exercise);
    onVideoClick(exercise);
  };
  
  return (
    <div 
      className="relative w-10 h-6 rounded-none overflow-hidden cursor-pointer group flex-shrink-0 mr-2 video-thumbnail border-2 border-red-500"
      onClick={handleClick}
      style={{ zIndex: 10 }}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={`${exercise.exercises?.name} thumbnail`}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log('❌ Thumbnail failed to load:', thumbnailUrl);
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
          onLoad={() => {
            console.log('✅ Thumbnail loaded successfully:', thumbnailUrl);
          }}
        />
      ) : null}
      
      <div className={`absolute inset-0 bg-gray-200 flex items-center justify-center ${thumbnailUrl ? 'hidden' : ''}`}>
        <Play className="w-2 h-2 text-gray-400" />
      </div>
      
      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Play className="w-2 h-2 text-white" />
      </div>
    </div>
  );
};
