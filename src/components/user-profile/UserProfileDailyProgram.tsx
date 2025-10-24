
import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Dumbbell, Clock, Eye } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { el } from "date-fns/locale";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { workoutStatusService } from "@/hooks/useWorkoutCompletions/workoutStatusService";
import { useUserBookings } from "@/hooks/useUserBookings";
import { WorkoutStatsTabsSection } from "./WorkoutStatsTabsSection";
import { TrainingTypesPieChart } from "./TrainingTypesPieChart";

interface UserProfileDailyProgramProps {
  userProfile: any;
}

export const UserProfileDailyProgram: React.FC<UserProfileDailyProgramProps> = ({ userProfile }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  
  const { data: activePrograms, isLoading } = useActivePrograms();
  const { getAllWorkoutCompletions } = useWorkoutCompletionsCache();
  const { bookings } = useUserBookings();

  // Filter programs for the specific user
  const userPrograms = activePrograms?.filter(program => 
    program.user_id === userProfile?.id
  ) || [];

  // Fetch workout completions and check for missed workouts
  useEffect(() => {
    const loadCompletions = async () => {
      if (userPrograms.length > 0) {
        try {
          await workoutStatusService.markMissedWorkoutsForPastDates();
          console.log('✅ Missed workouts check completed for user:', userProfile?.name);
        } catch (error) {
          console.error('❌ Error checking missed workouts for user:', error);
        }

        const allCompletions = await getAllWorkoutCompletions();
        const userAssignmentIds = userPrograms.map(p => p.id);
        const userCompletions = allCompletions.filter(c => userAssignmentIds.includes(c.assignment_id));
        setWorkoutCompletions(userCompletions);
      }
    };
    loadCompletions();
  }, [userPrograms.length, userProfile.id, getAllWorkoutCompletions]);

  // ΚΥΡΙΑ ΔΙΟΡΘΩΣΗ: Απλή και σωστή λογική εύρεσης προγράμματος ημέρας
  const getDayProgram = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    console.log('🔍 UserProfile getDayProgram:', { dateStr, userProgramsCount: userPrograms.length });
    
    for (const program of userPrograms) {
      if (!program.training_dates) continue;
      
      const dateIndex = program.training_dates.findIndex(d => d === dateStr);
      if (dateIndex === -1) continue;

      console.log('📅 Found date in program:', program.programs?.name, 'at index:', dateIndex);

      const weeks = program.programs?.program_weeks || [];
      if (weeks.length === 0) continue;

      // Βρίσκουμε τη συνολική ημέρα στο πρόγραμμα
      let targetDay = null;
      let currentDayCount = 0;

      for (const week of weeks) {
        const daysInWeek = week.program_days?.length || 0;
        
        if (dateIndex >= currentDayCount && dateIndex < currentDayCount + daysInWeek) {
          const dayIndexInWeek = dateIndex - currentDayCount;
          targetDay = week.program_days?.[dayIndexInWeek] || null;
          
          console.log('✅ Found target day:', {
            weekName: week.name,
            dayName: targetDay?.name,
            dayIndexInWeek,
            currentDayCount
          });
          break;
        }
        
        currentDayCount += daysInWeek;
      }

      if (targetDay) {
        const completion = workoutCompletions.find(c => 
          c.assignment_id === program.id && 
          c.scheduled_date === dateStr
        );
        
        return {
          program,
          dateIndex,
          targetDay,
          isCompleted: completion?.status === 'completed',
          status: completion?.status || 'scheduled'
        };
      }
    }
    return null;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const dayProgram = getDayProgram(date);
      if (dayProgram) {
        setIsDayDialogOpen(true);
      }
    }
  };

  const selectedProgram = selectedDate ? getDayProgram(selectedDate)?.program : null;
  const workoutStatus = selectedDate && selectedProgram ? 
    (getDayProgram(selectedDate)?.status || 'scheduled') : 
    'no_workout';

  const getBookingStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBookings = bookings.filter(booking => booking.booking_date === dateStr);
    
    if (dayBookings.length === 0) return null;
    
    // Check if any booking has attendance status
    const completedBooking = dayBookings.find(b => (b as any).attendance_status === 'completed');
    const missedBooking = dayBookings.find(b => (b as any).attendance_status === 'missed');
    
    if (completedBooking) return 'booking_completed';
    if (missedBooking) return 'booking_missed';
    
    // Check if booking is past and no attendance recorded
    const today = new Date();
    const bookingDate = new Date(date);
    const isPast = bookingDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (isPast) return 'booking_missed';
    
    return 'booking_scheduled';
  };

  const getDateStatus = (date: Date) => {
    const dayProgram = getDayProgram(date);
    const bookingStatus = getBookingStatus(date);
    
    // If there's a booking, prioritize booking status
    if (bookingStatus) {
      return bookingStatus;
    }
    
    if (!dayProgram) return null;
    
    // Έλεγχος αν έχει περάσει η ημερομηνία και δεν έχει ολοκληρωθεί
    const today = new Date();
    const workoutDate = new Date(date);
    const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Αν έχει status από completion record, χρησιμοποίησε αυτό
    if (dayProgram.status === 'completed') {
      return 'completed';
    } else if (dayProgram.status === 'missed') {
      return 'missed';
    } else if (isPast && dayProgram.status !== 'completed') {
      // Αν έχει περάσει η ημερομηνία και δεν έχει ολοκληρωθεί → missed
      return 'missed';
    } else {
      // Μελλοντική ή σημερινή προπόνηση που δεν έχει ολοκληρωθεί
      return 'scheduled';
    }
  };

  const handleRefresh = async () => {
    const allCompletions = await getAllWorkoutCompletions();
    const userAssignmentIds = userPrograms.map(p => p.id);
    const userCompletions = allCompletions.filter(c => userAssignmentIds.includes(c.assignment_id));
    setWorkoutCompletions(userCompletions);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Φόρτωση ημερολογίου...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workout Stats Section */}
      <WorkoutStatsTabsSection userId={userProfile?.id} />

      {/* Training Types Pie Chart */}
      <TrainingTypesPieChart userId={userProfile?.id} hideTimeTabs={true} />

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <CalendarDays className="h-4 w-4 md:h-5 md:w-5" />
            Ημερολόγιο Προπονήσεων - {userProfile?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={el}
              className="rounded-none border"
              modifiers={{
                scheduled: (date) => getDateStatus(date) === 'scheduled',
                completed: (date) => getDateStatus(date) === 'completed',
                missed: (date) => getDateStatus(date) === 'missed',
                booking_scheduled: (date) => getDateStatus(date) === 'booking_scheduled',
                booking_completed: (date) => getDateStatus(date) === 'booking_completed',
                booking_missed: (date) => getDateStatus(date) === 'booking_missed'
              }}
              modifiersStyles={{
                scheduled: { backgroundColor: '#fef3c7', color: '#92400e' },
                completed: { backgroundColor: '#d1fae5', color: '#065f46' },
                missed: { backgroundColor: '#fee2e2', color: '#991b1b' },
                booking_scheduled: { backgroundColor: '#dbeafe', color: '#1e40af' },
                booking_completed: { backgroundColor: '#00ffba', color: '#000000' },
                booking_missed: { backgroundColor: '#fecaca', color: '#dc2626' }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {selectedProgram && selectedDate && (
        <DayProgramDialog
          isOpen={isDayDialogOpen}
          onClose={() => setIsDayDialogOpen(false)}
          program={selectedProgram}
          selectedDate={selectedDate}
          workoutStatus={workoutStatus}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};
