
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play } from 'lucide-react';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';

interface ExerciseVideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: {
    id: string;
    exercises?: {
      id: string;
      name: string;
      description?: string;
      video_url?: string;
    };
  } | null;
}

export const ExerciseVideoDialog: React.FC<ExerciseVideoDialogProps> = ({
  isOpen,
  onClose,
  exercise
}) => {
  if (!exercise?.exercises) return null;

  const { name, description, video_url } = exercise.exercises;
  const hasValidVideo = video_url && isValidVideoUrl(video_url);

  const renderVideo = () => {
    if (!hasValidVideo) {
      return (
        <div className="aspect-video bg-gray-100 rounded-none flex items-center justify-center">
          <p className="text-gray-500">Δεν υπάρχει διαθέσιμο βίντεο</p>
        </div>
      );
    }

    // YouTube video
    if (video_url.includes('youtube.com') || video_url.includes('youtu.be')) {
      let videoId = '';
      if (video_url.includes('youtube.com/watch?v=')) {
        videoId = video_url.split('v=')[1]?.split('&')[0];
      } else if (video_url.includes('youtu.be/')) {
        videoId = video_url.split('youtu.be/')[1]?.split('?')[0];
      }

      if (videoId) {
        return (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={name}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-none"
            />
          </div>
        );
      }
    }

    // Vimeo video
    if (video_url.includes('vimeo.com')) {
      const videoId = video_url.split('/').pop()?.split('?')[0];
      if (videoId) {
        return (
          <div className="aspect-video">
            <iframe
              src={`https://player.vimeo.com/video/${videoId}`}
              title={name}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-none"
            />
          </div>
        );
      }
    }

    // Direct video file
    if (video_url.match(/\.(mp4|webm|ogg)$/)) {
      return (
        <div className="aspect-video">
          <video
            src={video_url}
            controls
            className="w-full h-full rounded-none"
            title={name}
          >
            Ο browser σας δεν υποστηρίζει το video element.
          </video>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-gray-100 rounded-none flex items-center justify-center">
        <p className="text-gray-500">Μη υποστηριζόμενος τύπος βίντεο</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {renderVideo()}
          
          {description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Περιγραφή</h4>
              <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
