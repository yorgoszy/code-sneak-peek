import React, { useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle } from "lucide-react";
import { useMinimizedBubbles } from '@/contexts/MinimizedBubblesContext';
import { MinimizedWorkoutBubble } from '@/components/active-programs/calendar/MinimizedWorkoutBubble';
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
          return (
            <MinimizedWorkoutBubble
              key={bubble.id}
              athleteName={bubble.athleteName}
              avatarUrl={bubble.photoUrl || bubble.avatarUrl}
              workoutInProgress={bubble.workoutInProgress}
              elapsedTime={bubble.elapsedTime}
              size={isActive ? 'lg' : 'sm'}
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
          const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          const isCompleted = status === 'completed';
          const isActive = isDialogOpen(assignment.id);
          const sizeClass = isActive ? 'w-14 h-14' : 'w-10 h-10';

          return (
            <div
              key={assignment.id}
              className="relative cursor-pointer group"
              onClick={() => onProgramClick(assignment)}
              title={`${name} - ${assignment.programs?.name || ''}`}
            >
              <Avatar className={`${sizeClass} border-2 shadow-lg transition-all hover:scale-110 ${
                isCompleted ? 'border-[#00ffba]' : status === 'missed' ? 'border-red-400' : 'border-gray-300'
              }`}>
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} className="object-cover" /> : null}
                <AvatarFallback className="bg-gray-200 text-gray-700 text-[9px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {isCompleted && (
                <span className="absolute -top-1 -right-1 bg-[#00ffba] rounded-full p-0.5">
                  <CheckCircle className="w-3 h-3 text-black" />
                </span>
              )}

              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-1.5 py-0.5 rounded-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {name.split(' ')[0]}
              </span>
            </div>
          );
        }
      })}
    </div>
  );
};
