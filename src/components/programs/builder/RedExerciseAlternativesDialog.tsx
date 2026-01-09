import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
}

interface RedExerciseAlternativesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redExercise: Exercise | null;
  allExercises: Exercise[];
  onSelectAlternative: (alternativeId: string) => void;
  onUseAnyway: () => void;
}

export const RedExerciseAlternativesDialog: React.FC<RedExerciseAlternativesDialogProps> = ({
  open,
  onOpenChange,
  redExercise,
  allExercises,
  onSelectAlternative,
  onUseAnyway
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>Προσοχή: Μη Συνιστώμενη Άσκηση</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Η άσκηση <strong className="text-foreground">{redExercise.name}</strong> δεν συνιστάται βάσει του FMS.
          </div>

          {loading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Φόρτωση εναλλακτικών...
            </div>
          ) : alternativeExercises.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Εναλλακτικές ασκήσεις:</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {alternativeExercises.map((exercise) => {
                  const hasValidVideo = exercise.video_url && isValidVideoUrl(exercise.video_url);
                  const thumbnailUrl = hasValidVideo ? getVideoThumbnail(exercise.video_url!) : null;

                  return (
                    <Button
                      key={exercise.id}
                      variant="outline"
                      className="w-full h-auto py-2 px-3 rounded-none justify-start text-left bg-green-50 hover:bg-green-100 border-green-200"
                      onClick={() => onSelectAlternative(exercise.id)}
                    >
                      <div className="flex items-center gap-2">
                        {hasValidVideo && thumbnailUrl ? (
                          <div className="w-8 h-6 rounded-none overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={thumbnailUrl}
                              alt={`${exercise.name} thumbnail`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : hasValidVideo ? (
                          <div className="w-8 h-6 rounded-none bg-muted flex items-center justify-center flex-shrink-0">
                            <Play className="w-3 h-3" />
                          </div>
                        ) : null}
                        <span className="text-xs">{exercise.name}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-2 text-sm text-muted-foreground">
              Δεν υπάρχουν διαθέσιμες εναλλακτικές ασκήσεις.
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-none"
              onClick={() => onOpenChange(false)}
            >
              Ακύρωση
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-none"
              onClick={onUseAnyway}
            >
              Χρήση ούτως ή άλλως
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
