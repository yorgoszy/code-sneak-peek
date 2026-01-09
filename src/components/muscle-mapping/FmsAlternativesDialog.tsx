import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Search, Save, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useExerciseWithCategories } from '@/components/programs/builder/hooks/useExerciseWithCategories';
import { ExerciseFilters } from '@/components/programs/builder/ExerciseFilters';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
}

type ExerciseStatus = 'red' | 'yellow' | 'green' | null;

interface FmsAlternativesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fmsExercise: string;
  redExercises: Exercise[];
  allExercises: Exercise[];
  exerciseStatuses: Record<string, ExerciseStatus>;
}

export const FmsAlternativesDialog: React.FC<FmsAlternativesDialogProps> = ({
  open,
  onOpenChange,
  fmsExercise,
  redExercises,
  allExercises,
  exerciseStatuses
}) => {
  const [selectedRedExercise, setSelectedRedExercise] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [alternatives, setAlternatives] = useState<Record<string, string[]>>({}); // redExerciseId -> alternativeIds[]
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const { exercisesWithCategories } = useExerciseWithCategories(allExercises);

  // Φόρτωση υπαρχόντων εναλλακτικών
  useEffect(() => {
    if (open && fmsExercise && redExercises.length > 0) {
      loadExistingAlternatives();
      // Επιλογή πρώτης κόκκινης άσκησης
      if (!selectedRedExercise && redExercises.length > 0) {
        setSelectedRedExercise(redExercises[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fmsExercise, redExercises]);

  const loadExistingAlternatives = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fms_exercise_alternatives')
        .select('red_exercise_id, alternative_exercise_id')
        .eq('fms_exercise', fmsExercise);

      if (error) throw error;

      const alts: Record<string, string[]> = {};
      data?.forEach(alt => {
        if (!alts[alt.red_exercise_id]) {
          alts[alt.red_exercise_id] = [];
        }
        alts[alt.red_exercise_id].push(alt.alternative_exercise_id);
      });
      setAlternatives(alts);
    } catch (error) {
      console.error('Error loading alternatives:', error);
    } finally {
      setLoading(false);
    }
  };

  // Φιλτράρισμα ασκήσεων (εξαιρούνται οι κόκκινες)
  const availableExercises = useMemo(() => {
    const redIds = new Set(redExercises.map(e => e.id));
    return exercisesWithCategories.filter(exercise => {
      if (redIds.has(exercise.id)) return false;
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.every(cat => 
          exercise.categories?.some(exCat => exCat.toLowerCase() === cat.toLowerCase())
        );
      return matchesSearch && matchesCategory;
    });
  }, [exercisesWithCategories, searchTerm, selectedCategories, redExercises]);

  const toggleAlternative = (alternativeId: string) => {
    if (!selectedRedExercise) return;

    setAlternatives(prev => {
      const currentAlts = prev[selectedRedExercise] || [];
      if (currentAlts.includes(alternativeId)) {
        return {
          ...prev,
          [selectedRedExercise]: currentAlts.filter(id => id !== alternativeId)
        };
      } else {
        return {
          ...prev,
          [selectedRedExercise]: [...currentAlts, alternativeId]
        };
      }
    });
  };

  const isAlternativeSelected = (alternativeId: string) => {
    if (!selectedRedExercise) return false;
    return alternatives[selectedRedExercise]?.includes(alternativeId) || false;
  };

  const getAlternativesCount = (redExerciseId: string) => {
    return alternatives[redExerciseId]?.length || 0;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Διαγραφή όλων των υπαρχόντων για αυτό το fms_exercise
      const { error: deleteError } = await supabase
        .from('fms_exercise_alternatives')
        .delete()
        .eq('fms_exercise', fmsExercise);

      if (deleteError) throw deleteError;

      // Δημιουργία νέων εγγραφών
      const toInsert: { fms_exercise: string; red_exercise_id: string; alternative_exercise_id: string }[] = [];
      Object.entries(alternatives).forEach(([redId, altIds]) => {
        altIds.forEach(altId => {
          toInsert.push({
            fms_exercise: fmsExercise,
            red_exercise_id: redId,
            alternative_exercise_id: altId
          });
        });
      });

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('fms_exercise_alternatives')
          .insert(toInsert);

        if (insertError) throw insertError;
      }

      toast.success(`Αποθηκεύτηκαν ${toInsert.length} εναλλακτικές`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving alternatives:', error);
      toast.error('Σφάλμα αποθήκευσης');
    } finally {
      setSaving(false);
    }
  };

  const selectedRedExerciseName = redExercises.find(e => e.id === selectedRedExercise)?.name || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-5xl h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              Εναλλακτικές Ασκήσεις - {fmsExercise}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-none"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Επιλέξτε εναλλακτικές ασκήσεις για κάθε απαγορευμένη άσκηση
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex gap-4">
          {/* Αριστερή στήλη - Κόκκινες ασκήσεις */}
          <div className="w-64 flex-shrink-0 border-r pr-4 overflow-y-auto">
            <h3 className="text-sm font-medium mb-2 text-red-600">Απαγορευμένες Ασκήσεις</h3>
            <div className="space-y-1">
              {redExercises.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => setSelectedRedExercise(exercise.id)}
                  className={cn(
                    "w-full text-left p-2 text-xs border transition-all",
                    selectedRedExercise === exercise.id
                      ? 'bg-red-500 text-white border-red-600'
                      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                  )}
                >
                  <div className="font-medium line-clamp-2">{exercise.name}</div>
                  <div className="text-[10px] mt-1 opacity-75">
                    {getAlternativesCount(exercise.id)} εναλλακτικές
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Δεξιά στήλη - Επιλογή εναλλακτικών */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedRedExercise ? (
              <>
                <div className="flex-shrink-0 mb-2">
                  <div className="text-sm font-medium mb-2">
                    Εναλλακτικές για: <span className="text-red-600">{selectedRedExerciseName}</span>
                  </div>
                  
                  {/* Search & Filters */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-[200px]">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Αναζήτηση..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 border rounded-none text-xs h-7"
                      />
                    </div>
                    <div className="w-[180px]">
                      <ExerciseFilters
                        selectedCategories={selectedCategories}
                        onCategoryChange={setSelectedCategories}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">Φόρτωση...</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-1">
                      {availableExercises.map((exercise) => {
                        const isSelected = isAlternativeSelected(exercise.id);
                        const videoUrl = (exercise as any).video_url;
                        const hasVideo = videoUrl && isValidVideoUrl(videoUrl);
                        const thumbnail = hasVideo ? getVideoThumbnail(videoUrl) : null;
                        const exerciseStatus = exerciseStatuses[exercise.id];
                        const hasWarningStatus = exerciseStatus === 'red' || exerciseStatus === 'yellow';

                        return (
                          <button
                            key={exercise.id}
                            onClick={() => toggleAlternative(exercise.id)}
                            className={cn(
                              "p-2 text-left text-sm border transition-all duration-150 flex flex-col relative",
                              isSelected
                                ? 'bg-green-500 text-white border-green-600'
                                : 'bg-white text-black border-gray-200 hover:border-gray-400'
                            )}
                          >
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-green-600" />
                              </div>
                            )}
                            {/* Status indicator badge */}
                            {hasWarningStatus && (
                              <div className={cn(
                                "absolute top-1 left-1 w-3 h-3 rounded-full border",
                                exerciseStatus === 'red' 
                                  ? 'bg-red-500 border-red-600' 
                                  : 'bg-yellow-400 border-yellow-500'
                              )} title={exerciseStatus === 'red' ? 'Απαγορευμένη' : 'Με προσοχή'} />
                            )}
                            {/* Thumbnail */}
                            {thumbnail && (
                              <div className="w-full aspect-video mb-2 overflow-hidden bg-gray-100">
                                <img
                                  src={thumbnail}
                                  alt={exercise.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <div className="font-medium line-clamp-2 text-xs">{exercise.name}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Επιλέξτε μια απαγορευμένη άσκηση
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Αποθήκευση...' : 'Αποθήκευση Εναλλακτικών'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};