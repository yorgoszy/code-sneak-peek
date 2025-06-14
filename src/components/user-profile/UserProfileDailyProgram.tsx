import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { CalendarGrid } from "@/components/active-programs/calendar/CalendarGrid";
import { ProgramsForDateCard } from "@/components/active-programs/calendar/ProgramsForDateCard";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { DatabaseDebugger } from "@/components/debug/DatabaseDebugger";
import { format } from "date-fns";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserMonthlyView } from "./UserMonthlyView";

interface UserProfileDailyProgramProps {
  userProfile: any;
}

export const UserProfileDailyProgram: React.FC<UserProfileDailyProgramProps> = ({ userProfile }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [realtimeKey, setRealtimeKey] = useState(0);
  const [showDebugger, setShowDebugger] = useState(false);
  
  // Dialog states - μόνο το DayProgramDialog
  const [selectedProgram, setSelectedProgram] = useState<EnrichedAssignment | null>(null);
  const [dayProgramOpen, setDayProgramOpen] = useState(false);

  // Fetch all active programs and filter for this user
  const { data: allActivePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const { getAllWorkoutCompletions } = useWorkoutCompletionsCache();

  // Filter programs for the specific user
  const userPrograms = allActivePrograms.filter(program => program.user_id === userProfile.id);

  // Get workout completions for user programs
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);

  useEffect(() => {
    const loadCompletions = async () => {
      if (userPrograms.length > 0) {
        const allCompletions = await getAllWorkoutCompletions();
        // Filter completions for this user's assignments
        const userAssignmentIds = userPrograms.map(p => p.id);
        const userCompletions = allCompletions.filter(c => userAssignmentIds.includes(c.assignment_id));
        setWorkoutCompletions(userCompletions);
      }
    };
    loadCompletions();
  }, [userPrograms, getAllWorkoutCompletions]);

  // Σταθερή λίστα ημερών & ονομάτων για το ημερολόγιο (όπως στο ActivePrograms)
  const weekDays = ['Δευ', 'Τρ', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];
  // balance the month grid for display
  const firstProgramDate = userPrograms[0]?.training_dates?.[0];
  const currentDate = currentMonth;
  const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const days: Date[] = [];
  for (let i = 1; i <= end.getDate(); i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  // Συλλέγουμε όλες τις ημερομηνίες με προγράμματα και status για το ημερολόγιο
  const programDatesWithStatus = userPrograms.flatMap((assignment) =>
    (assignment.training_dates || []).map((dateStr: string) => ({
      date: dateStr,
      status: getWorkoutStatusForDate(assignment.id, dateStr),
      assignmentId: assignment.id,
      userName: userProfile.name,
      assignment
    }))
  );

  const programsForSelectedDate = selectedDate 
    ? userPrograms.filter(assignment => {
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        return assignment.training_dates?.includes(selectedDateStr);
      })
    : [];

  const getWorkoutStatusForDate = (assignmentId: string, dateStr: string) => {
    const completion = workoutCompletions.find(c => 
      c.assignment_id === assignmentId && c.scheduled_date === dateStr
    );
    return completion?.status || 'scheduled';
  };

  // Νέα συνάρτηση για χειρισμό κλικ σε όνομα χρήστη - ανοίγει το DayProgramDialog
  const handleNameClick = (program: any, event: React.MouseEvent) => {
    event.stopPropagation();
    const assignment = userPrograms.find(p => p.id === program.assignmentId);
    if (assignment) {
      setSelectedProgram(assignment);
      // Χρησιμοποιούμε την ημερομηνία από το program object
      const programDate = new Date(program.date);
      setSelectedDate(programDate);
      setDayProgramOpen(true);
    }
  };

  const handleRefresh = () => {
    refetch();
    setRealtimeKey(prev => prev + 1);
  };

  const handleDelete = async (assignmentId: string) => {
    // This would typically not be allowed for regular users
    console.log('Delete not allowed for user profiles');
  };

  if (isLoading) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Ημερολόγιο Προπονήσεων
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Φόρτωση ημερολογίου...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Ημερολόγιο Προπονήσεων
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            Σφάλμα κατά τη φόρτωση του ημερολογίου
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userPrograms.length === 0) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Ημερολόγιο Προπονήσεων
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Δεν υπάρχουν προγράμματα για αυτόν τον χρήστη</p>
            <p className="text-sm">Αναθέστε ένα πρόγραμμα για να εμφανιστεί στο ημερολόγιο</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Ημερολόγιο Προπονήσεων - {userProfile.name}
            </span>
            <button 
              onClick={() => setShowDebugger(!showDebugger)}
              className="text-xs bg-gray-200 px-2 py-1 rounded"
            >
              {showDebugger ? 'Απόκρυψη Debug' : 'Debug Video URLs'}
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showDebugger && <DatabaseDebugger />}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <UserMonthlyView
                weekDays={weekDays}
                days={days}
                programDatesWithStatus={programDatesWithStatus}
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                setCurrentMonth={setCurrentMonth}
                onDateClick={setSelectedDate}
                onUserNameClick={handleNameClick}
                onDayNumberClick={setSelectedDate}
                realtimeKey={realtimeKey}
                internalRealtimeKey={0}
              />
            </div>
            
            <div className="lg:col-span-1 space-y-4">
              <ProgramsForDateCard
                selectedDate={selectedDate}
                programsForSelectedDate={programsForSelectedDate}
                onRefresh={handleRefresh}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Μόνο το DayProgramDialog */}
      <DayProgramDialog
        isOpen={dayProgramOpen}
        onClose={() => setDayProgramOpen(false)}
        program={selectedProgram}
        selectedDate={selectedDate}
        workoutStatus={selectedProgram && selectedDate ? 
          getWorkoutStatusForDate(selectedProgram.id, format(selectedDate, 'yyyy-MM-dd')) : 'scheduled'
        }
        onRefresh={handleRefresh}
      />
    </div>
  );
};
