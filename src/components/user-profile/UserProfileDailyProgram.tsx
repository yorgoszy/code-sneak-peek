
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

  // Fetch workout completions
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
  }, [userPrograms.length, userProfile.id, getAllWorkoutCompletions]);

  const getDayProgram = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    for (const program of userPrograms) {
      if (!program.training_dates) continue;
      
      const dateIndex = program.training_dates.findIndex(d => d === dateStr);
      if (dateIndex >= 0) {
        const completion = workoutCompletions.find(c => 
          c.assignment_id === program.id && 
          c.scheduled_date === dateStr
        );
        
        return {
          program,
          dateIndex,
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
    
    return dayProgram.status;
  };

  const handleRefresh = async () => {
    // Reload completions after workout completion
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
                  scheduled: (date) => getDateStatus(date) === 'scheduled' || getDateStatus(date) === 'pending',
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
                    variant={getDayProgram(selectedDate)?.isCompleted ? "default" : "secondary"} 
                    className={`rounded-none ${
                      getDayProgram(selectedDate)?.status === 'completed' ? 'bg-[#00ffba] text-black' :
                      getDayProgram(selectedDate)?.status === 'missed' ? 'bg-red-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}
                  >
                    {getDayProgram(selectedDate)?.status === 'completed' ? 'Ολοκληρωμένη' :
                     getDayProgram(selectedDate)?.status === 'missed' ? 'Χαμένη' :
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
