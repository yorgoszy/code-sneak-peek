import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Menu, Maximize2, Minimize2, LayoutGrid, GalleryHorizontal } from 'lucide-react';
import { CustomLoadingScreen } from '@/components/ui/custom-loading';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useActivePrograms } from '@/hooks/useActivePrograms';
import { useMultipleWorkouts } from '@/contexts/MultipleWorkoutsContext';
import { useMinimizedBubbles } from '@/contexts/MinimizedBubblesContext';
import { getWorkoutUserKey } from '@/contexts/MultipleWorkoutsContext';
import { TodaysBubbles } from '@/components/active-programs/TodaysBubbles';
import { DayProgramDialog } from '@/components/active-programs/calendar/DayProgramDialog';
import { SlotProgramPickerDialog } from '@/components/active-programs/calendar/SlotProgramPickerDialog';
import { supabase } from '@/integrations/supabase/client';
import type { EnrichedAssignment } from '@/hooks/useActivePrograms/types';

const SLOT_COUNT = 6;
const ADMIN_ID = 'c6d44641-3b95-46bd-8270-e5ed72de25ad';

type LayoutMode = 'grid' | 'horizontal';

interface Slot {
  assignmentId: string;
  date: string;
}

const dateFromKey = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const DayCardsView = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [slots, setSlots] = useState<Array<Slot | null>>(Array(SLOT_COUNT).fill(null));
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);

  const slotRefs = useRef<Array<HTMLDivElement | null>>(Array(SLOT_COUNT).fill(null));
  const horizontalScrollRef = useRef<HTMLDivElement | null>(null);
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const { data: allPrograms = [], isLoading, refetch } = useActivePrograms();
  const activePrograms = allPrograms.filter(p => p.app_users?.coach_id === ADMIN_ID);
  const { openWorkout } = useMultipleWorkouts();
  const { removeBubblesByAssignment, removeBubblesByUser } = useMinimizedBubbles();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const programsForToday = activePrograms.filter(
    a => a.training_dates?.includes(todayStr)
  );

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !rolesLoading && isAuthenticated && userProfile && !isAdmin) {
      navigate(`/user/${userProfile.user_id}`);
    }
  }, [authLoading, rolesLoading, isAuthenticated, userProfile, isAdmin, navigate]);

  const programsRef = useRef(activePrograms);
  programsRef.current = activePrograms;

  const loadCompletions = useCallback(async () => {
    const programs = programsRef.current;
    if (programs.length === 0) return;
    const { data, error } = await supabase
      .from('workout_completions')
      .select('*')
      .in('assignment_id', programs.map(p => p.id))
      .order('scheduled_date', { ascending: false });
    if (!error) setWorkoutCompletions(data || []);
  }, []);

  useEffect(() => {
    if (activePrograms.length > 0) loadCompletions();
  }, [activePrograms.length, loadCompletions]);

  const handleRefresh = useCallback(async () => {
    await loadCompletions();
    refetch();
  }, [loadCompletions, refetch]);

  const getWorkoutStatus = (assignmentId: string, dateStr: string) => {
    const completion = workoutCompletions.find(
      c => c.assignment_id === assignmentId && c.scheduled_date === dateStr
    );
    return completion?.status || 'scheduled';
  };

  const placeInSlot = useCallback(
    (slotIndex: number, assignmentId: string, date: string, userName?: string) => {
      const assignment = programsRef.current.find(a => a.id === assignmentId);
      if (!assignment) return;

      setSlots(prev => {
        const next = [...prev];
        // Ένας χρήστης μία θέση
        for (let i = 0; i < next.length; i++) {
          if (next[i]?.assignmentId === assignmentId) next[i] = null;
        }
        next[slotIndex] = { assignmentId, date };
        return next;
      });

      openWorkout(assignment, dateFromKey(date));
      removeBubblesByUser(getWorkoutUserKey(assignment));
      removeBubblesByAssignment(assignment.id);
      window.dispatchEvent(
        new CustomEvent('bubble-drop-zone-hide', {
          detail: { assignmentId, date, userName: userName || assignment.app_users?.name || '' },
        })
      );
    },
    [openWorkout, removeBubblesByAssignment, removeBubblesByUser]
  );

  // Drag & drop bubbles μέσα στις θέσεις
  useEffect(() => {
    const slotIndexAtPoint = (x: number, y: number) => {
      for (let i = 0; i < slotRefs.current.length; i++) {
        const el = slotRefs.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
      }
      return null;
    };

    const onStart = () => setDragActive(true);

    const onMove = (e: Event) => {
      const d = (e as CustomEvent).detail as any;
      if (typeof d?.clientX !== 'number') return;
      setHoverSlot(slotIndexAtPoint(d.clientX, d.clientY));
    };

    const onEnd = (e: Event) => {
      const d = (e as CustomEvent).detail as any;
      setDragActive(false);
      setHoverSlot(null);
      if (!d?.assignmentId || typeof d.clientX !== 'number') return;
      const idx = slotIndexAtPoint(d.clientX, d.clientY);
      if (idx === null) return;
      placeInSlot(idx, d.assignmentId, d.date || todayStr, d.userName);
    };

    window.addEventListener('bubble-drag-start', onStart as EventListener);
    window.addEventListener('bubble-drag-move', onMove as EventListener);
    window.addEventListener('bubble-drag-end', onEnd as EventListener);
    return () => {
      window.removeEventListener('bubble-drag-start', onStart as EventListener);
      window.removeEventListener('bubble-drag-move', onMove as EventListener);
      window.removeEventListener('bubble-drag-end', onEnd as EventListener);
    };
  }, [placeInSlot, todayStr]);

  // Κλικ σε bubble -> πρώτη ελεύθερη θέση
  const handleProgramClick = (assignment: EnrichedAssignment, date?: Date) => {
    const dateStr = format(date || new Date(), 'yyyy-MM-dd');
    const free = slots.findIndex(s => s === null);
    if (free === -1) return;
    placeInSlot(free, assignment.id, dateStr, assignment.app_users?.name);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(v => !v);
    }
  };

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const renderSlot = (index: number) => {
    const slot = slots[index];
    const assignment = slot
      ? activePrograms.find(a => a.id === slot.assignmentId)
      : undefined;
    const isOver = hoverSlot === index;

    return (
      <div
        key={index}
        ref={el => (slotRefs.current[index] = el)}
        className={`relative min-h-0 overflow-hidden border transition-colors ${
          slot && assignment
            ? 'border-gray-300 bg-white'
            : isOver
            ? 'border-2 border-dashed border-black bg-[#00ffba]/20'
            : dragActive
            ? 'border-2 border-dashed border-gray-400 bg-white/60'
            : 'border-dashed border-gray-300 bg-white/40'
        }`}
      >
        {slot && assignment ? (
          <DayProgramDialog
            inline
            isOpen
            program={assignment}
            selectedDate={dateFromKey(slot.date)}
            workoutStatus={getWorkoutStatus(slot.assignmentId, slot.date)}
            onRefresh={handleRefresh}
            onClose={() => {
              setSlots(prev => {
                const next = [...prev];
                next[index] = null;
                return next;
              });
              window.dispatchEvent(
                new CustomEvent('bubble-drop-zone-show', {
                  detail: { assignmentId: slot.assignmentId, date: slot.date },
                })
              );
            }}
            onDateChange={d =>
              setSlots(prev => {
                const next = [...prev];
                next[index] = {
                  assignmentId: slot.assignmentId,
                  date: format(d, 'yyyy-MM-dd'),
                };
                return next;
              })
            }
          />
        ) : (
          <button
            type="button"
            onClick={() => setPickerSlot(index)}
            className="h-full w-full flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-black hover:bg-gray-50 transition-colors"
          >
            <LayoutGrid className="h-8 w-8" />
            <span className="text-sm font-medium">Θέση {index + 1}</span>
            <span className="text-xs">Σύρε ένα bubble ή κλικ για επιλογή</span>
          </button>
        )}
      </div>
    );
  };

  if (authLoading || rolesLoading) return <CustomLoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  return (
    <div className="h-screen bg-gray-100 flex w-full overflow-hidden">
      {!isFullscreen && (
        <div className="hidden lg:block">
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>
      )}

      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-lg">
            <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileSidebar(true)}
              className="rounded-none lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <LayoutGrid className="h-5 w-5" />
            <h1 className="text-base font-semibold">Προβολή Ημέρας — 6 Θέσεις</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-gray-500">
              Σύρε ένα bubble μέσα σε μια θέση
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLayoutMode(prev => (prev === 'grid' ? 'carousel' : 'grid'));
                setCarouselPage(0);
              }}
              className="rounded-none"
              title={layoutMode === 'grid' ? 'Αλλαγή σε carousel' : 'Αλλαγή σε πλέγμα'}
            >
              {layoutMode === 'grid' ? (
                <GalleryHorizontal className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullscreen} className="rounded-none">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Grid / Carousel με 6 θέσεις */}
        <div className="flex-1 min-h-0 p-2">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Φόρτωση προγραμμάτων...
            </div>
          ) : layoutMode === 'grid' ? (
            <div className="h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-rows-6 sm:grid-rows-3 lg:grid-rows-2 gap-2">
              {slots.map((_, index) => renderSlot(index))}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex-1 relative overflow-hidden">
                <div
                  className="h-full flex transition-transform duration-300 ease-in-out"
                  style={{
                    transform: `translateX(-${carouselPage * 100}%)`,
                    width: `${Math.ceil(SLOT_COUNT / CAROUSEL_SLOTS_PER_PAGE) * 100}%`,
                  }}
                >
                  {Array.from({ length: Math.ceil(SLOT_COUNT / CAROUSEL_SLOTS_PER_PAGE) }).map((_, pageIndex) => (
                    <div
                      key={pageIndex}
                      className="h-full flex gap-2"
                      style={{ width: `${100 / Math.ceil(SLOT_COUNT / CAROUSEL_SLOTS_PER_PAGE)}%` }}
                    >
                      {slots
                        .slice(
                          pageIndex * CAROUSEL_SLOTS_PER_PAGE,
                          pageIndex * CAROUSEL_SLOTS_PER_PAGE + CAROUSEL_SLOTS_PER_PAGE
                        )
                        .map((_, offset) => renderSlot(pageIndex * CAROUSEL_SLOTS_PER_PAGE + offset))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 py-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCarouselPage(p => Math.max(0, p - 1))}
                  disabled={carouselPage === 0}
                  className="rounded-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  {carouselPage + 1} / {maxCarouselPage + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCarouselPage(p => Math.min(maxCarouselPage, p + 1))}
                  disabled={carouselPage === maxCarouselPage}
                  className="rounded-none"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bubbles σημερινών προγραμμάτων */}
        <TodaysBubbles
          programsForToday={programsForToday}
          workoutCompletions={workoutCompletions}
          todayStr={todayStr}
          onProgramClick={handleProgramClick}
          openWorkoutIds={new Set()}
        />

        <SlotProgramPickerDialog
          isOpen={pickerSlot !== null}
          onClose={() => setPickerSlot(null)}
          activePrograms={activePrograms}
          workoutCompletions={workoutCompletions}
          onSelect={(assignment, date) => {
            if (pickerSlot === null) return;
            placeInSlot(
              pickerSlot,
              assignment.id,
              format(date, 'yyyy-MM-dd'),
              assignment.app_users?.name
            );
            setPickerSlot(null);
          }}
        />
      </div>
    </div>
  );
};

export default DayCardsView;
