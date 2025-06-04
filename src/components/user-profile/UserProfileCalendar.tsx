import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { CalendarHeader } from '../active-programs/calendar/CalendarHeader';
import { CalendarGrid } from '../active-programs/calendar/CalendarGrid';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { supabase } from "@/integrations/supabase/client";
import { fetchProgramAssignments, enrichAssignmentWithProgramData } from "@/hooks/useActivePrograms/dataService";
import { isValidAssignment } from "@/hooks/useActivePrograms/dateFilters";

interface UserProfileCalendarProps {
  user: any;
}

export const UserProfileCalendar: React.FC<UserProfileCalendarProps> = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [programs, setPrograms] = useState<EnrichedAssignment[]>([]);
  const [allCompletions, setAllCompletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { getWorkoutCompletions } = useWorkoutCompletions();

  console.log('📅 UserProfileCalendar rendering for user:', user?.id);

  useEffect(() => {
    if (user?.id) {
      fetchUserPrograms();
    }
  }, [user?.id]);

  useEffect(() => {
    const fetchAllCompletions = async () => {
      if (programs.length === 0) {
        setAllCompletions([]);
        return;
      }

      console.log('🔄 Fetching completions for user programs:', programs.length);
      const completionsData: any[] = [];
      
      for (const program of programs) {
        try {
          const completions = await getWorkoutCompletions(program.id);
          completionsData.push(...completions.map(c => ({ ...c, assignment_id: program.id })));
        } catch (error) {
          console.error('❌ Error fetching completions for program:', program.id, error);
        }
      }
      
      setAllCompletions(completionsData);
    };

    fetchAllCompletions();
  }, [programs, getWorkoutCompletions]);

  // Real-time updates for workout completions
  useEffect(() => {
    if (!user?.id || programs.length === 0) return;

    console.log('🔄 Setting up real-time updates for user profile calendar');
    
    const channel = supabase
      .channel('user-profile-workout-completions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_completions'
        },
        async (payload) => {
          console.log('📊 User profile workout completion changed:', payload);
          
          // Refetch all completions to get updated data
          const completionsData: any[] = [];
          for (const program of programs) {
            try {
              const completions = await getWorkoutCompletions(program.id);
              completionsData.push(...completions.map(c => ({ ...c, assignment_id: program.id })));
            } catch (error) {
              console.error('❌ Error fetching completions for program:', program.id, error);
            }
          }
          setAllCompletions(completionsData);
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up user profile real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, programs, getWorkoutCompletions]);

  const fetchUserPrograms = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching ALL programs for user (including completed):', user.id);
      
      // Παίρνουμε όλα τα assignments του χρήστη (συμπεριλαμβανομένων των ολοκληρωμένων)
      const assignments = await fetchProgramAssignments(user.id);
      
      if (!assignments || assignments.length === 0) {
        console.log('⚠️ No assignments found for user:', user.id);
        setPrograms([]);
        return;
      }

      // Enrich assignments with program data
      const enrichedAssignments = await Promise.all(
        assignments.map(enrichAssignmentWithProgramData)
      );

      // Filter by date - include ALL valid assignments (both completed and active)
      const validPrograms = enrichedAssignments.filter(isValidAssignment);
      
      console.log('✅ User programs loaded (all including completed):', validPrograms.length);
      setPrograms(validPrograms);

    } catch (error) {
      console.error('❌ Error fetching user programs:', error);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 Refreshing user profile calendar data...');
    await fetchUserPrograms();
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Υπολογίζουμε τις μέρες του μήνα συμπεριλαμβάνοντας τις μέρες του προηγούμενου/επόμενου μήνα
  // για να γεμίσει το grid, αρχίζοντας από Δευτέρα (weekStartsOn: 1)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  if (loading) {
    return (
      <Card className="w-full h-full rounded-none border-0 bg-transparent">
        <CardContent className="p-1">
          <div className="text-center py-4 text-gray-500 text-xs">
            Φόρτωση ημερολογίου...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full rounded-none border-0 bg-transparent flex flex-col text-xs">
      <CardHeader className="p-1 pb-0">
        <div className="flex flex-row items-center justify-between space-y-0 pb-1">
          <h2 className="text-sm font-bold">
            {new Intl.DateTimeFormat('el-GR', { month: 'long', year: 'numeric' }).format(currentDate)}
          </h2>
          <div className="flex space-x-1">
            <button
              onClick={goToPreviousMonth}
              className="w-5 h-5 rounded-none border border-gray-600 bg-gray-800 text-white hover:bg-[#00ffba] hover:text-black flex items-center justify-center text-xs"
            >
              ‹
            </button>
            <button
              onClick={goToNextMonth}
              className="w-5 h-5 rounded-none border border-gray-600 bg-gray-800 text-white hover:bg-[#00ffba] hover:text-black flex items-center justify-center text-xs"
            >
              ›
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-1 pt-0 flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {['Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ', 'Κ'].map((day) => (
              <div key={day} className="text-center font-medium text-gray-400 text-xs py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px flex-1">
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`
                  text-xs p-1 min-h-[24px] flex flex-col
                  ${day.getMonth() !== currentDate.getMonth() ? 'text-gray-600' : 'text-white'}
                  ${new Date().toDateString() === day.toDateString() ? 'bg-[#00ffba] text-black font-bold' : 'bg-gray-800'}
                `}
              >
                <span className="text-xs leading-none">{day.getDate()}</span>
                {/* Program indicators - tiny dots */}
                <div className="flex flex-wrap gap-px mt-px">
                  {programs
                    .filter(program => {
                      if (!program.training_dates) return false;
                      return program.training_dates.some((dateStr: string) => {
                        const programDate = new Date(dateStr);
                        return programDate.toDateString() === day.toDateString();
                      });
                    })
                    .slice(0, 3)
                    .map((program, index) => {
                      const completion = allCompletions.find(c => 
                        c.assignment_id === program.id && 
                        new Date(c.completed_at).toDateString() === day.toDateString()
                      );
                      return (
                        <div
                          key={`${program.id}-${index}`}
                          className={`w-1 h-1 ${completion ? 'bg-green-400' : 'bg-orange-400'}`}
                          title={program.programs?.name || 'Program'}
                        />
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {programs.length === 0 && (
          <div className="text-center py-2 text-gray-500 text-xs">
            Δεν υπάρχουν προγράμματα
          </div>
        )}
      </CardContent>
    </Card>
  );
};
