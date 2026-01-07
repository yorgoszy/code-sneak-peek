
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Play } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { matchesSearchTerm } from "@/lib/utils";
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
}

interface SimpleExerciseSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: Exercise[];
  onSelectExercise: (exerciseId: string) => void;
}

export const SimpleExerciseSelectionDialog: React.FC<SimpleExerciseSelectionDialogProps> = ({
  open,
  onOpenChange,
  exercises,
  onSelectExercise
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExercises = useMemo(() => {
    if (!searchTerm.trim()) return exercises;
    return exercises.filter(exercise => matchesSearchTerm(exercise.name, searchTerm));
  }, [exercises, searchTerm]);

  const handleSelect = (exerciseId: string) => {
    onSelectExercise(exerciseId);
    onOpenChange(false);
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] rounded-none">
        <DialogHeader>
          <DialogTitle className="text-sm">Επιλογή Άσκησης</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Αναζήτηση άσκησης..."
              className="pl-8 rounded-none h-8 text-xs"
            />
          </div>

          {/* Exercise List */}
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-2 gap-2 pr-3">
              {filteredExercises.map(exercise => {
                const hasValidVideo = exercise.video_url && isValidVideoUrl(exercise.video_url);
                const thumbnailUrl = hasValidVideo ? getVideoThumbnail(exercise.video_url!) : null;
                
                return (
                  <Button
                    key={exercise.id}
                    variant="outline"
                    className="h-auto py-2 px-3 rounded-none justify-start text-left"
                    onClick={() => handleSelect(exercise.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {/* Video Thumbnail */}
                      {hasValidVideo && thumbnailUrl ? (
                        <div className="w-8 h-6 rounded-none overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={thumbnailUrl}
                            alt={`${exercise.name} thumbnail`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<svg class="w-3 h-3 text-[#00ffba]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
                                parent.className = 'w-8 h-6 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0';
                              }
                            }}
                          />
                        </div>
                      ) : hasValidVideo ? (
                        <div className="w-8 h-6 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Play className="w-3 h-3 text-[#00ffba]" />
                        </div>
                      ) : null}
                      <span className="text-xs truncate">{exercise.name}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>

          {filteredExercises.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              Δεν βρέθηκαν ασκήσεις
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
