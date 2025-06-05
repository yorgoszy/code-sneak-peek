
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { CalendarGrid } from "@/components/active-programs/calendar/CalendarGrid";
import { ProgramsForDateCard } from "@/components/active-programs/calendar/ProgramsForDateCard";
import { ProgramViewDialog } from "@/components/active-programs/calendar/ProgramViewDialog";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { DatabaseDebugger } from "@/components/debug/DatabaseDebugger";
import { format } from "date-fns";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface UserProfileDailyProgramProps {
  userProfile: any;
}

export const UserProfileDailyProgram: React.FC<UserProfileDailyProgramProps> = ({ userProfile }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [realtimeKey, setRealtimeKey] = useState(0);
  const [showDebugger, setShowDebugger] = useState(false);
  
  // Dialog states
  const [selectedProgram, setSelectedProgram] = useState<EnrichedAssignment | null>(null);
  const [programViewOpen, setProgramViewOpen] = useState(false);
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

  const handleNameClick = (program: any, event: React.MouseEvent) => {
    event.stopPropagation();
    const assignment = userPrograms.find(p => p.id === program.assignmentId);
    if (assignment) {
      setSelectedProgram(assignment);
      setProgramViewOpen(true);
    }
  };

  const handleStartWorkout = (weekIndex: number, dayIndex: number) => {
    if (selectedProgram) {
      setSelectedDate(new Date());
      setDayProgramOpen(true);
      setProgramViewOpen(false);
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
              <CalendarGrid
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                activePrograms={userPrograms}
                workoutCompletions={workoutCompletions}
                realtimeKey={realtimeKey}
                onNameClick={handleNameClick}
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

      {/* Dialogs */}
      <ProgramViewDialog
        isOpen={programViewOpen}
        onClose={() => setProgramViewOpen(false)}
        assignment={selectedProgram}
        onStartWorkout={handleStartWorkout}
      />

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
