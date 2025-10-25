import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Video } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Exercise {
  id: string;
  name: string;
  video_url?: string | null;
}

interface ExerciseSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: Exercise[] | undefined;
  onSelect: (exerciseId: string, exerciseName: string) => void;
  title: string;
}

export const ExerciseSearchDialog: React.FC<ExerciseSearchDialogProps> = ({
  isOpen,
  onClose,
  exercises,
  onSelect,
  title
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExercises = exercises?.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getVideoThumbnail = (videoUrl: string | null | undefined): string | null => {
    if (!videoUrl) return null;
    
    // YouTube thumbnail
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    }
    
    return null;
  };

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise.id, exercise.name);
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Αναζήτηση άσκησης..."
              className="pl-10 rounded-none"
              autoFocus
            />
          </div>

          {/* Exercise List */}
          <ScrollArea className="h-[400px] border border-gray-200 rounded-none">
            <div className="p-2 space-y-1">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Δεν βρέθηκαν ασκήσεις
                </div>
              ) : (
                filteredExercises.map((exercise) => {
                  const thumbnail = getVideoThumbnail(exercise.video_url);
                  
                  return (
                    <div
                      key={exercise.id}
                      onClick={() => handleSelect(exercise)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer rounded-none border border-transparent hover:border-gray-200 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-12 bg-gray-200 rounded-none flex items-center justify-center shrink-0 overflow-hidden">
                        {thumbnail ? (
                          <img 
                            src={thumbnail} 
                            alt={exercise.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Video className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Exercise Name */}
                      <span className="text-sm flex-1">{exercise.name}</span>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Results Count */}
          <div className="text-xs text-gray-500 text-center">
            {filteredExercises.length} αποτελέσματα
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};