import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isValidVideoUrl, getVideoThumbnail } from '@/utils/videoUtils';

interface Exercise {
  id: string;
  name: string;
  video_url?: string;
}

interface MuscleExerciseLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  muscleName: string;
  exerciseType: 'stretching' | 'strengthening';
}

export const MuscleExerciseLinkDialog: React.FC<MuscleExerciseLinkDialogProps> = ({
  open,
  onOpenChange,
  muscleName,
  exerciseType,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch exercises
  useEffect(() => {
    if (open) {
      fetchExercises();
      fetchExistingLink();
    }
  }, [open]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, video_url')
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error('Σφάλμα φόρτωσης ασκήσεων');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingLink = async () => {
    try {
      const { data, error } = await supabase
        .from('functional_muscle_exercises')
        .select('exercise_id')
        .eq('muscle_name', muscleName)
        .eq('exercise_type', exerciseType)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setSelectedExerciseId(data?.exercise_id || null);
    } catch (error) {
      console.error('Error fetching existing link:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedExerciseId) {
      toast.error('Επιλέξτε μια άσκηση');
      return;
    }

    setSaving(true);
    try {
      // Delete existing link first, then insert new one
      await supabase
        .from('functional_muscle_exercises')
        .delete()
        .eq('muscle_name', muscleName)
        .eq('exercise_type', exerciseType);

      const { error } = await supabase
        .from('functional_muscle_exercises')
        .insert({
          muscle_name: muscleName,
          issue_name: '', // Empty string for global muscle-exercise link
          exercise_id: selectedExerciseId,
          exercise_type: exerciseType,
        } as any);

      if (error) throw error;
      
      toast.success('Η σύνδεση αποθηκεύτηκε');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving link:', error);
      toast.error('Σφάλμα αποθήκευσης');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLink = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('functional_muscle_exercises')
        .delete()
        .eq('muscle_name', muscleName)
        .eq('exercise_type', exerciseType);

      if (error) throw error;
      
      toast.success('Η σύνδεση αφαιρέθηκε');
      setSelectedExerciseId(null);
    } catch (error) {
      console.error('Error removing link:', error);
      toast.error('Σφάλμα αφαίρεσης');
    } finally {
      setSaving(false);
    }
  };

  const filteredExercises = exercises.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col rounded-none">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Σύνδεση Άσκησης: {muscleName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {exerciseType === 'stretching' ? 'Διάταση' : 'Ενδυνάμωση'}
          </p>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Αναζήτηση άσκησης..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-none"
          />
        </div>

        {/* Exercise Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Φόρτωση...</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-2">
              {filteredExercises.map((exercise) => {
                const isSelected = selectedExerciseId === exercise.id;
                const hasVideo = exercise.video_url && isValidVideoUrl(exercise.video_url);
                const thumbnail = hasVideo ? getVideoThumbnail(exercise.video_url!) : null;

                return (
                  <button
                    key={exercise.id}
                    onClick={() => setSelectedExerciseId(exercise.id)}
                    className={cn(
                      "relative aspect-square border-2 flex flex-col items-center justify-center p-1 transition-all",
                      isSelected
                        ? "border-[#00ffba] bg-[#00ffba]/10"
                        : "border-border hover:border-[#00ffba]/50 bg-background"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-[#00ffba] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    )}
                    {thumbnail && (
                      <img
                        src={thumbnail}
                        alt=""
                        className="w-full h-2/3 object-cover"
                        loading="lazy"
                      />
                    )}
                    <span className="text-[10px] text-center mt-1 line-clamp-2 leading-tight">
                      {exercise.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          {selectedExerciseId && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveLink}
              disabled={saving}
              className="rounded-none"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Αφαίρεση
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-none"
            >
              Ακύρωση
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !selectedExerciseId}
              className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
