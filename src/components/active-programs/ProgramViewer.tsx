
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { ProgramViewerHeader } from './viewer/ProgramViewerHeader';
import { WeekDaySelector } from './viewer/WeekDaySelector';
import { WorkoutTimerDisplay } from './viewer/WorkoutTimerDisplay';
import { WorkoutDetailsView } from './viewer/WorkoutDetailsView';
import { WorkoutControls } from './viewer/WorkoutControls';

interface ProgramViewerProps {
  assignment: EnrichedAssignment;
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'start';
  selectedWeek?: number;
  selectedDay?: number;
}

export const ProgramViewer: React.FC<ProgramViewerProps> = ({ 
  assignment, 
  isOpen, 
  onClose, 
  mode,
  selectedWeek = 0,
  selectedDay = 0
}) => {
  const [currentSelectedWeek, setCurrentSelectedWeek] = useState(selectedWeek);
  const [currentSelectedDay, setCurrentSelectedDay] = useState(selectedDay);
  const [completions, setCompletions] = useState<any[]>([]);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const { getWorkoutCompletions, completeWorkout, loading } = useWorkoutCompletions();

  useEffect(() => {
    if (isOpen && assignment.id) {
      fetchCompletions();
    }
  }, [isOpen, assignment.id]);

  useEffect(() => {
    if (mode === 'start' && selectedWeek !== undefined && selectedDay !== undefined) {
      setCurrentSelectedWeek(selectedWeek);
      setCurrentSelectedDay(selectedDay);
    }
  }, [mode, selectedWeek, selectedDay]);

  const fetchCompletions = async () => {
    try {
      const data = await getWorkoutCompletions(assignment.id);
      setCompletions(data);
    } catch (error) {
      console.error('Error fetching completions:', error);
    }
  };

  const handleStartWorkout = () => {
    const startTime = new Date();
    setWorkoutStartTime(startTime);
    setIsWorkoutActive(true);
    console.log('Έναρξη προπόνησης:', startTime);
  };

  const handleCompleteWorkout = async () => {
    if (!assignment.programs?.program_weeks || !workoutStartTime) return;
    
    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - workoutStartTime.getTime()) / 60000);
    
    const currentWeek = assignment.programs.program_weeks[currentSelectedWeek];
    const currentDay = currentWeek?.program_days?.[currentSelectedDay];
    
    if (!currentWeek || !currentDay) return;

    try {
      const scheduledDate = new Date().toISOString().split('T')[0];
      await completeWorkout(
        assignment.id,
        assignment.program_id,
        currentWeek.week_number,
        currentDay.day_number,
        scheduledDate,
        undefined,
        workoutStartTime,
        endTime,
        durationMinutes
      );
      
      setIsWorkoutActive(false);
      setWorkoutStartTime(null);
      await fetchCompletions();
      onClose();
    } catch (error) {
      console.error('Error completing workout:', error);
    }
  };

  const handleStopWorkout = () => {
    setIsWorkoutActive(false);
    setWorkoutStartTime(null);
  };

  const isWorkoutCompleted = (weekNumber: number, dayNumber: number) => {
    return completions.some(c => 
      c.week_number === weekNumber && 
      c.day_number === dayNumber && 
      c.status === 'completed'
    );
  };

  const isWorkoutMissed = (weekNumber: number, dayNumber: number) => {
    return completions.some(c => 
      c.week_number === weekNumber && 
      c.day_number === dayNumber && 
      c.status === 'missed'
    );
  };

  const getFilteredWeeks = () => {
    if (mode !== 'start') {
      return assignment.programs?.program_weeks || [];
    }

    return (assignment.programs?.program_weeks || []).map(week => ({
      ...week,
      program_days: (week.program_days || []).filter(day => 
        !isWorkoutCompleted(week.week_number, day.day_number)
      )
    })).filter(week => week.program_days.length > 0);
  };

  const handleWeekDaySelect = (weekIndex: number, dayIndex: number) => {
    setCurrentSelectedWeek(weekIndex);
    setCurrentSelectedDay(dayIndex);
  };

  const weeks = mode === 'start' ? getFilteredWeeks() : assignment.programs?.program_weeks || [];
  const currentWeek = weeks[currentSelectedWeek];
  const currentDay = currentWeek?.program_days?.[currentSelectedDay];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto rounded-none">
        <ProgramViewerHeader assignment={assignment} mode={mode} />

        <div className="space-y-4">
          <WeekDaySelector
            weeks={weeks}
            currentSelectedWeek={currentSelectedWeek}
            currentSelectedDay={currentSelectedDay}
            mode={mode}
            isWorkoutCompleted={isWorkoutCompleted}
            isWorkoutMissed={isWorkoutMissed}
            onWeekDaySelect={handleWeekDaySelect}
          />

          <WorkoutTimerDisplay
            isVisible={mode === 'start' && isWorkoutActive && !!workoutStartTime}
            startTime={workoutStartTime!}
          />

          {currentDay && (
            <>
              <WorkoutDetailsView currentDay={currentDay} />
              <WorkoutControls
                mode={mode}
                isWorkoutActive={isWorkoutActive}
                loading={loading}
                onStartWorkout={handleStartWorkout}
                onCompleteWorkout={handleCompleteWorkout}
                onStopWorkout={handleStopWorkout}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
