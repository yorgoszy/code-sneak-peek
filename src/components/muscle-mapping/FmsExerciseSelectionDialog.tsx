import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Search, Save } from 'lucide-react';
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

interface ExerciseWithStatus {
  id: string;
  name: string;
  status: ExerciseStatus;
}

interface FmsExerciseSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: Exercise[];
  fmsExercise: string; // π.χ. "Shoulder Mobility"
  onSave: () => void;
}

export const FmsExerciseSelectionDialog: React.FC<FmsExerciseSelectionDialogProps> = ({
  open,
  onOpenChange,
  exercises,
  fmsExercise,
  onSave
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [exerciseStatuses, setExerciseStatuses] = useState<Record<string, ExerciseStatus>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const { exercisesWithCategories } = useExerciseWithCategories(exercises);

  // Φόρτωση υπαρχόντων δεδομένων όταν ανοίγει το dialog
  useEffect(() => {
    if (open && fmsExercise) {
      loadExistingMappings();
    }
  }, [open, fmsExercise]);

  const loadExistingMappings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fms_exercise_mappings')
        .select('exercise_id, status')
        .eq('fms_exercise', fmsExercise);

      if (error) throw error;

      const statuses: Record<string, ExerciseStatus> = {};
      data?.forEach(mapping => {
        statuses[mapping.exercise_id] = mapping.status as ExerciseStatus;
      });
      setExerciseStatuses(statuses);
    } catch (error) {
      console.error('Error loading FMS mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = useMemo(() => {
    return exercisesWithCategories.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
      // AND logic: η άσκηση πρέπει να έχει ΟΛΕΣ τις επιλεγμένες κατηγορίες (case-insensitive)
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.every(cat => 
          exercise.categories?.some(exCat => exCat.toLowerCase() === cat.toLowerCase())
        );
      return matchesSearch && matchesCategory;
    });
  }, [exercisesWithCategories, searchTerm, selectedCategories]);

  // Click logic: null (green) -> red -> yellow -> null (green)
  // 1 click = red, 2 clicks = yellow, no click = green (default)
  const handleExerciseClick = (exerciseId: string) => {
    setExerciseStatuses(prev => {
      const currentStatus = prev[exerciseId];
      let newStatus: ExerciseStatus;
      
      switch (currentStatus) {
        case null:
        case undefined:
        case 'green':
          newStatus = 'red';
          break;
        case 'red':
          newStatus = 'yellow';
          break;
        case 'yellow':
          newStatus = null; // Back to green (default)
          break;
        default:
          newStatus = 'red';
      }
      
      return { ...prev, [exerciseId]: newStatus };
    });
  };

  const getStatusColor = (status: ExerciseStatus) => {
    switch (status) {
      case 'red':
        return 'bg-red-500 text-white border-red-600';
      case 'yellow':
        return 'bg-yellow-400 text-black border-yellow-500';
      default:
        // null/undefined/green = green (default safe)
        return 'bg-green-500 text-white border-green-600';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Διαγραφή όλων των υπαρχόντων mappings για αυτό το fms_exercise
      const { error: deleteError } = await supabase
        .from('fms_exercise_mappings')
        .delete()
        .eq('fms_exercise', fmsExercise);

      if (deleteError) throw deleteError;

      // Insert only red and yellow mappings (green is default, no need to store)
      const mappingsToInsert = Object.entries(exerciseStatuses)
        .filter(([_, status]) => status === 'red' || status === 'yellow')
        .map(([exerciseId, status]) => ({
          fms_exercise: fmsExercise,
          exercise_id: exerciseId,
          status: status as string
        }));

      if (mappingsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('fms_exercise_mappings')
          .insert(mappingsToInsert);

        if (insertError) throw insertError;
      }

      toast.success(`Αποθηκεύτηκαν ${mappingsToInsert.length} ασκήσεις`);
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving FMS mappings:', error);
      toast.error('Σφάλμα αποθήκευσης');
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = Object.values(exerciseStatuses).filter(s => s !== null).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-4xl h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              Επιλογή Ασκήσεων - {fmsExercise}
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
            1 κλικ = Κόκκινο (Απαγορεύεται) | 2 κλικ = Κίτρινο (Με προσοχή) | Χωρίς κλικ = Πράσινο (Ασφαλές)
          </p>
        </DialogHeader>

        {/* Search, Filters, Legend - ALL IN ONE ROW */}
        <div className="flex-shrink-0 flex items-center gap-2 py-2">
          {/* Search */}
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
          
          {/* Filters */}
          <div className="w-[180px]">
            <ExerciseFilters
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 text-[10px] ml-auto">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 border border-red-600"></div>
              <span>Απαγορεύεται</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 border border-yellow-500"></div>
              <span>Με προσοχή</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 border border-green-600"></div>
              <span>Ασφαλές</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Φόρτωση...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-1">
              {filteredExercises.map((exercise) => {
                const status = exerciseStatuses[exercise.id];
                const videoUrl = (exercise as any).video_url;
                const hasVideo = videoUrl && isValidVideoUrl(videoUrl);
                const thumbnail = hasVideo ? getVideoThumbnail(videoUrl) : null;

                return (
                  <button
                    key={exercise.id}
                    onClick={() => handleExerciseClick(exercise.id)}
                    className={cn(
                      "p-2 text-left text-sm border transition-all duration-150 flex flex-col",
                      getStatusColor(status)
                    )}
                  >
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
                    <div className="text-[10px] mt-1 opacity-80">
                      {status === 'red' ? 'Απαγορεύεται' : status === 'yellow' ? 'Με προσοχή' : 'Ασφαλές'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-gray-600">
            {selectedCount} ασκήσεις επιλεγμένες
          </span>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
