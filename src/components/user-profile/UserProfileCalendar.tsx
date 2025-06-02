
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
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
      console.log('🔍 Fetching programs for user:', user.id);
      
      // Παίρνουμε τα assignments του χρήστη (όλα, συμπεριλαμβανομένων των ολοκληρωμένων)
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

      // Filter by date - only include assignments that have program data
      const validPrograms = enrichedAssignments.filter(isValidAssignment);
      
      console.log('✅ User programs loaded:', validPrograms.length);
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
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  if (loading) {
    return (
      <Card className="w-full rounded-none">
        <CardHeader>
          <CardTitle>Ημερολόγιο Προγραμμάτων</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Φόρτωση ημερολογίου...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full rounded-none">
      <CardHeader>
        <CalendarHeader
          currentDate={currentDate}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
        />
      </CardHeader>
      <CardContent>
        <CalendarGrid
          days={days}
          currentDate={currentDate}
          programs={programs}
          allCompletions={allCompletions}
          onRefresh={handleRefresh}
        />
        
        {programs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Δεν υπάρχουν προγράμματα για αυτόν τον χρήστη
          </div>
        )}
      </CardContent>
    </Card>
  );
};
