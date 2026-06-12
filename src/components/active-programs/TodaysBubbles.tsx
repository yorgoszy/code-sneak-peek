import React, { useEffect, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle } from "lucide-react";
import { useMinimizedBubbles } from '@/contexts/MinimizedBubblesContext';
import { MinimizedWorkoutBubble } from '@/components/active-programs/calendar/MinimizedWorkoutBubble';
import { useMultipleWorkouts } from '@/hooks/useMultipleWorkouts';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import type { LiveWorkoutData } from '@/hooks/useLiveWorkoutData';

interface TodaysBubblesProps {
  programsForToday: EnrichedAssignment[];
  workoutCompletions: any[];
  todayStr: string;
  onProgramClick: (assignment: EnrichedAssignment) => void;
  openWorkoutIds?: Set<string>;
  onBubbleRestore?: (workoutId: string) => void;
  liveWorkouts?: LiveWorkoutData[];
}

export const TodaysBubbles: React.FC<TodaysBubblesProps> = ({
  programsForToday,
  workoutCompletions,
  todayStr,
  onProgramClick,
  openWorkoutIds = new Set(),
  onBubbleRestore,
  liveWorkouts = []
}) => {
  const { bubbles, setSuppressRender, removeBubble } = useMinimizedBubbles();
  const { activeWorkouts } = useMultipleWorkouts();
  
  // Timer for live elapsed time computation
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (liveWorkouts.length === 0) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [liveWorkouts.length]);

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

  // ONE bubble per assignment (per user). No splitting by date anymore.
  // Today programs that don't yet have a bubble:
  const extractAssignmentId = (bubbleId: string) => bubbleId.replace('bubble-', '');

  const todayProgramsFiltered = programsForToday.filter(a => {
    const bubbleId = `bubble-${a.id}`;
    return !bubbles.some(b => b.id === bubbleId);
  });

  if (bubbles.length === 0 && todayProgramsFiltered.length === 0) {
    return null;
  }

  // Helper to check if a workout's dialog is currently open (workoutId = assignment.id)
  const isDialogOpen = (assignmentId: string) => openWorkoutIds.has(assignmentId);

  // Build items: existing bubbles + today's pending programs, stable sort
  const items: Array<{ type: 'bubble'; data: typeof bubbles[0] } | { type: 'today'; data: EnrichedAssignment }> = [
    ...bubbles.map(b => ({ type: 'bubble' as const, data: b })),
    ...todayProgramsFiltered.map(a => ({ type: 'today' as const, data: a })),
  ];
  items.sort((a, b) => {
    const idA = a.type === 'today' ? a.data.id : extractAssignmentId(a.data.id);
    const idB = b.type === 'today' ? b.data.id : extractAssignmentId(b.data.id);
    return idA.localeCompare(idB);
  });

  const renderBubbleItem = (bubble: typeof bubbles[0]) => {
    const assignmentId = extractAssignmentId(bubble.id);
    const isActive = isDialogOpen(assignmentId);
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
  };

  return (
    <>
      {/* Today's bubbles + pending programs — bottom-left */}
      {leftItems.length > 0 && (
        <div className="fixed bottom-4 left-4 z-[9999] flex gap-2 items-end" data-bubbles-container>
          {leftItems.map(item => {
            if (item.type === 'bubble') return renderBubbleItem(item.data);

            const assignment = item.data;
            const status = getWorkoutStatus(assignment);
            const name = assignment.app_users?.name || 'Άγνωστος';
            const avatarUrl = assignment.app_users?.photo_url || assignment.app_users?.avatar_url;
            const isCompleted = status === 'completed';
            const isActive = isDialogOpen(`${assignment.id}-${todayStr}`);

            const workoutId = `${assignment.id}-${todayStr}`;
            const activeWorkout = activeWorkouts.find(w => w.id === workoutId);
            let isInProgress = activeWorkout?.workoutInProgress || false;
            let elapsedTime = activeWorkout?.elapsedTime || 0;

            const liveWorkout = liveWorkouts.find(
              lw => lw.assignment_id === assignment.id && lw.scheduled_date === todayStr
            );
            if (liveWorkout && liveWorkout.start_time && !isInProgress) {
              isInProgress = true;
              elapsedTime = Math.floor((Date.now() - new Date(liveWorkout.start_time).getTime()) / 1000);
            }

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
          })}
        </div>
      )}

      {/* Other-day bubbles — bottom-right */}
      {otherDayBubbles.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[9999] flex gap-2 items-end" data-bubbles-container-right>
          {otherDayBubbles.map(renderBubbleItem)}
        </div>
      )}
    </>
  );
};
