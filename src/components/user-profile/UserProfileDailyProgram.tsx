
import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Dumbbell, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { el } from "date-fns/locale";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { workoutStatusService } from "@/hooks/useWorkoutCompletions/workoutStatusService";

interface UserProfileDailyProgramProps {
  userProfile: any;
}

export const UserProfileDailyProgram: React.FC<UserProfileDailyProgramProps> = ({ userProfile }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  
  const { data: activePrograms, isLoading } = useActivePrograms();
  const { getAllWorkoutCompletions } = useWorkoutCompletionsCache();

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

  const getDateStatus = (date: Date) => {
    const dayProgram = getDayProgram(date);
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

  // Calculate monthly stats
  const calculateMonthlyStats = () => {
    const currentMonth = new Date();
    const monthStr = format(currentMonth, 'yyyy-MM');
    
    // Βρες όλες τις προπονήσεις του μήνα από τα training dates
    let allMonthlyWorkouts = 0;
    let completedCount = 0;
    let missedCount = 0;
    
    for (const program of userPrograms) {
      if (!program.training_dates) continue;
      
      const monthlyDates = program.training_dates.filter(date => 
        date && date.startsWith(monthStr)
      );
      
      for (const date of monthlyDates) {
        allMonthlyWorkouts++;
        
        const completion = workoutCompletions.find(c => 
          c.assignment_id === program.id && c.scheduled_date === date
        );
        
        if (completion?.status === 'completed') {
          completedCount++;
        } else {
          // Έλεγχος αν έχει περάσει η ημερομηνία
          const workoutDate = new Date(date);
          const today = new Date();
          const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          if (isPast || completion?.status === 'missed') {
            missedCount++;
          }
        }
      }
    }

    return { 
      completed: completedCount, 
      missed: missedCount, 
      total: allMonthlyWorkouts 
    };
  };

  const monthlyStats = calculateMonthlyStats();

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
      {/* Monthly Stats Card */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Στατιστικά Μήνα - {userProfile?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#00ffba]">{monthlyStats.completed}</div>
              <div className="text-sm text-gray-600">Ολοκληρωμένες</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">{monthlyStats.missed}</div>
              <div className="text-sm text-gray-600">Χαμένες</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">{monthlyStats.total}</div>
              <div className="text-sm text-gray-600">Συνολικές</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Ημερολόγιο Προπονήσεων - {userProfile?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
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
                  missed: (date) => getDateStatus(date) === 'missed'
                }}
                modifiersStyles={{
                  scheduled: { backgroundColor: '#fef3c7', color: '#92400e' },
                  completed: { backgroundColor: '#d1fae5', color: '#065f46' },
                  missed: { backgroundColor: '#fee2e2', color: '#991b1b' }
                }}
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy', { locale: el }) : 'Επιλέξτε ημερομηνία'}
              </h3>
              
              {selectedDate && getDayProgram(selectedDate) ? (
                <div className="space-y-3">
                  <Badge 
                    variant={getDateStatus(selectedDate) === 'completed' ? "default" : "secondary"} 
                    className={`rounded-none ${
                      getDateStatus(selectedDate) === 'completed' ? 'bg-[#00ffba] text-black' :
                      getDateStatus(selectedDate) === 'missed' ? 'bg-red-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}
                  >
                    {getDateStatus(selectedDate) === 'completed' ? 'Ολοκληρωμένη' :
                     getDateStatus(selectedDate) === 'missed' ? 'Χαμένη' :
                     'Προγραμματισμένη'}
                  </Badge>
                  
                  <div className="bg-gray-50 p-4 rounded-none">
                    <div className="flex items-center gap-2 mb-2">
                      <Dumbbell className="h-4 w-4" />
                      <span className="font-medium">
                        {getDayProgram(selectedDate)?.program.programs?.name}
                      </span>
                    </div>
                    
                    <Button 
                      onClick={() => setIsDayDialogOpen(true)}
                      className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
                    >
                      Προβολή Προπόνησης
                    </Button>
                  </div>
                </div>
              ) : selectedDate ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarDays className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Δεν υπάρχει πρόγραμμα για αυτή την ημέρα</p>
                </div>
              ) : null}
            </div>
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
