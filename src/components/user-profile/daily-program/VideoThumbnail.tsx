
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
  
  if (!videoUrl || !isValidVideoUrl(videoUrl)) {
    return (
      <div className="w-10 h-6 bg-gray-200 rounded-none flex items-center justify-center flex-shrink-0 mr-2">
        <span className="text-xs text-gray-400">-</span>
      </div>
    );
  }

  const thumbnailUrl = getVideoThumbnail(videoUrl);
  
  return (
    <div 
      className="relative w-10 h-6 rounded-none overflow-hidden cursor-pointer group flex-shrink-0 mr-2 video-thumbnail"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎥 VideoThumbnail clicked for:', exercise.exercises?.name);
        onVideoClick(exercise);
      }}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={`${exercise.exercises?.name} thumbnail`}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log('❌ Thumbnail failed to load:', thumbnailUrl);
            e.currentTarget.style.display = 'none';
          }}
          onLoad={() => {
            console.log('✅ Thumbnail loaded successfully:', thumbnailUrl);
          }}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <Play className="w-2 h-2 text-gray-400" />
        </div>
      )}
      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Play className="w-2 h-2 text-white" />
      </div>
    </div>
  );
};
