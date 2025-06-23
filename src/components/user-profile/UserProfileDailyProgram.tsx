
import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Dumbbell, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { el } from "date-fns/locale";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";

interface UserProfileDailyProgramProps {
  userProfile: any;
}

export const UserProfileDailyProgram: React.FC<UserProfileDailyProgramProps> = ({ userProfile }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  
  const { data: activePrograms, isLoading } = useActivePrograms();
  const { getWorkoutCompletions } = useWorkoutCompletions();

  const getTrainingDates = (program: any) => {
    if (!program || !program.start_date || !program.end_date) {
      return [];
    }
  
    const startDate = new Date(program.start_date);
    const endDate = new Date(program.end_date);
  
    // Δημιουργία πίνακα με όλες τις ημέρες μεταξύ start_date και end_date
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
    // Φιλτράρισμα των ημερών με βάση το training_frequency
    const trainingDays = allDays.filter((date, index) => {
      const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
      return program.training_frequency && program.training_frequency.includes(dayOfWeek);
    });
  
    return trainingDays.map(date => format(date, 'yyyy-MM-dd'));
  };
  
  React.useEffect(() => {
    if (activePrograms) {
      activePrograms.forEach(program => {
        program.training_dates = getTrainingDates(program);
      });
    }
  }, [activePrograms]);
  
  const userPrograms = activePrograms?.filter(program => 
    program.user_id === userProfile?.id
  ) || [];

  const [completions, setCompletions] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchCompletions = async () => {
      if (userPrograms.length === 0) return;
      
      try {
        const allCompletions = await Promise.all(
          userPrograms.map(program => getWorkoutCompletions(program.id))
        );
        setCompletions(allCompletions.flat());
      } catch (error) {
        console.error('Error fetching completions:', error);
      }
    };

    fetchCompletions();
  }, [userPrograms, getWorkoutCompletions]);

  const getDayProgram = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    for (const program of userPrograms) {
      if (!program.training_dates) continue;
      
      const dateIndex = program.training_dates.findIndex(d => d === dateStr);
      if (dateIndex >= 0) {
        return {
          program,
          dateIndex,
          isCompleted: completions.some(c => 
            c.assignment_id === program.id && 
            c.scheduled_date === dateStr && 
            c.status === 'completed'
          )
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
    (getDayProgram(selectedDate)?.isCompleted ? 'completed' : 'scheduled') : 
    'no_workout';

  const getDateStatus = (date: Date) => {
    const dayProgram = getDayProgram(date);
    if (!dayProgram) return null;
    
    return dayProgram.isCompleted ? 'completed' : 'scheduled';
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
                  scheduled: (date) => getDateStatus(date) === 'scheduled',
                  completed: (date) => getDateStatus(date) === 'completed'
                }}
                modifiersStyles={{
                  scheduled: { backgroundColor: '#fef3c7', color: '#92400e' },
                  completed: { backgroundColor: '#d1fae5', color: '#065f46' }
                }}
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy', { locale: el }) : 'Επιλέξτε ημερομηνία'}
              </h3>
              
              {selectedDate && getDayProgram(selectedDate) ? (
                <div className="space-y-3">
                  <Badge variant={getDayProgram(selectedDate)?.isCompleted ? "default" : "secondary"} className="rounded-none">
                    {getDayProgram(selectedDate)?.isCompleted ? 'Ολοκληρωμένη' : 'Προγραμματισμένη'}
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
                  <p>Δεν υπάρχει προγραμματισμένη προπόνηση</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Επιλέξτε μια ημερομηνία για να δείτε τις προπονήσεις</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <DayProgramDialog
        isOpen={isDayDialogOpen}
        onClose={() => setIsDayDialogOpen(false)}
        program={selectedProgram}
        selectedDate={selectedDate || null}
        workoutStatus={workoutStatus}
        onRefresh={() => {
          // Refresh completions
          const fetchCompletions = async () => {
            if (userPrograms.length === 0) return;
            
            try {
              const allCompletions = await Promise.all(
                userPrograms.map(program => getWorkoutCompletions(program.id))
              );
              setCompletions(allCompletions.flat());
            } catch (error) {
              console.error('Error fetching completions:', error);
            }
          };
          fetchCompletions();
        }}
      />
    </div>
  );
};
