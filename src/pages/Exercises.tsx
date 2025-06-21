
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { AddExerciseDialog } from "@/components/AddExerciseDialog";
import { EditExerciseDialog } from "@/components/EditExerciseDialog";
import { ExerciseVideoDialog } from "@/components/user-profile/daily-program/ExerciseVideoDialog";
import { ExercisesFilters } from "@/components/exercises/ExercisesFilters";
import { ExercisesTable } from "@/components/exercises/ExercisesTable";
import { useExercises } from "@/hooks/useExercises";
import { useExerciseFilters } from "@/hooks/useExerciseFilters";

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [selectedVideoExercise, setSelectedVideoExercise] = useState<any>(null);

  const {
    exercises,
    categories,
    loadingExercises,
    loadingCategories,
    fetchExercises,
    deleteExercise
  } = useExercises();

  const {
    searchQuery,
    setSearchQuery,
    selectedCategories,
    showFilters,
    setShowFilters,
    filteredExercises,
    handleCategoryToggle,
    resetFilters,
    activeFiltersCount
  } = useExerciseFilters(exercises);

  const handleVideoClick = (exercise: Exercise) => {
    const videoExercise = {
      id: exercise.id,
      exercises: {
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        video_url: exercise.video_url
      }
    };
    setSelectedVideoExercise(videoExercise);
    setIsVideoDialogOpen(true);
  };

  const handleEditExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsEditDialogOpen(true);
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
          <ExercisesFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            categories={categories}
            loadingCategories={loadingCategories}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onResetFilters={resetFilters}
            activeFiltersCount={activeFiltersCount}
          />

          <ExercisesTable
            exercises={filteredExercises}
            loadingExercises={loadingExercises}
            searchQuery={searchQuery}
            activeFiltersCount={activeFiltersCount}
            onEditExercise={handleEditExercise}
            onDeleteExercise={deleteExercise}
            onVideoClick={handleVideoClick}
          />
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

      <ExerciseVideoDialog
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        exercise={selectedVideoExercise}
      />
    </div>
  );
};

export default Exercises;
