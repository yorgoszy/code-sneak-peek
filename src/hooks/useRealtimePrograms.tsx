
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeProgramsProps {
  onProgramsChange: () => void;
  onAssignmentsChange: () => void;
}

export const useRealtimePrograms = ({ onProgramsChange, onAssignmentsChange }: UseRealtimeProgramsProps) => {
  useEffect(() => {
    console.log('🔄 Setting up realtime subscriptions for programs and assignments...');

    // Subscribe to programs table changes
    const programsSubscription = supabase
      .channel('programs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'programs'
        },
        (payload) => {
          console.log('📝 Programs change detected:', payload);
          onProgramsChange();
        }
      )
      .subscribe();

    // Subscribe to program_assignments table changes
    const assignmentsSubscription = supabase
      .channel('assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'program_assignments'
        },
        (payload) => {
          console.log('📋 Program assignments change detected:', payload);
          onAssignmentsChange();
        }
      )
      .subscribe();

    // Subscribe to workout_completions for status updates
    const completionsSubscription = supabase
      .channel('completions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_completions'
        },
        (payload) => {
          console.log('✅ Workout completion change detected:', payload);
          onAssignmentsChange(); // This affects program status
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up realtime subscriptions...');
      supabase.removeChannel(programsSubscription);
      supabase.removeChannel(assignmentsSubscription);
      supabase.removeChannel(completionsSubscription);
    };
  }, [onProgramsChange, onAssignmentsChange]);
};
