
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddExerciseDialog } from "@/components/AddExerciseDialog";
import { EditExerciseDialog } from "@/components/EditExerciseDialog";
import { ExercisesTable } from "@/components/exercises/ExercisesTable";
import { ExercisesFilters } from "@/components/exercises/ExercisesFilters";
import { ExercisesActions } from "@/components/exercises/ExercisesActions";
import { useExercises } from "@/hooks/useExercises";
import { useExerciseFilters } from "@/hooks/useExerciseFilters";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoleCheck } from "@/hooks/useRoleCheck";

const Exercises = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const isMobile = useIsMobile();

  const exercisesData = useExercises();
  const filtersData = useExerciseFilters(exercisesData?.exercises || []);

  // Extract data safely
  const exercises = exercisesData?.exercises || [];
  const categories = exercisesData?.categories || [];
  const loadingExercises = exercisesData?.loadingExercises || false;
  const fetchExercises = exercisesData?.fetchExercises || (() => Promise.resolve());

  const searchQuery = filtersData?.searchQuery || '';
  const setSearchQuery = filtersData?.setSearchQuery || (() => {});
  const selectedCategories = filtersData?.selectedCategories || [];
  const filteredExercises = filtersData?.filteredExercises || [];

  useEffect(() => {
    fetchExercises();
  }, []);

  if (loading || rolesLoading) {
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

  if (!isAdmin()) {
    return <Navigate to={`/dashboard/user-profile/${userProfile?.id}`} replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const handleEditExercise = (exercise: any) => {
    setSelectedExercise(exercise);
    setEditDialogOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <AppSidebar />

        <SidebarInset className="flex-1 flex flex-col">
          {/* Top Navigation */}
          <nav className={`bg-white border-b border-gray-200 ${isMobile ? 'px-3 py-3' : 'px-6 py-4'}`}>
            <div className="flex justify-between items-center">
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                {isMobile && <SidebarTrigger />}
                <div className={`${isMobile ? 'min-w-0 flex-1' : ''}`}>
                  <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 ${isMobile ? 'truncate' : ''}`}>
                    Ασκήσεις
                  </h1>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile ? 'truncate' : ''}`}>
                    Διαχείριση τράπεζας ασκήσεων
                  </p>
                </div>
              </div>
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                {!isMobile && (
                  <span className="text-sm text-gray-600">
                    {userProfile?.name || user?.email}
                    {isAdmin() && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
                  </span>
                )}
                <Button 
                  variant="outline" 
                  className={`rounded-none ${isMobile ? 'text-xs px-2' : ''}`}
                  onClick={handleSignOut}
                >
                  <LogOut className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                  {isMobile ? 'Exit' : 'Αποσύνδεση'}
                </Button>
              </div>
            </div>
          </nav>

          {/* Exercises Content */}
          <div className={`flex-1 ${isMobile ? 'p-3' : 'p-6'}`}>
            <Card className="rounded-none">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
                  <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                    Όλες οι Ασκήσεις ({filteredExercises.length})
                  </CardTitle>
                  <Button 
                    className={`rounded-none ${isMobile ? 'text-xs w-full' : ''}`}
                    onClick={() => setAddDialogOpen(true)}
                  >
                    <Plus className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                    Νέα Άσκηση
                  </Button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Αναζήτηση ασκήσεων..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-[#00ffba]"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ExercisesTable 
                  exercises={filteredExercises}
                  isLoading={loadingExercises}
                  onEditExercise={handleEditExercise}
                  onRefreshExercises={fetchExercises}
                  isMobile={isMobile}
                />
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>

      <AddExerciseDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onExerciseAdded={fetchExercises}
      />

      <EditExerciseDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedExercise(null);
        }}
        onExerciseUpdated={fetchExercises}
        exercise={selectedExercise}
      />
    </SidebarProvider>
  );
};

export default Exercises;
