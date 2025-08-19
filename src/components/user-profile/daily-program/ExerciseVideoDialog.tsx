
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from 'lucide-react';
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
  getNotes?: (exerciseId: string) => string;
  updateNotes?: (exerciseId: string, notes: string) => void;
  clearNotes?: (exerciseId: string) => void;
}

export const ExerciseVideoDialog: React.FC<ExerciseVideoDialogProps> = ({
  isOpen,
  onClose,
  exercise,
  getNotes,
  updateNotes,
  clearNotes
}) => {
  // ΔΙΟΡΘΩΣΗ: Πιο προσεκτικός χειρισμός του video_url
  let videoUrl = exercise?.exercises?.video_url;
  
  console.log('🎬 ExerciseVideoDialog raw video_url:', {
    isOpen,
    exerciseName: exercise?.exercises?.name,
    rawVideoUrl: videoUrl,
    typeOfRaw: typeof videoUrl
  });
  
  if (videoUrl && typeof videoUrl === 'object') {
    if ((videoUrl as any).value && (videoUrl as any).value !== 'undefined' && (videoUrl as any).value !== 'null') {
      videoUrl = (videoUrl as any).value;
    } else {
      videoUrl = undefined;
    }
  }
  
  if (videoUrl === 'undefined' || videoUrl === 'null' || videoUrl === '') {
    videoUrl = undefined;
  }
  
  // Αν είναι string, κάνε trim
  if (typeof videoUrl === 'string') {
    videoUrl = videoUrl.trim();
    if (videoUrl === '') {
      videoUrl = undefined;
    }
  }

  console.log('🎬 ExerciseVideoDialog processed:', {
    exerciseName: exercise?.exercises?.name,
    processedVideoUrl: videoUrl,
    typeOfProcessed: typeof videoUrl
  });

  if (!exercise?.exercises) return null;

  const { name, description } = exercise.exercises;
  const hasValidVideo = videoUrl && isValidVideoUrl(videoUrl);

  const renderVideo = () => {
    if (!hasValidVideo) {
      return (
        <div className="aspect-video bg-gray-100 rounded-none flex flex-col items-center justify-center p-8">
          <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center text-lg font-medium">Δεν υπάρχει διαθέσιμο βίντεο</p>
          <p className="text-gray-400 text-center text-sm mt-2">Για αυτή την άσκηση δεν έχει ανέβει βίντεο ακόμα</p>
        </div>
      );
    }

    // YouTube video
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      let videoId = '';
      if (videoUrl.includes('youtube.com/watch?v=')) {
        videoId = videoUrl.split('v=')[1]?.split('&')[0];
      } else if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
      }

      if (videoId) {
        return (
          <div className="aspect-video relative">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&controls=1&fs=0&disablekb=1`}
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
    if (videoUrl.includes('vimeo.com')) {
      const videoId = videoUrl.split('/').pop()?.split('?')[0];
      if (videoId) {
        return (
          <div className="aspect-video">
            <iframe
              src={`https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`}
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
    if (videoUrl.match(/\.(mp4|webm|ogg)$/)) {
      return (
        <div className="aspect-video">
          <video
            src={videoUrl}
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
          <DialogTitle className="text-lg font-semibold">{name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {renderVideo()}
          
          {description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Περιγραφή</h4>
              <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
            </div>
          )}

          {getNotes && updateNotes && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Σημειώσεις</h4>
              <Textarea
                placeholder="Προσθέστε σημειώσεις για αυτή την άσκηση..."
                value={getNotes(exercise.id) || ''}
                onChange={(e) => updateNotes(exercise.id, e.target.value)}
                className="rounded-none resize-none"
                rows={3}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
