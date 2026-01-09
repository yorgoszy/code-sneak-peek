import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Search, Play, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { useFmsExerciseStatusContext } from '@/contexts/FmsExerciseStatusContext';

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
}

export const RedExerciseAlternativesPopup: React.FC<RedExerciseAlternativesPopupProps> = ({
  open,
  onOpenChange,
  redExercise,
  allExercises,
  onSelectAlternative,
  onUseAnyway
}) => {
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { exerciseStatusMap } = useFmsExerciseStatusContext();

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
    
    return allExercises.filter(ex => {
      const matchesId = alternatives.includes(ex.id);
      const matchesSearch = searchTerm.trim() === '' || 
        ex.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesId && matchesSearch;
    });
  }, [allExercises, alternatives, searchTerm]);

  const hasAlternatives = alternatives.length > 0;

  if (!redExercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none w-[500px] max-w-[95vw] p-4">
        <DialogHeader className="flex-shrink-0 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Απαγορευμένη Άσκηση</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-3">
          {/* Red exercise info */}
          <div className="bg-red-50 border border-red-200 p-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
              <span className="font-medium text-sm text-red-700">{redExercise.name}</span>
            </div>
            <p className="text-xs text-red-600 mt-2">
              Αυτή η άσκηση είναι απαγορευμένη για τον επιλεγμένο αθλητή βάσει της αξιολόγησης FMS.
            </p>
          </div>

          {/* Alternatives section */}
          {loading ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              Φόρτωση εναλλακτικών...
            </div>
          ) : hasAlternatives ? (
            <>
              <div className="text-sm font-medium mb-2">
                Διαθέσιμες Εναλλακτικές ({alternatives.length})
              </div>
              
              {alternatives.length > 3 && (
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Αναζήτηση..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 border rounded-none text-xs"
                  />
                </div>
              )}

              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {alternativeExercises.map((exercise) => {
                  const hasValidVideo = exercise.video_url && isValidVideoUrl(exercise.video_url);
                  const thumbnailUrl = hasValidVideo ? getVideoThumbnail(exercise.video_url!) : null;
                  const status = exerciseStatusMap.get(exercise.id);

                  return (
                    <Button
                      key={exercise.id}
                      variant="outline"
                      className={cn(
                        "w-full h-auto py-2 px-3 rounded-none justify-start text-left",
                        status === 'yellow' && 'border-yellow-400 bg-yellow-50'
                      )}
                      onClick={() => onSelectAlternative(exercise.id)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {status === 'yellow' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 flex-shrink-0" />
                        )}
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
                        <span className="text-xs truncate flex-1">{exercise.name}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                      </div>
                    </Button>
                  );
                })}

                {alternativeExercises.length === 0 && searchTerm && (
                  <div className="text-center py-2 text-gray-500 text-xs">
                    Δεν βρέθηκαν εναλλακτικές με αυτή την αναζήτηση
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 p-3 text-center">
              <p className="text-sm text-gray-600">
                Δεν έχουν οριστεί εναλλακτικές ασκήσεις.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Μπορείτε να προσθέσετε εναλλακτικές στο Muscle Mapping.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t">
          <Button
            variant="ghost"
            className="rounded-none text-xs"
            onClick={() => onOpenChange(false)}
          >
            Ακύρωση
          </Button>
          <Button
            variant="outline"
            className="rounded-none text-xs border-red-300 text-red-600 hover:bg-red-50"
            onClick={onUseAnyway}
          >
            Χρήση Παρόλα Αυτά
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
