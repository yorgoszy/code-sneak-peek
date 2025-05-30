
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit2, Trash2, Video } from "lucide-react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddExerciseDialog } from "@/components/AddExerciseDialog";
import { EditExerciseDialog } from "@/components/EditExerciseDialog";
import { toast } from "sonner";
import { getVideoThumbnail } from "@/utils/videoUtils";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  categories: { name: string; type: string }[];
}

const Exercises = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loadingExercises, setLoadingExercises] = useState(true);

  useEffect(() => {
    if (user) {
      fetchExercises();
    }
  }, [user]);

  useEffect(() => {
    const filtered = exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.categories.some(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    setFilteredExercises(filtered);
  }, [exercises, searchQuery]);

  const fetchExercises = async () => {
    try {
      setLoadingExercises(true);
      
      // Fetch exercises with their categories
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select(`
          id,
          name,
          description,
          video_url,
          exercise_to_category!inner(
            exercise_categories(
              name,
              type
            )
          )
        `);

      if (exercisesError) throw exercisesError;

      // Transform the data to include categories
      const transformedExercises: Exercise[] = exercisesData?.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        video_url: exercise.video_url,
        categories: exercise.exercise_to_category?.map((etc: any) => ({
          name: etc.exercise_categories.name,
          type: etc.exercise_categories.type
        })) || []
      })) || [];

      setExercises(transformedExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των ασκήσεων');
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsEditDialogOpen(true);
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την άσκηση;')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;

      toast.success('Η άσκηση διαγράφηκε επιτυχώς');
      fetchExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast.error('Σφάλμα κατά τη διαγραφή της άσκησης');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex-1 flex flex-col">
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ασκήσεις</h1>
              <p className="text-sm text-gray-600">
                Διαχείριση τραπέζας ασκήσεων
              </p>
            </div>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="rounded-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              Προσθήκη Άσκησης
            </Button>
          </div>
        </nav>

        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Αναζήτηση ασκήσεων..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-none"
              />
            </div>
          </div>

          <div className="bg-white rounded shadow">
            {loadingExercises ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Φόρτωση ασκήσεων...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Όνομα</TableHead>
                    <TableHead>Περιγραφή</TableHead>
                    <TableHead>Κατηγορίες</TableHead>
                    <TableHead>Βίντεο</TableHead>
                    <TableHead className="text-right">Ενέργειες</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExercises.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {searchQuery ? 'Δεν βρέθηκαν ασκήσεις' : 'Δεν υπάρχουν ασκήσεις'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExercises.map((exercise) => (
                      <TableRow key={exercise.id}>
                        <TableCell className="font-medium">{exercise.name}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={exercise.description || ''}>
                            {exercise.description || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {exercise.categories.map((category, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="text-xs"
                              >
                                {category.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {exercise.video_url ? (
                            <div className="flex items-center space-x-2">
                              {getVideoThumbnail(exercise.video_url) ? (
                                <img 
                                  src={getVideoThumbnail(exercise.video_url)}
                                  alt="Video thumbnail"
                                  className="w-16 h-12 object-cover rounded border cursor-pointer"
                                  onClick={() => window.open(exercise.video_url!, '_blank')}
                                />
                              ) : (
                                <div 
                                  className="w-16 h-12 bg-gray-100 border rounded flex items-center justify-center cursor-pointer"
                                  onClick={() => window.open(exercise.video_url!, '_blank')}
                                >
                                  <Video className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="rounded-none"
                              onClick={() => handleEditExercise(exercise)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="rounded-none text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteExercise(exercise.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <AddExerciseDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchExercises}
      />

      <EditExerciseDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        exercise={selectedExercise}
        onSuccess={fetchExercises}
      />
    </div>
  );
};

export default Exercises;
