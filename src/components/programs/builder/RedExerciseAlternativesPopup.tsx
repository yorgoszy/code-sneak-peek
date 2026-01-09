import React, { useState, useEffect, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
}

interface RedExerciseAlternativesPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redExercise: Exercise | null;
  allExercises: Exercise[];
  onSelectAlternative: (alternativeId: string) => void;
  onUseAnyway: () => void;
  children?: React.ReactNode;
}

export const RedExerciseAlternativesPopup: React.FC<RedExerciseAlternativesPopupProps> = ({
  open,
  onOpenChange,
  redExercise,
  allExercises,
  onSelectAlternative,
  onUseAnyway,
  children
}) => {
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load alternatives for this red exercise
  useEffect(() => {
    if (open && redExercise) {
      loadAlternatives();
    }
  }, [open, redExercise?.id]);

  const loadAlternatives = async () => {
    if (!redExercise) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fms_exercise_alternatives')
        .select('alternative_exercise_id')
        .eq('red_exercise_id', redExercise.id);

      if (error) throw error;

      const altIds = data?.map(d => d.alternative_exercise_id) || [];
      setAlternatives(altIds);
      console.log('📋 Loaded alternatives for red exercise:', redExercise.name, altIds);
    } catch (error) {
      console.error('Error loading alternatives:', error);
      setAlternatives([]);
    } finally {
      setLoading(false);
    }
  };

  // Get alternative exercises from allExercises
  const alternativeExercises = useMemo(() => {
    if (alternatives.length === 0) return [];
    return allExercises.filter(ex => alternatives.includes(ex.id));
  }, [allExercises, alternatives]);

  if (!redExercise) return null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children || <span />}
      </PopoverTrigger>
      <PopoverContent 
        className="p-1 rounded-none" 
        side="top" 
        align="start"
        sideOffset={4}
        style={{ width: 'fit-content', maxWidth: '220px' }}
      >
        {loading ? (
          <div className="px-2 py-1 text-xs text-gray-500">Φόρτωση...</div>
        ) : alternativeExercises.length > 0 ? (
          <div className="space-y-0.5">
            {alternativeExercises.map((exercise) => {
              const hasValidVideo = exercise.video_url && isValidVideoUrl(exercise.video_url);
              const thumbnailUrl = hasValidVideo ? getVideoThumbnail(exercise.video_url!) : null;

              return (
                <Button
                  key={exercise.id}
                  variant="ghost"
                  className="w-full h-auto py-1 px-2 rounded-none justify-start text-left hover:bg-green-100"
                  onClick={() => {
                    onSelectAlternative(exercise.id);
                    onOpenChange(false);
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    {hasValidVideo && thumbnailUrl ? (
                      <div className="w-5 h-4 rounded-none overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={thumbnailUrl}
                          alt={`${exercise.name} thumbnail`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : hasValidVideo ? (
                      <div className="w-5 h-4 rounded-none bg-muted flex items-center justify-center flex-shrink-0">
                        <Play className="w-2 h-2" />
                      </div>
                    ) : null}
                    <span className="text-xs truncate">{exercise.name}</span>
                  </div>
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="px-2 py-1 text-xs text-gray-500">
            Δεν υπάρχει εναλλακτική
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
