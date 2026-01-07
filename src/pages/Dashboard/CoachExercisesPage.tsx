import React, { useState, useEffect } from 'react';
import { CoachLayout } from '@/components/layouts/CoachLayout';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Video, Edit, Trash2 } from "lucide-react";
import { AddExerciseDialog } from "@/components/AddExerciseDialog";
import { EditExerciseDialog } from "@/components/EditExerciseDialog";
import { ExerciseVideoDialog } from "@/components/user-profile/daily-program/ExerciseVideoDialog";
import { useCoachContext } from "@/contexts/CoachContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  coach_id: string | null;
  categories: { name: string; type: string }[];
}

const CoachExercisesContent: React.FC = () => {
  const { coachId, isLoading: contextLoading } = useCoachContext();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);

  const fetchExercises = async () => {
    if (!coachId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          id,
          name,
          description,
          video_url,
          coach_id,
          exercise_to_category(
            exercise_categories(name, type)
          )
        `)
        .eq('coach_id', coachId)
        .order('name');

      if (error) throw error;

      const transformedExercises: Exercise[] = (data || []).map(ex => ({
        id: ex.id,
        name: ex.name,
        description: ex.description,
        video_url: ex.video_url,
        coach_id: ex.coach_id,
        categories: ex.exercise_to_category?.map((etc: any) => ({
          name: etc.exercise_categories?.name || '',
          type: etc.exercise_categories?.type || ''
        })).filter((c: any) => c.name) || []
      }));

      setExercises(transformedExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των ασκήσεων');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coachId) {
      fetchExercises();
    }
  }, [coachId]);

  const handleDelete = async () => {
    if (!exerciseToDelete) return;
    
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseToDelete.id);

      if (error) throw error;

      toast.success('Η άσκηση διαγράφηκε επιτυχώς');
      fetchExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast.error('Σφάλμα κατά τη διαγραφή της άσκησης');
    } finally {
      setDeleteDialogOpen(false);
      setExerciseToDelete(null);
    }
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (contextLoading) {
    return <div className="p-6 text-center text-gray-500">Φόρτωση...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Οι Ασκήσεις μου</h1>
          <p className="text-sm text-gray-500">Διαχείριση προσωπικών ασκήσεων</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Νέα Άσκηση
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Αναζήτηση ασκήσεων..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-none"
        />
      </div>

      {/* Exercises List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Φόρτωση ασκήσεων...</div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'Δεν βρέθηκαν ασκήσεις' : 'Δεν έχετε προσθέσει ασκήσεις ακόμα'}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredExercises.map(exercise => (
            <div
              key={exercise.id}
              className="bg-white border border-gray-200 p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{exercise.name}</h3>
                {exercise.description && (
                  <p className="text-sm text-gray-500 truncate">{exercise.description}</p>
                )}
                {exercise.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {exercise.categories.slice(0, 3).map((cat, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5"
                      >
                        {cat.name}
                      </span>
                    ))}
                    {exercise.categories.length > 3 && (
                      <span className="text-xs text-gray-400">+{exercise.categories.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                {exercise.video_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-none"
                    onClick={() => {
                      setSelectedExercise(exercise);
                      setShowVideoDialog(true);
                    }}
                  >
                    <Video className="w-4 h-4 text-[#00ffba]" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-none"
                  onClick={() => {
                    setSelectedExercise(exercise);
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-none text-destructive hover:text-destructive"
                  onClick={() => {
                    setExerciseToDelete(exercise);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddExerciseDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchExercises}
        coachId={coachId || undefined}
      />

      {selectedExercise && (
        <EditExerciseDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          exercise={{
            id: selectedExercise.id,
            name: selectedExercise.name,
            description: selectedExercise.description,
            video_url: selectedExercise.video_url,
            categories: selectedExercise.categories
          }}
          onSuccess={fetchExercises}
        />
      )}

      {selectedExercise && (
        <ExerciseVideoDialog
          isOpen={showVideoDialog}
          onClose={() => setShowVideoDialog(false)}
          exercise={{
            id: selectedExercise.id,
            exercises: {
              id: selectedExercise.id,
              name: selectedExercise.name,
              video_url: selectedExercise.video_url || undefined
            }
          }}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Η άσκηση "{exerciseToDelete?.name}" θα διαγραφεί οριστικά.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90 rounded-none"
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const CoachExercisesPage: React.FC = () => {
  return (
    <CoachLayout title="Ασκήσεις" requireAuth>
      <CoachExercisesContent />
    </CoachLayout>
  );
};

export default CoachExercisesPage;
