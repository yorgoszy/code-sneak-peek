
import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ActiveProgramsSidebar } from "@/components/active-programs/ActiveProgramsSidebar";
import { useNavigate } from "react-router-dom";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { ProgramCard } from "@/components/active-programs/ProgramCard";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { supabase } from "@/integrations/supabase/client";

const ActivePrograms = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  const navigate = useNavigate();

  // Χρησιμοποιούμε το hook για τα ενεργά προγράμματα από τη βάση
  const { data: activePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const { getWorkoutCompletions } = useWorkoutCompletions();

  // Φιλτράρουμε τα προγράμματα για την επιλεγμένη ημερομηνία
  const programsForSelectedDate = activePrograms.filter(assignment => {
    if (!selectedDate || !assignment.training_dates) return false;
    
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return assignment.training_dates.includes(selectedDateStr);
  });

  // Φόρτωση workout completions για όλα τα assignments
  useEffect(() => {
    const loadCompletions = async () => {
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
    };

    loadCompletions();
  }, [activePrograms, getWorkoutCompletions]);

  // Realtime subscription για workout_completions με άμεση ενημέρωση
  useEffect(() => {
    console.log('🔄 Setting up realtime subscription for workout completions...');
    
    const channel = supabase
      .channel('workout-completions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_completions'
        },
        (payload) => {
          console.log('✅ Workout completion change detected:', payload);
          // Άμεση ενημέρωση των προγραμμάτων και completions
          refetch();
          // Άμεση επανάφορτωση των completions
          if (activePrograms.length > 0) {
            const loadCompletions = async () => {
              const allCompletions = [];
              for (const assignment of activePrograms) {
                const completions = await getWorkoutCompletions(assignment.id);
                allCompletions.push(...completions);
              }
              setWorkoutCompletions(allCompletions);
            };
            loadCompletions();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up workout completions subscription...');
      supabase.removeChannel(channel);
    };
  }, [refetch, activePrograms, getWorkoutCompletions]);

  // Υπολογίζουμε τα stats
  const stats = {
    totalPrograms: activePrograms.length,
    activeToday: programsForSelectedDate.length,
    completedToday: 0
  };

  // Δημιουργούμε μια λίστα με όλες τις ημερομηνίες που έχουν προγράμματα και τα statuses τους
  const programDatesWithStatus = activePrograms.reduce((dates: any[], assignment) => {
    if (assignment.training_dates) {
      const assignmentCompletions = workoutCompletions.filter(c => c.assignment_id === assignment.id);
      
      assignment.training_dates.forEach(dateStr => {
        const completion = assignmentCompletions.find(c => c.scheduled_date === dateStr);
        dates.push({
          date: dateStr,
          status: completion?.status || 'scheduled',
          assignmentId: assignment.id
        });
      });
    }
    return dates;
  }, []);

  // Συνάρτηση για να δείξουμε κουκίδες στις ημερομηνίες που έχουν προγράμματα με σωστό χρώμα
  const getDayContent = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateProgramsWithStatus = programDatesWithStatus.filter(d => d.date === dateStr);
    
    if (dateProgramsWithStatus.length > 0) {
      return (
        <div className="relative">
          <span>{date.getDate()}</span>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
            {dateProgramsWithStatus.slice(0, 3).map((program, i) => {
              let bulletColor = '#3b82f6'; // default μπλε για scheduled
              
              if (program.status === 'completed') {
                bulletColor = '#00ffba'; // πράσινο για completed
              } else if (program.status === 'missed') {
                bulletColor = '#ef4444'; // κόκκινο για missed
              }
              
              return (
                <div 
                  key={i} 
                  className="w-1 h-1 rounded-full" 
                  style={{ backgroundColor: bulletColor }}
                ></div>
              );
            })}
          </div>
        </div>
      );
    }
    
    return <span>{date.getDate()}</span>;
  };

  const handleDeleteProgram = async (assignmentId: string) => {
    try {
      console.log('Διαγραφή προγράμματος:', assignmentId);
      refetch();
    } catch (error) {
      console.error('Σφάλμα κατά τη διαγραφή:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex w-full items-center justify-center">
        <div>Φόρτωση προγραμμάτων...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex w-full items-center justify-center">
        <div className="text-red-600">Σφάλμα κατά τη φόρτωση: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Sidebar */}
      <ActiveProgramsSidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        stats={stats}
        activePrograms={activePrograms}
        onRefresh={refetch}
        onDelete={handleDeleteProgram}
      />
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="rounded-none"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Επιστροφή
              </Button>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CalendarCheck className="h-8 w-8 text-[#00ffba]" />
                Ημερολόγιο
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Section */}
            <Card className="lg:col-span-1 rounded-none">
              <CardHeader>
                <CardTitle className="text-lg">Ημερολόγιο Προπονήσεων</CardTitle>
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Προγραμματισμένες</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#00ffba] rounded-full"></div>
                    <span>Ολοκληρωμένες</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Χαμένες</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-none w-full"
                  weekStartsOn={0}
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
                    month: "space-y-4 w-full flex-1",
                    table: "w-full h-full border-collapse space-y-1",
                    head_row: "",
                    row: "w-full mt-2",
                  }}
                  components={{
                    DayContent: ({ date }) => getDayContent(date)
                  }}
                />
                
                {selectedDate && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-none">
                    <p className="text-sm text-gray-600">
                      Επιλεγμένη ημερομηνία: {selectedDate.toLocaleDateString('el-GR')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Προγράμματα: {programsForSelectedDate.length}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Programs for Selected Date */}
            <Card className="lg:col-span-2 rounded-none">
              <CardHeader>
                <CardTitle className="text-lg">
                  Προγράμματα για {selectedDate?.toLocaleDateString('el-GR')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {programsForSelectedDate.length > 0 ? (
                  <div className="space-y-2">
                    {programsForSelectedDate.map((assignment) => (
                      <ProgramCard
                        key={assignment.id}
                        assignment={assignment}
                        selectedDate={selectedDate}
                        onRefresh={refetch}
                        onDelete={handleDeleteProgram}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Δεν υπάρχουν προγράμματα για αυτή την ημερομηνία</p>
                    <p className="text-sm mt-2">Επιλέξτε άλλη ημερομηνία ή δημιουργήστε νέα ανάθεση από το ProgramBuilder</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivePrograms;
