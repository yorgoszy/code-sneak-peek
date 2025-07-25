
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeProgramsProps {
  onProgramsChange: () => void;
  onAssignmentsChange: () => void;
}

export const useRealtimePrograms = ({ onProgramsChange, onAssignmentsChange }: UseRealtimeProgramsProps) => {
  useEffect(() => {
    console.log('🔄 Setting up enhanced realtime subscriptions for programs and assignments...');

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
          // Also trigger assignments refresh as new programs might get assigned
          setTimeout(() => {
            onAssignmentsChange();
          }, 1000);
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
          // Force immediate refresh for real-time updates
          setTimeout(() => {
            onAssignmentsChange();
          }, 100);
        }
      )
      .subscribe();

    // Subscribe to app_users for user changes
    const usersSubscription = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_users'
        },
        (payload) => {
          console.log('👤 User change detected:', payload);
          onAssignmentsChange(); // Refresh to update user data in assignments
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up enhanced realtime subscriptions...');
      supabase.removeChannel(programsSubscription);
      supabase.removeChannel(assignmentsSubscription);
      supabase.removeChannel(completionsSubscription);
      supabase.removeChannel(usersSubscription);
    };
  }, [onProgramsChange, onAssignmentsChange]);
};
