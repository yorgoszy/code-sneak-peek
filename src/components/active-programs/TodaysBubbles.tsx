import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle } from "lucide-react";
import { useMinimizedBubbles } from '@/contexts/MinimizedBubblesContext';
import { MinimizedWorkoutBubble } from '@/components/active-programs/calendar/MinimizedWorkoutBubble';
import { useMultipleWorkouts } from '@/hooks/useMultipleWorkouts';
import { getWorkoutUserKey, makeWorkoutId } from '@/contexts/MultipleWorkoutsContext';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import type { LiveWorkoutData } from '@/hooks/useLiveWorkoutData';

interface TodaysBubblesProps {
  programsForToday: EnrichedAssignment[];
  workoutCompletions: any[];
  todayStr: string;
  onProgramClick: (assignment: EnrichedAssignment, date?: Date) => void;
  openWorkoutIds?: Set<string>;
  onBubbleRestore?: (workoutId: string) => void;
  onBubbleMinimize?: (workoutId: string) => void;
  liveWorkouts?: LiveWorkoutData[];
}

// Bubble id format: `bubble-${assignmentId}__${yyyy-MM-dd}`
const parseBubbleId = (bubbleId: string): { assignmentId: string; date: string } => {
  const rest = bubbleId.startsWith('bubble-') ? bubbleId.slice(7) : bubbleId;
  const idx = rest.lastIndexOf('__');
  if (idx === -1) return { assignmentId: rest, date: '' };
  return { assignmentId: rest.slice(0, idx), date: rest.slice(idx + 2) };
};

const makeBubbleId = (assignmentId: string, date: string) => `bubble-${assignmentId}__${date}`;
const makeHideKey = (assignmentId: string, date: string) => `${assignmentId}__${date}`;
const dateFromKey = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
};

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
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  // Timer for live elapsed time computation
  const [, setTick] = useState(0);
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
      const detail = (e as CustomEvent).detail as { assignmentId?: string; date?: string } | undefined;
      if (!detail?.assignmentId) return;
      const date = detail.date || todayStr;
      const key = makeHideKey(detail.assignmentId, date);
      setHiddenKeys(prev => new Set(prev).add(key));
      removeBubble(makeBubbleId(detail.assignmentId, date));
    };

    window.addEventListener('bubble-drop-zone-hide', handleDropZoneHide as EventListener);
    return () => window.removeEventListener('bubble-drop-zone-hide', handleDropZoneHide as EventListener);
  }, [removeBubble, todayStr]);

  // When a workout dialog re-opens, un-hide its bubble entry
  useEffect(() => {
    if (openWorkoutIds.size === 0) return;
    setHiddenKeys(prev => {
      let changed = false;
      const next = new Set(prev);
      openWorkoutIds.forEach(id => {
        // openWorkoutIds are composite workoutIds already
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

  const bubbleAssignmentIds = new Set(
    bubbles.map(b => parseBubbleId(b.id).assignmentId)
  );
  const bubbleUserIds = new Set(
    bubbles.map(b => b.userId).filter(Boolean)
  );
  const activeDateByUser = new Map(
    activeWorkouts.map(w => [getWorkoutUserKey(w.assignment), format(w.selectedDate, 'yyyy-MM-dd')])
  );

  // Today programs that don't yet have a bubble for TODAY:
  const todayProgramsFiltered = programsForToday.filter(a => {
    const key = makeHideKey(a.id, todayStr);
    const userKey = getWorkoutUserKey(a);
    const activeDate = activeDateByUser.get(userKey);
    if (bubbleAssignmentIds.has(a.id) || bubbleUserIds.has(userKey)) return false;
    if (activeDate && activeDate !== todayStr) return false;
    return !hiddenKeys.has(key);
  });

  // Active workouts για μη-σημερινές ημέρες που δεν έχουν ήδη bubble
  const otherDayActive = activeWorkouts.filter(w => {
    const dateStr = format(w.selectedDate, 'yyyy-MM-dd');
    if (dateStr === todayStr) return false; // σημερινά καλύπτονται από todayProgramsFiltered
    const key = makeHideKey(w.assignment.id, dateStr);
    if (hiddenKeys.has(key)) return false;
    if (bubbleAssignmentIds.has(w.assignment.id) || bubbleUserIds.has(getWorkoutUserKey(w.assignment))) return false;
    const bubbleId = makeBubbleId(w.assignment.id, dateStr);
    if (bubbles.some(b => b.id === bubbleId)) return false;
    return true;
  });

  if (bubbles.length === 0 && todayProgramsFiltered.length === 0 && otherDayActive.length === 0) {
    return null;
  }

  // Helper: openWorkoutIds είναι composite workout ids
  const isDialogOpen = (workoutId: string) => openWorkoutIds.has(workoutId);

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
    const idA = a.type === 'today'
      ? a.data.id
      : a.type === 'other'
      ? a.data.assignment.id
      : parseBubbleId(a.data.id).assignmentId;
    const idB = b.type === 'today'
      ? b.data.id
      : b.type === 'other'
      ? b.data.assignment.id
      : parseBubbleId(b.data.id).assignmentId;
    return idA.localeCompare(idB);
  });

  const renderBubbleItem = (bubble: typeof bubbles[0]) => {
    const { assignmentId, date } = parseBubbleId(bubble.id);
    const key = makeHideKey(assignmentId, date);
    if (hiddenKeys.has(key)) return null;
    const workoutId = makeWorkoutId(assignmentId, date);
    const isActive = isDialogOpen(workoutId);
    const bubbleAssignment = programsForToday.find(a => a.id === assignmentId);
    const bubbleCompleted = bubbleAssignment && date === todayStr
      ? getWorkoutStatus(bubbleAssignment) === 'completed'
      : false;

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
          date: date || todayStr,
          userName: bubble.athleteName,
        }}
        onRestore={() => {
          if (isActive) {
            onBubbleMinimize?.(workoutId);
            return;
          }
          bubble.onRestore();
          removeBubble(bubble.id);
          onBubbleRestore?.(workoutId);
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
            const dateStr = item.type === 'other'
              ? format(item.data.selectedDate, 'yyyy-MM-dd')
              : todayStr;
            const workoutId = makeWorkoutId(assignment.id, dateStr);
            const status = getWorkoutStatus(assignment);
            const name = assignment.app_users?.name || 'Άγνωστος';
            const avatarUrl = assignment.app_users?.photo_url || assignment.app_users?.avatar_url;
            const isCompleted = dateStr === todayStr && status === 'completed';
            const isActive = isDialogOpen(workoutId);

            const activeWorkout = activeWorkouts.find(w => w.id === workoutId);
            let isInProgress = activeWorkout?.workoutInProgress || false;
            let elapsedTime = activeWorkout?.elapsedTime || 0;

            const liveWorkout = liveWorkouts.find(
              lw => lw.assignment_id === assignment.id && lw.scheduled_date === dateStr
            );
            if (liveWorkout && liveWorkout.start_time && !isInProgress) {
              isInProgress = true;
              elapsedTime = Math.floor((Date.now() - new Date(liveWorkout.start_time).getTime()) / 1000);
            }

            return (
              <MinimizedWorkoutBubble
                key={workoutId}
                athleteName={name}
                avatarUrl={avatarUrl}
                workoutInProgress={isInProgress}
                elapsedTime={elapsedTime}
                size={isActive ? 'lg' : 'sm'}
                isCompleted={isCompleted}
                dragPayload={{
                  assignmentId: assignment.id,
                  date: dateStr,
                  userName: name,
                }}
                onRestore={() => {
                  if (isActive) {
                    onBubbleMinimize?.(workoutId);
                  } else {
                    onProgramClick(assignment, dateFromKey(dateStr));
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
