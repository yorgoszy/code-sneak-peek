
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus, Menu, X } from "lucide-react";
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [selectedVideoExercise, setSelectedVideoExercise] = useState<any>(null);

  // Detect mobile/tablet
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileOrTablet(window.innerWidth < 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
      {/* Desktop Sidebar */}
      {!isMobileOrTablet && (
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}

      {/* Mobile/Tablet Sidebar Overlay */}
      {isMobileOrTablet && isMobileSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full z-50">
            <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <nav className="bg-white border-b border-gray-200 px-3 lg:px-4 py-2">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              {/* Mobile Menu Button */}
              {isMobileOrTablet && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                  className="rounded-none h-8 w-8"
                >
                  {isMobileSidebarOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )}
                </Button>
              )}
              <h1 className="text-lg font-bold text-gray-900">Ασκήσεις</h1>
            </div>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="rounded-none h-8 text-xs"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Προσθήκη</span>
              <span className="sm:hidden">Νέα</span>
            </Button>
          </div>
        </nav>

        <div className="flex-1 p-3 lg:p-4 overflow-auto">
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
