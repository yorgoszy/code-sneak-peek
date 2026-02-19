import React, { useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle } from "lucide-react";
import { useMinimizedBubbles } from '@/contexts/MinimizedBubblesContext';
import { MinimizedWorkoutBubble } from '@/components/active-programs/calendar/MinimizedWorkoutBubble';
import { useMultipleWorkouts } from '@/hooks/useMultipleWorkouts';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface TodaysBubblesProps {
  programsForToday: EnrichedAssignment[];
  workoutCompletions: any[];
  todayStr: string;
  onProgramClick: (assignment: EnrichedAssignment) => void;
  openAssignmentIds?: Set<string>;
  onBubbleRestore?: (assignmentId: string) => void;
}

export const TodaysBubbles: React.FC<TodaysBubblesProps> = ({
  programsForToday,
  workoutCompletions,
  todayStr,
  onProgramClick,
  openAssignmentIds = new Set(),
  onBubbleRestore
}) => {
  const { bubbles, setSuppressRender, removeBubble } = useMinimizedBubbles();
  const { activeWorkouts } = useMultipleWorkouts();

  // Suppress the context's built-in rendering - we handle it here
  useEffect(() => {
    setSuppressRender(true);
    return () => setSuppressRender(false);
  }, [setSuppressRender]);

  const getWorkoutStatus = (assignment: EnrichedAssignment) => {
    const completion = workoutCompletions.find(c =>
      c.assignment_id === assignment.id && c.scheduled_date === todayStr
    );
    const currentStatus = completion?.status || 'scheduled';
    const today = new Date();
    const workoutDate = new Date(todayStr);
    const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (isPast && currentStatus !== 'completed') return 'missed';
    return currentStatus;
  };

  // Filter out today's programs that already have a minimized bubble
  const minimizedAssignmentIds = new Set(
    bubbles.map(b => b.id.replace('bubble-', '').split('-').slice(0, -3).join('-'))
  );

  // Programs for today that are NOT already shown as minimized bubbles
  const todayProgramsFiltered = programsForToday.filter(a => {
    const bubbleId = `bubble-${a.id}-${todayStr}`;
    return !bubbles.some(b => b.id === bubbleId);
  });

  // Build a unified, stable-ordered list of all items (bubbles + today's programs)
  const allItems = React.useMemo(() => {
    if (todayProgramsFiltered.length === 0 && bubbles.length === 0) return [];
    
    const items: Array<{ type: 'bubble'; data: typeof bubbles[0] } | { type: 'today'; data: EnrichedAssignment }> = [];
    
    // Add minimized bubbles
    bubbles.forEach(bubble => {
      items.push({ type: 'bubble', data: bubble });
    });
    
    // Add today's programs (not already minimized)
    todayProgramsFiltered.forEach(assignment => {
      items.push({ type: 'today', data: assignment });
    });
    
    // Sort by the underlying assignment ID (extracted from bubble id format: bubble-{assignmentId}-{date})
    const extractAssignmentId = (item: typeof items[0]) => {
      if (item.type === 'today') return (item.data as EnrichedAssignment).id;
      const bubbleData = item.data as typeof bubbles[0];
      // bubble id format: bubble-{assignmentId}-{date}
      return bubbleData.id.replace('bubble-', '').replace(`-${todayStr}`, '');
    };
    items.sort((a, b) => {
      return extractAssignmentId(a).localeCompare(extractAssignmentId(b));
    });
    
    return items;
  }, [bubbles, todayProgramsFiltered]);

  if (allItems.length === 0) return null;

  // Helper to check if an assignment's dialog is currently open
  const isDialogOpen = (assignmentId: string) => {
    // openAssignmentIds contains workoutIds like "assignmentId-date"
    for (const wid of openAssignmentIds) {
      if (wid.startsWith(assignmentId)) return true;
    }
    return false;
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex gap-2 items-end" data-bubbles-container>
      {allItems.map(item => {
        if (item.type === 'bubble') {
          const bubble = item.data as typeof bubbles[0];
          const assignmentId = bubble.id.replace('bubble-', '').replace(`-${todayStr}`, '');
          const isActive = isDialogOpen(assignmentId);
          // Check completion status for this bubble's assignment
          const bubbleAssignment = programsForToday.find(a => a.id === assignmentId);
          const bubbleCompleted = bubbleAssignment ? getWorkoutStatus(bubbleAssignment) === 'completed' : false;
          
          return (
            <MinimizedWorkoutBubble
              key={bubble.id}
              athleteName={bubble.athleteName}
              avatarUrl={bubble.photoUrl || bubble.avatarUrl}
              workoutInProgress={bubble.workoutInProgress}
              elapsedTime={bubble.elapsedTime}
              size={isActive ? 'lg' : 'sm'}
              isCompleted={bubbleCompleted}
              onRestore={() => {
                bubble.onRestore();
                removeBubble(bubble.id);
                onBubbleRestore?.(assignmentId);
              }}
            />
          );
        } else {
          const assignment = item.data as EnrichedAssignment;
          const status = getWorkoutStatus(assignment);
          const name = assignment.app_users?.name || 'Άγνωστος';
          const avatarUrl = assignment.app_users?.photo_url || assignment.app_users?.avatar_url;
          const isCompleted = status === 'completed';
          const isActive = isDialogOpen(assignment.id);
          
          // Check if this workout is currently in progress via MultipleWorkoutsContext
          const workoutId = `${assignment.id}-${todayStr}`;
          const activeWorkout = activeWorkouts.find(w => w.id === workoutId);
          const isInProgress = activeWorkout?.workoutInProgress || false;
          const elapsedTime = activeWorkout?.elapsedTime || 0;

          return (
            <MinimizedWorkoutBubble
              key={assignment.id}
              athleteName={name}
              avatarUrl={avatarUrl}
              workoutInProgress={isInProgress}
              elapsedTime={elapsedTime}
              size={isActive ? 'lg' : 'sm'}
              isCompleted={isCompleted}
              onRestore={() => onProgramClick(assignment)}
            />
          );
        }
      })}
    </div>
  );
};
