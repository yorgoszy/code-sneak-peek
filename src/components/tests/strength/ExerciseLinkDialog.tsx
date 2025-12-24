import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Link2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExerciseSearchInput } from "@/components/programs/builder/ExerciseSearchInput";
import { ExerciseFilters } from "@/components/programs/builder/ExerciseFilters";
import { getVideoThumbnail } from "@/utils/videoUtils";
import { matchesSearchTerm } from "@/lib/utils";

interface Exercise {
  id: string;
  name: string;
  video_url?: string | null;
  categories?: string[];
}

interface ExerciseLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  onLinksUpdated: () => void;
}

export const ExerciseLinkDialog: React.FC<ExerciseLinkDialogProps> = ({
  isOpen,
  onClose,
  exerciseId,
  exerciseName,
  onLinksUpdated
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [linkedExercises, setLinkedExercises] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchExercises();
      fetchLinkedExercises();
    }
  }, [isOpen, exerciseId]);

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        id, 
        name, 
        video_url,
        exercise_to_category(
          exercise_categories(name)
        )
      `)
      .neq('id', exerciseId)
      .order('name');

    if (!error && data) {
      const exercisesWithCategories = data.map(ex => ({
        id: ex.id,
        name: ex.name,
        video_url: ex.video_url,
        categories: ex.exercise_to_category?.map((etc: any) => etc.exercise_categories?.name).filter(Boolean) || []
      }));
      setExercises(exercisesWithCategories);
    }
  };

  const fetchLinkedExercises = async () => {
    const { data: links1 } = await supabase
      .from('exercise_relationships')
      .select('related_exercise_id')
      .eq('exercise_id', exerciseId)
      .eq('relationship_type', 'strength_variant');

    const { data: links2 } = await supabase
      .from('exercise_relationships')
      .select('exercise_id')
      .eq('related_exercise_id', exerciseId)
      .eq('relationship_type', 'strength_variant');

    const linkedIds = [
      ...(links1?.map(l => l.related_exercise_id) || []),
      ...(links2?.map(l => l.exercise_id) || [])
    ];

    setLinkedExercises([...new Set(linkedIds)]);
  };

  const filteredExercises = useMemo(() => {
    let filtered = exercises;

    if (searchTerm) {
      filtered = filtered.filter(exercise => 
        matchesSearchTerm(exercise.name, searchTerm)
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(exercise => {
        if (!exercise.categories || exercise.categories.length === 0) {
          return false;
        }
        return selectedCategories.some(selectedCat => 
          exercise.categories!.some(exerciseCat => 
            exerciseCat.toLowerCase() === selectedCat.toLowerCase()
          )
        );
      });
    }

    return filtered;
  }, [exercises, searchTerm, selectedCategories]);

  const toggleLink = async (targetExerciseId: string) => {
    setLoading(true);
    const isLinked = linkedExercises.includes(targetExerciseId);

    try {
      if (isLinked) {
        await supabase
          .from('exercise_relationships')
          .delete()
          .eq('relationship_type', 'strength_variant')
          .or(`and(exercise_id.eq.${exerciseId},related_exercise_id.eq.${targetExerciseId}),and(exercise_id.eq.${targetExerciseId},related_exercise_id.eq.${exerciseId})`);

        setLinkedExercises(prev => prev.filter(id => id !== targetExerciseId));
        toast({
          title: "Η σύνδεση αφαιρέθηκε",
          description: "Οι ασκήσεις δεν είναι πλέον συνδεδεμένες"
        });
      } else {
        await supabase
          .from('exercise_relationships')
          .insert({
            exercise_id: exerciseId,
            related_exercise_id: targetExerciseId,
            relationship_type: 'strength_variant'
          });

        setLinkedExercises(prev => [...prev, targetExerciseId]);
        toast({
          title: "Σύνδεση επιτυχής",
          description: "Οι ασκήσεις συνδέθηκαν για το 1RM"
        });
      }
      onLinksUpdated();
    } catch (error) {
      console.error('Error toggling link:', error);
      toast({
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η αλλαγή της σύνδεσης",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getLinkedExerciseNames = () => {
    return exercises.filter(ex => linkedExercises.includes(ex.id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Σύνδεση Ασκήσεων για 1RM - {exerciseName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Τρέχουσες συνδέσεις */}
          {linkedExercises.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Συνδεδεμένες ασκήσεις:</p>
              <div className="flex flex-wrap gap-2">
                {getLinkedExerciseNames().map((ex) => (
                  <Badge 
                    key={ex.id} 
                    variant="secondary" 
                    className="rounded-none flex items-center gap-1 bg-[#00ffba]/20 text-foreground"
                  >
                    {ex.name}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-destructive" 
                      onClick={() => toggleLink(ex.id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex gap-4">
            <ExerciseSearchInput
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
            <div className="w-[30%]">
              <ExerciseFilters
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
              />
            </div>
          </div>

          {/* Exercise Grid */}
          <div className="max-h-96 overflow-y-auto border rounded-none">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
              {filteredExercises.map(exercise => {
                const isLinked = linkedExercises.includes(exercise.id);
                const thumbnail = exercise.video_url ? getVideoThumbnail(exercise.video_url) : null;
                
                return (
                  <div
                    key={exercise.id}
                    onClick={() => !loading && toggleLink(exercise.id)}
                    className={`
                      relative p-2 cursor-pointer border transition-all
                      ${isLinked 
                        ? 'border-[#00ffba] bg-[#00ffba]/10' 
                        : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                      }
                    `}
                  >
                    {/* Thumbnail or placeholder */}
                    <div className="aspect-video bg-muted mb-2 flex items-center justify-center overflow-hidden">
                      {thumbnail ? (
                        <img 
                          src={thumbnail} 
                          alt={exercise.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-muted-foreground text-xs">Χωρίς βίντεο</div>
                      )}
                    </div>

                    {/* Exercise name */}
                    <p className="text-sm font-medium truncate">{exercise.name}</p>

                    {/* Categories */}
                    {exercise.categories && exercise.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.categories.slice(0, 2).map((cat, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] px-1 py-0 rounded-none">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Linked indicator */}
                    {isLinked && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-[#00ffba] flex items-center justify-center">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredExercises.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Δεν βρέθηκαν ασκήσεις
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
