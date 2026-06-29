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
  onBubbleMinimize?: (workoutId: string) => void;
  liveWorkouts?: LiveWorkoutData[];
}

export const TodaysBubbles: React.FC<TodaysBubblesProps> = ({
  programsForToday,
  workoutCompletions,
  todayStr,
  onProgramClick,
  openWorkoutIds = new Set(),
  onBubbleRestore,
  onBubbleMinimize,
  liveWorkouts = []
}) => {
  const { bubbles, setSuppressRender, removeBubble } = useMinimizedBubbles();
  const { activeWorkouts } = useMultipleWorkouts();
  const [hiddenAssignmentIds, setHiddenAssignmentIds] = useState<Set<string>>(new Set());
  
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

  useEffect(() => {
    const handleDropZoneHide = (e: Event) => {
      const detail = (e as CustomEvent).detail as { assignmentId?: string } | undefined;
      if (!detail?.assignmentId) return;

      setHiddenAssignmentIds(prev => new Set(prev).add(detail.assignmentId!));
      removeBubble(`bubble-${detail.assignmentId}`);
    };

    window.addEventListener('bubble-drop-zone-hide', handleDropZoneHide as EventListener);
    return () => window.removeEventListener('bubble-drop-zone-hide', handleDropZoneHide as EventListener);
  }, [removeBubble]);

  useEffect(() => {
    if (openWorkoutIds.size === 0) return;
    setHiddenAssignmentIds(prev => {
      let changed = false;
      const next = new Set(prev);
      openWorkoutIds.forEach(id => {
        if (next.delete(id)) changed = true;
      });
      return changed ? next : prev;
    });
  }, [openWorkoutIds]);

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
    return !hiddenAssignmentIds.has(a.id) && !bubbles.some(b => b.id === bubbleId);
  });

  // Active workouts opened for non-today dates (no bubble yet, not in today list)
  const otherDayActive = activeWorkouts.filter(w => {
    const bubbleId = `bubble-${w.assignment.id}`;
    if (hiddenAssignmentIds.has(w.assignment.id)) return false;
    if (bubbles.some(b => b.id === bubbleId)) return false;
    if (programsForToday.some(p => p.id === w.assignment.id)) return false;
    return true;
  });

  if (bubbles.length === 0 && todayProgramsFiltered.length === 0 && otherDayActive.length === 0) {
    return null;
  }

  // Helper to check if a workout's dialog is currently open (workoutId = assignment.id)
  const isDialogOpen = (assignmentId: string) => openWorkoutIds.has(assignmentId);

  // Build items: existing bubbles + today's pending programs + other-day active, stable sort
  const items: Array<
    | { type: 'bubble'; data: typeof bubbles[0] }
    | { type: 'today'; data: EnrichedAssignment }
    | { type: 'other'; data: typeof activeWorkouts[0] }
  > = [
    ...bubbles.map(b => ({ type: 'bubble' as const, data: b })),
    ...todayProgramsFiltered.map(a => ({ type: 'today' as const, data: a })),
    ...otherDayActive.map(w => ({ type: 'other' as const, data: w })),
  ];
  items.sort((a, b) => {
    const idA = a.type === 'today' ? a.data.id : a.type === 'other' ? a.data.assignment.id : extractAssignmentId(a.data.id);
    const idB = b.type === 'today' ? b.data.id : b.type === 'other' ? b.data.assignment.id : extractAssignmentId(b.data.id);
    return idA.localeCompare(idB);
  });

  const renderBubbleItem = (bubble: typeof bubbles[0]) => {
    const assignmentId = extractAssignmentId(bubble.id);
    if (hiddenAssignmentIds.has(assignmentId)) return null;
    const isActive = isDialogOpen(assignmentId);
    const bubbleAssignment = programsForToday.find(a => a.id === assignmentId);
    const bubbleCompleted = bubbleAssignment ? getWorkoutStatus(bubbleAssignment) === 'completed' : false;
    const dragDate = activeWorkouts.find(w => w.assignment.id === assignmentId)?.selectedDate;

    return (
      <MinimizedWorkoutBubble
        key={bubble.id}
        athleteName={bubble.athleteName}
        avatarUrl={bubble.photoUrl || bubble.avatarUrl}
        workoutInProgress={bubble.workoutInProgress}
        elapsedTime={bubble.elapsedTime}
        size={isActive ? 'lg' : 'sm'}
        isCompleted={bubbleCompleted}
        dragPayload={{
          assignmentId,
          date: dragDate ? dragDate.toISOString().slice(0, 10) : todayStr,
          userName: bubble.athleteName,
        }}
        onRestore={() => {
          if (isActive) {
            onBubbleMinimize?.(assignmentId);
            return;
          }
          bubble.onRestore();
          removeBubble(bubble.id);
          onBubbleRestore?.(assignmentId);
        }}
      />
    );
  };

  return (
    <>
      {items.length > 0 && (
        <div className="fixed bottom-4 left-4 z-[9999] flex gap-2 items-end" data-bubbles-container>
          {items.map(item => {
            if (item.type === 'bubble') return renderBubbleItem(item.data);

            const assignment: EnrichedAssignment =
              item.type === 'today' ? item.data : item.data.assignment;
            const status = getWorkoutStatus(assignment);
            const name = assignment.app_users?.name || 'Άγνωστος';
            const avatarUrl = assignment.app_users?.photo_url || assignment.app_users?.avatar_url;
            const isCompleted = status === 'completed';
            const isActive = isDialogOpen(assignment.id);

            const activeWorkout = activeWorkouts.find(w => w.id === assignment.id);
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
                dragPayload={{
                  assignmentId: assignment.id,
                  date: item.type === 'other' ? item.data.selectedDate.toISOString().slice(0, 10) : todayStr,
                  userName: name,
                }}
                onRestore={() => {
                  if (isActive) {
                    onBubbleMinimize?.(assignment.id);
                  } else {
                    onProgramClick(assignment);
                  }
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
};
