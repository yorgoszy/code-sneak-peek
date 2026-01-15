
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { TodaysProgramsCard } from "./TodaysProgramsCard";
import { UpcomingTestsCard } from "./UpcomingTestsCard";
import { AllUpcomingTestsCard } from "./AllUpcomingTestsCard";
import { AllUpcomingCompetitionsCard } from "./AllUpcomingCompetitionsCard";
import { QuickActions } from "@/components/QuickActions";
import { RecentActivity } from "@/components/RecentActivity";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { formatDateToLocalString } from "@/utils/dateUtils";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";

interface DashboardContentProps {
  isAdmin: boolean;
  userProfile: any;
}

export const DashboardContent = ({ isAdmin, userProfile }: DashboardContentProps) => {
  const isMobile = useIsMobile();
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  
  // Για Admin: περνάμε null ώστε να φέρει assignments χωρίς coach_id
  // Για Coach: περνάμε το userProfile.id ώστε να φέρει μόνο τα δικά του
  const coachIdFilter = isAdmin ? null : userProfile?.id;
  const { data: activePrograms = [], refetch } = useActivePrograms(coachIdFilter, isAdmin);
  const { getWorkoutCompletions } = useWorkoutCompletions();
  
  // Σημερινή ημερομηνία
  const today = new Date();
  const todayString = formatDateToLocalString(today);
  
  // Φιλτράρουμε τα προγράμματα που έχουν προπόνηση σήμερα
  const todaysPrograms = activePrograms.filter(assignment => {
    if (!assignment.training_dates) return false;
    return assignment.training_dates.includes(todayString);
  });
  
  // Φόρτωση workout completions
  const loadCompletions = useCallback(async () => {
    if (activePrograms.length === 0) return;
    
    try {
      const allCompletions = [];
      for (const assignment of activePrograms) {
        const completions = await getWorkoutCompletions(assignment.id);
        allCompletions.push(...completions);
      }
      setWorkoutCompletions(allCompletions);
    } catch (error) {
      console.error('Error loading workout completions:', error);
    }
  }, [activePrograms, getWorkoutCompletions]);

  useEffect(() => {
    loadCompletions();
  }, [loadCompletions]);
  
  const handleProgramClick = (assignment: any) => {
    setSelectedProgram(assignment);
    setIsDayDialogOpen(true);
  };

  const handleRefresh = () => {
    refetch();
    loadCompletions();
  };

  const getWorkoutStatus = (assignment: any) => {
    const completion = workoutCompletions.find(c => 
      c.assignment_id === assignment.id && c.scheduled_date === todayString
    );
    return completion?.status || 'scheduled';
  };

  return (
    <>
      <div className={`grid gap-4 md:gap-6 ${
        isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'
      }`}>
        {/* Col 1: Σημερινά Προγράμματα (+ εβδομαδιαία τεστ) */}
        <div className="space-y-4 md:space-y-6">
          <TodaysProgramsCard 
            todaysPrograms={todaysPrograms}
            allCompletions={workoutCompletions}
            onRefresh={handleRefresh}
            onProgramClick={handleProgramClick}
          />
          {isAdmin && <UpcomingTestsCard />}
        </div>

        {/* Col 2: Επερχόμενα Τεστ */}
        {isAdmin && (
          <div className="space-y-4 md:space-y-6">
            <AllUpcomingTestsCard />
          </div>
        )}

        {/* Col 3: Επερχόμενοι Αγώνες */}
        {isAdmin && (
          <div className="space-y-4 md:space-y-6">
            <AllUpcomingCompetitionsCard />
          </div>
        )}
        
        {/* Row 2 - Col 1: Recent Activity */}
        <div className="space-y-4 md:space-y-6">
          <RecentActivity />
        </div>

        {/* Row 2 - Col 2: Quick Actions */}
        <div className="space-y-4 md:space-y-6">
          {isAdmin && <QuickActions />}
        </div>
      </div>

      {/* Day Program Dialog */}
      {selectedProgram && (
        <DayProgramDialog
          isOpen={isDayDialogOpen}
          onClose={() => {
            setIsDayDialogOpen(false);
            setSelectedProgram(null);
          }}
          program={selectedProgram}
          selectedDate={today}
          workoutStatus={getWorkoutStatus(selectedProgram)}
          onRefresh={handleRefresh}
        />
      )}
    </>
  );
};
