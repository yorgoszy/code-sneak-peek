import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { CalendarGrid } from "@/components/active-programs/calendar/CalendarGrid";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const CalendarWidget = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [realtimeKey, setRealtimeKey] = useState(0);
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);

  const { data: activePrograms, isLoading: programsLoading } = useActivePrograms();
  const { getAllWorkoutCompletions } = useWorkoutCompletionsCache();

  // Filter programs for the current user
  const userPrograms = activePrograms?.filter(program => 
    program.user_id === user?.id
  ) || [];

  // Load workout completions
  useEffect(() => {
    const loadCompletions = async () => {
      if (userPrograms.length > 0 && user?.id) {
        const allCompletions = await getAllWorkoutCompletions();
        const userAssignmentIds = userPrograms.map(p => p.id);
        const userCompletions = allCompletions.filter(c => userAssignmentIds.includes(c.assignment_id));
        setWorkoutCompletions(userCompletions);
      }
    };
    loadCompletions();
  }, [userPrograms.length, user?.id, getAllWorkoutCompletions]);

  const handleRefresh = () => {
    setRealtimeKey(prev => prev + 1);
  };

  if (authLoading || programsLoading) {
    return <CustomLoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-7xl mx-auto rounded-none">
        <div className="p-4 sm:p-6 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-[#00ffba]" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Ημερολόγιο Προπονήσεων
            </h1>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {userPrograms.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg">
                Δεν υπάρχουν ενεργά προγράμματα
              </p>
            </div>
          ) : (
            <CalendarGrid
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              activePrograms={userPrograms}
              workoutCompletions={workoutCompletions}
              realtimeKey={realtimeKey}
              onNameClick={() => {}} // Disabled navigation
              onRefresh={handleRefresh}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default CalendarWidget;
