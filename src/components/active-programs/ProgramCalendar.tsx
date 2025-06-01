
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProgramCalendarProps {
  programs: EnrichedAssignment[];
}

interface ProgramScheduling {
  programId: string;
  programName: string;
  totalDays: number;
  scheduledDays: { [key: string]: number }; // date string -> day number
}

export const ProgramCalendar: React.FC<ProgramCalendarProps> = ({ programs }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedulingProgram, setSchedulingProgram] = useState<ProgramScheduling | null>(null);
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);

  useEffect(() => {
    fetchAvailablePrograms();
    
    // Check if we came from program builder
    const urlParams = new URLSearchParams(window.location.search);
    const programId = urlParams.get('programId');
    if (programId) {
      initializeProgramScheduling(programId);
    }
  }, []);

  const fetchAvailablePrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('program_assignments')
        .select(`
          program_id,
          programs!fk_program_assignments_program_id(
            id, name, 
            program_weeks(
              id,
              program_days(id)
            )
          )
        `)
        .eq('status', 'active')
        .is('start_date', null);

      if (error) throw error;

      const programsNeedingScheduling = data?.map(assignment => {
        const program = assignment.programs;
        if (!program) return null;
        
        const totalDays = program.program_weeks?.reduce((total: number, week: any) => {
          return total + (week.program_days?.length || 0);
        }, 0) || 0;

        return {
          id: program.id,
          name: program.name,
          totalDays
        };
      }).filter(Boolean) || [];

      setAvailablePrograms(programsNeedingScheduling);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const initializeProgramScheduling = async (programId: string) => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          id, name,
          program_weeks(
            id,
            program_days(id)
          )
        `)
        .eq('id', programId)
        .single();

      if (error) throw error;

      const totalDays = data.program_weeks?.reduce((total: number, week: any) => {
        return total + (week.program_days?.length || 0);
      }, 0) || 0;

      setSchedulingProgram({
        programId: data.id,
        programName: data.name,
        totalDays,
        scheduledDays: {}
      });

      // Clear URL parameters
      window.history.replaceState({}, '', '/dashboard/active-programs?tab=calendar');
    } catch (error) {
      console.error('Error initializing program scheduling:', error);
    }
  };

  const handleProgramSelect = (programId: string) => {
    const program = availablePrograms.find(p => p.id === programId);
    if (program) {
      setSchedulingProgram({
        programId: program.id,
        programName: program.name,
        totalDays: program.totalDays,
        scheduledDays: {}
      });
    }
  };

  const handleDateClick = (day: number) => {
    if (!schedulingProgram) return;

    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = clickedDate.toISOString().split('T')[0];
    
    const scheduledDaysCount = Object.keys(schedulingProgram.scheduledDays).length;
    
    if (schedulingProgram.scheduledDays[dateString]) {
      // Remove this day
      const newScheduledDays = { ...schedulingProgram.scheduledDays };
      delete newScheduledDays[dateString];
      
      setSchedulingProgram({
        ...schedulingProgram,
        scheduledDays: newScheduledDays
      });
    } else {
      // Add this day if we haven't reached the limit
      if (scheduledDaysCount < schedulingProgram.totalDays) {
        setSchedulingProgram({
          ...schedulingProgram,
          scheduledDays: {
            ...schedulingProgram.scheduledDays,
            [dateString]: scheduledDaysCount + 1
          }
        });
      } else {
        toast.error(`Έχετε ήδη επιλέξει όλες τις ${schedulingProgram.totalDays} ημέρες`);
      }
    }
  };

  const saveSchedule = async () => {
    if (!schedulingProgram) return;

    const scheduledDates = Object.keys(schedulingProgram.scheduledDays);
    if (scheduledDates.length !== schedulingProgram.totalDays) {
      toast.error(`Πρέπει να επιλέξετε όλες τις ${schedulingProgram.totalDays} ημέρες`);
      return;
    }

    try {
      const startDate = scheduledDates.sort()[0];
      const endDate = scheduledDates.sort()[scheduledDates.length - 1];

      const { error } = await supabase
        .from('program_assignments')
        .update({
          start_date: startDate,
          end_date: endDate,
          updated_at: new Date().toISOString()
        })
        .eq('program_id', schedulingProgram.programId);

      if (error) throw error;

      toast.success('Το πρόγραμμα προγραμματίστηκε επιτυχώς!');
      setSchedulingProgram(null);
      fetchAvailablePrograms();
      
      // Refresh the page to show updated programs
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του προγραμματισμού');
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getProgramsForDate = (day: number) => {
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    return programs.filter(assignment => {
      if (!assignment.start_date) return false;
      
      const startDate = new Date(assignment.start_date);
      const endDate = assignment.end_date ? new Date(assignment.end_date) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      return dateToCheck >= startDate && dateToCheck <= endDate;
    });
  };

  const isDateScheduled = (day: number) => {
    if (!schedulingProgram) return false;
    const dateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return schedulingProgram.scheduledDays[dateString];
  };

  const getScheduledDayNumber = (day: number) => {
    if (!schedulingProgram) return null;
    const dateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return schedulingProgram.scheduledDays[dateString];
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthNames = [
    'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
    'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
  ];
  const dayNames = ['Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ', 'Κυρ'];

  return (
    <div className="space-y-4">
      {/* Program Selection */}
      {!schedulingProgram && availablePrograms.length > 0 && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Προγραμματισμός Νέου Προγράμματος</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Επιλέξτε πρόγραμμα για προγραμματισμό</Label>
                <Select onValueChange={handleProgramSelect}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επιλέξτε πρόγραμμα..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrograms.map(program => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name} ({program.totalDays} ημέρες)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduling Interface */}
      {schedulingProgram && (
        <Card className="rounded-none border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-700">
              Προγραμματισμός: {schedulingProgram.programName}
            </CardTitle>
            <p className="text-sm text-blue-600">
              Επιλέξτε {schedulingProgram.totalDays} ημερομηνίες για τις ημέρες προπόνησης.
              Επιλεγμένες: {Object.keys(schedulingProgram.scheduledDays).length}/{schedulingProgram.totalDays}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={saveSchedule} className="rounded-none">
                Αποθήκευση Προγραμματισμού
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSchedulingProgram(null)}
                className="rounded-none"
              >
                Ακύρωση
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <Card className="rounded-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Ημερολόγιο Προγραμμάτων
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="rounded-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium min-w-[120px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="rounded-none"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center font-medium text-sm border-b">
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDay }).map((_, index) => (
              <div key={`empty-${index}`} className="p-2 h-24" />
            ))}
            
            {/* Calendar days */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const programsForDay = getProgramsForDate(day);
              const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
              const isScheduled = isDateScheduled(day);
              const scheduledDayNumber = getScheduledDayNumber(day);
              
              return (
                <div
                  key={day}
                  className={`p-1 h-24 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    isToday ? 'bg-blue-50' : ''
                  } ${
                    isScheduled ? 'bg-green-100 border-green-300' : ''
                  } ${
                    schedulingProgram ? 'hover:bg-green-50' : ''
                  }`}
                  onClick={() => schedulingProgram && handleDateClick(day)}
                >
                  <div className={`text-sm font-medium mb-1 flex items-center justify-between ${
                    isToday ? 'text-blue-600' : ''
                  }`}>
                    <span>{day}</span>
                    {isScheduled && (
                      <Badge variant="secondary" className="text-xs rounded-none bg-green-200">
                        Μ{scheduledDayNumber}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    {programsForDay.slice(0, 2).map(assignment => (
                      <Badge 
                        key={assignment.id} 
                        variant="secondary" 
                        className="text-xs rounded-none block truncate"
                        title={assignment.programs?.name || 'Άγνωστο Πρόγραμμα'}
                      >
                        {assignment.programs?.name || 'Πρόγραμμα'}
                      </Badge>
                    ))}
                    {programsForDay.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{programsForDay.length - 2} ακόμη
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {programs.length === 0 && !schedulingProgram && availablePrograms.length === 0 && (
        <Card className="rounded-none">
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Δεν έχετε ενεργά προγράμματα</p>
              <p className="text-sm">Επικοινωνήστε με τον προπονητή σας για ανάθεση προγράμματος</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
