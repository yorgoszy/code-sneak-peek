
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Play } from "lucide-react";
import { AddExerciseDialog } from "@/components/AddExerciseDialog";
import { EditExerciseDialog } from "@/components/EditExerciseDialog";
import { DeleteUserDialog } from "@/components/DeleteUserDialog";
import { ExercisesList } from "@/components/exercises/ExercisesList";
import { ExerciseVideoDialog } from "@/components/user-profile/daily-program/ExerciseVideoDialog";

const Exercises = () => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [deletingExercise, setDeletingExercise] = useState<any>(null);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    const filtered = exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.exercise_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredExercises(filtered);
  }, [exercises, searchTerm]);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          *,
          exercise_categories (
            id,
            name
          )
        `)
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των ασκήσεων');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exercise: any) => {
    setEditingExercise(exercise);
  };

  const handleDelete = (exercise: any) => {
    setDeletingExercise(exercise);
  };

  const handleVideoPlay = (exercise: any) => {
    setSelectedExercise(exercise);
    setShowVideoDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingExercise) return;

    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', deletingExercise.id);

      if (error) throw error;

      toast.success('Η άσκηση διαγράφηκε επιτυχώς');
      setDeletingExercise(null);
      fetchExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast.error('Σφάλμα κατά τη διαγραφή της άσκησης');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Φόρτωση ασκήσεων...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Τράπεζα Ασκήσεων</h1>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Προσθήκη Άσκησης
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Αναζήτηση ασκήσεων..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-none"
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredExercises.length} από {exercises.length} ασκήσεις
        </div>
      </div>

      <ExercisesList
        exercises={filteredExercises}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onVideoPlay={handleVideoPlay}
      />

      <AddExerciseDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onExerciseAdded={fetchExercises}
      />

      <EditExerciseDialog
        exercise={editingExercise}
        open={!!editingExercise}
        onOpenChange={(open) => !open && setEditingExercise(null)}
        onExerciseUpdated={fetchExercises}
      />

      <DeleteUserDialog
        user={deletingExercise}
        open={!!deletingExercise}
        onOpenChange={(open) => !open && setDeletingExercise(null)}
        onConfirm={confirmDelete}
        title="Διαγραφή Άσκησης"
        description={`Είστε σίγουροι ότι θέλετε να διαγράψετε την άσκηση "${deletingExercise?.name}";`}
      />

      <ExerciseVideoDialog
        isOpen={showVideoDialog}
        onClose={() => setShowVideoDialog(false)}
        exercise={selectedExercise}
      />
    </div>
  );
};

export default Exercises;
