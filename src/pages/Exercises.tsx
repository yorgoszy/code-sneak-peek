
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit2, Trash2, Video, Filter } from "lucide-react";
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

interface FilterState {
  bodyRegion: string;
  movementType: string;
  equipment: string;
}

const filterOptions = {
  bodyRegion: ["", "upper body", "lower body", "total body"],
  movementType: ["", "push", "pull"],
  equipment: ["", "barbell", "dumbbell", "kettlebell", "medball", "band", "chain", "bodyweight"]
};

const Exercises = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    bodyRegion: "",
    movementType: "",
    equipment: ""
  });
  const [showFilters, setShowFilters] = useState(false);
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
    applyFilters();
  }, [exercises, searchQuery, filters]);

  const applyFilters = () => {
    console.log('Applying filters:', { searchQuery, filters });
    console.log('Total exercises:', exercises.length);
    
    let filtered = exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.categories.some(cat => 
          cat.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      return matchesSearch;
    });

    console.log('After search filter:', filtered.length);

    // Apply category filters
    if (filters.bodyRegion) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(exercise =>
        exercise.categories.some(cat => cat.name === filters.bodyRegion)
      );
      console.log(`After body region filter (${filters.bodyRegion}):`, filtered.length, 'from', beforeFilter);
    }

    if (filters.movementType) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(exercise =>
        exercise.categories.some(cat => cat.name === filters.movementType)
      );
      console.log(`After movement type filter (${filters.movementType}):`, filtered.length, 'from', beforeFilter);
    }

    if (filters.equipment) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(exercise =>
        exercise.categories.some(cat => cat.name === filters.equipment)
      );
      console.log(`After equipment filter (${filters.equipment}):`, filtered.length, 'from', beforeFilter);
    }

    console.log('Final filtered exercises:', filtered.length);
    setFilteredExercises(filtered);
  };

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

      console.log('Fetched exercises:', transformedExercises.length);
      console.log('Sample exercise categories:', transformedExercises[0]?.categories);
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

  const resetFilters = () => {
    setFilters({
      bodyRegion: "",
      movementType: "",
      equipment: ""
    });
    setSearchQuery("");
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== "").length + (searchQuery ? 1 : 0);

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
          <div className="mb-6 space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Αναζήτηση ασκήσεων..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-none"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-none"
              >
                <Filter className="h-4 w-4 mr-2" />
                Φίλτρα {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Button>

              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  onClick={resetFilters}
                  className="rounded-none text-sm"
                >
                  Καθαρισμός
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="bg-white p-4 border rounded space-y-4">
                <h3 className="font-medium text-gray-900">Φίλτρα Κατηγοριών</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Περιοχή Σώματος
                    </label>
                    <select
                      value={filters.bodyRegion}
                      onChange={(e) => {
                        console.log('Body region filter changed to:', e.target.value);
                        setFilters(prev => ({ ...prev, bodyRegion: e.target.value }));
                      }}
                      className="w-full p-2 border border-gray-300 rounded-none bg-white"
                    >
                      {filterOptions.bodyRegion.map(option => (
                        <option key={option} value={option}>
                          {option || "Όλες"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Τύπος Κίνησης
                    </label>
                    <select
                      value={filters.movementType}
                      onChange={(e) => {
                        console.log('Movement type filter changed to:', e.target.value);
                        setFilters(prev => ({ ...prev, movementType: e.target.value }));
                      }}
                      className="w-full p-2 border border-gray-300 rounded-none bg-white"
                    >
                      {filterOptions.movementType.map(option => (
                        <option key={option} value={option}>
                          {option || "Όλες"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Εξοπλισμός
                    </label>
                    <select
                      value={filters.equipment}
                      onChange={(e) => {
                        console.log('Equipment filter changed to:', e.target.value);
                        setFilters(prev => ({ ...prev, equipment: e.target.value }));
                      }}
                      className="w-full p-2 border border-gray-300 rounded-none bg-white"
                    >
                      {filterOptions.equipment.map(option => (
                        <option key={option} value={option}>
                          {option || "Όλες"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
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
                        {searchQuery || activeFiltersCount > 0 ? 'Δεν βρέθηκαν ασκήσεις' : 'Δεν υπάρχουν ασκήσεις'}
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
                                  className="w-16 h-12 object-cover border cursor-pointer"
                                  onClick={() => window.open(exercise.video_url!, '_blank')}
                                />
                              ) : (
                                <div 
                                  className="w-16 h-12 bg-gray-100 border flex items-center justify-center cursor-pointer"
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
