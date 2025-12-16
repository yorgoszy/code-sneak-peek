import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id: string;
  name: string;
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
      .select('id, name')
      .neq('id', exerciseId)
      .order('name');

    if (!error && data) {
      setExercises(data);
    }
  };

  const fetchLinkedExercises = async () => {
    // Παίρνουμε τις συνδέσεις και προς τις δύο κατευθύνσεις
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

  const toggleLink = async (targetExerciseId: string) => {
    setLoading(true);
    const isLinked = linkedExercises.includes(targetExerciseId);

    try {
      if (isLinked) {
        // Αφαίρεση σύνδεσης (και τις δύο κατευθύνσεις)
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
        // Προσθήκη σύνδεσης
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
          description: "Οι ασκήσεις συνδέθηκαν για τα strength tests"
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
    return exercises
      .filter(ex => linkedExercises.includes(ex.id))
      .map(ex => ex.name);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Σύνδεση Ασκήσεων - {exerciseName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Τρέχουσες συνδέσεις */}
          {linkedExercises.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Συνδεδεμένες ασκήσεις:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {getLinkedExerciseNames().map((name, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="rounded-none flex items-center gap-1"
                  >
                    {name}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-destructive" 
                      onClick={() => {
                        const ex = exercises.find(e => e.name === name);
                        if (ex) toggleLink(ex.id);
                      }}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Λίστα ασκήσεων για σύνδεση */}
          <div>
            <Label className="text-sm font-medium">Επιλέξτε ασκήσεις για σύνδεση:</Label>
            <div className="max-h-64 overflow-y-auto border rounded-none mt-2">
              {exercises.map(exercise => (
                <div
                  key={exercise.id}
                  onClick={() => !loading && toggleLink(exercise.id)}
                  className={`p-2 cursor-pointer hover:bg-muted border-b last:border-b-0 flex items-center justify-between ${
                    linkedExercises.includes(exercise.id) ? 'bg-[#00ffba]/10' : ''
                  }`}
                >
                  <span className="text-sm">{exercise.name}</span>
                  {linkedExercises.includes(exercise.id) && (
                    <Badge className="rounded-none bg-[#00ffba] text-black">
                      Συνδεδεμένη
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="rounded-none">
            Κλείσιμο
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
