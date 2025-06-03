
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, Play, Square, XCircle, Dumbbell } from "lucide-react";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";

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

  // Για start mode, φιλτράρουμε μόνο τις μη ολοκληρωμένες εβδομάδες και ημέρες
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

  const weeks = mode === 'start' ? getFilteredWeeks() : assignment.programs?.program_weeks || [];
  const currentWeek = weeks[currentSelectedWeek];
  const currentDay = currentWeek?.program_days?.[currentSelectedDay];

  const title = mode === 'start' 
    ? `Έναρξη Προπονήσης - ${assignment.programs?.name}`
    : `Προβολή Προγράμματος - ${assignment.programs?.name}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Badge variant="outline" className="rounded-none">
              {assignment.status}
            </Badge>
          </DialogTitle>
          {assignment.programs?.description && (
            <p className="text-sm text-gray-600">{assignment.programs.description}</p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Εβδομάδες - Οριζόντια Layout όπως στο ProgramViewDialog */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
            {weeks.map((week, weekIndex) => (
              <div key={week.id} className="border border-gray-200 rounded-none">
                <div className="bg-gray-50 p-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    {week.name || `Εβδομάδα ${week.week_number}`}
                  </h3>
                </div>
                
                <div className="p-3">
                  {/* Ημέρες για αυτή την εβδομάδα */}
                  <div className="space-y-2">
                    {week.program_days?.map((day, dayIndex) => {
                      const completed = isWorkoutCompleted(week.week_number, day.day_number);
                      const missed = isWorkoutMissed(week.week_number, day.day_number);
                      const isSelected = currentSelectedWeek === weekIndex && currentSelectedDay === dayIndex;
                      
                      return (
                        <Button
                          key={day.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setCurrentSelectedWeek(weekIndex);
                            setCurrentSelectedDay(dayIndex);
                          }}
                          className={`w-full justify-start rounded-none flex items-center gap-2 ${
                            missed ? 'opacity-60 border-red-300' : ''
                          }`}
                        >
                          {day.name || `Ημέρα ${day.day_number}`}
                          {mode === 'view' && completed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          {mode === 'view' && missed && <XCircle className="w-4 h-4 text-red-500" />}
                          {mode === 'start' && missed && <XCircle className="w-4 h-4 text-red-500" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Workout Timer Display για start mode */}
          {mode === 'start' && isWorkoutActive && workoutStartTime && (
            <div className="bg-blue-50 p-4 border border-blue-200 rounded-none">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Προπόνηση σε εξέλιξη - Ξεκίνησε στις {workoutStartTime.toLocaleTimeString('el-GR')}
                </span>
              </div>
            </div>
          )}

          {/* Workout Details */}
          {currentDay && (
            <div className="bg-white border border-gray-200 rounded-none p-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                    <Dumbbell className="h-4 w-4" />
                    <span>{currentDay.name || `Ημέρα ${currentDay.day_number}`}</span>
                  </h4>
                </div>
                {currentDay.estimated_duration_minutes && (
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>{currentDay.estimated_duration_minutes} λεπτά</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {currentDay.program_blocks?.map((block) => (
                  <div key={block.id} className="bg-gray-50 p-2 rounded-none border border-gray-200">
                    <h5 className="font-medium text-sm mb-2">
                      Block {block.block_order}: {block.name}
                    </h5>
                    {block.program_exercises && block.program_exercises.length > 0 ? (
                      <div className="space-y-2">
                        {block.program_exercises.map((exercise) => (
                          <div key={exercise.id} className="bg-white rounded-none border border-gray-200 p-2">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h6 className="text-sm font-medium text-gray-900">
                                  {exercise.exercises?.name || 'Άγνωστη άσκηση'}
                                </h6>
                              </div>
                            </div>
                            
                            {/* Exercise Details Grid */}
                            <div className="grid grid-cols-6 gap-2 text-xs">
                              <div className="text-center">
                                <div className="font-medium text-gray-600 mb-1">Sets</div>
                                <div className="text-gray-900">{exercise.sets || '-'}</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="font-medium text-gray-600 mb-1">Reps</div>
                                <div className="text-gray-900">{exercise.reps || '-'}</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="font-medium text-gray-600 mb-1">%1RM</div>
                                <div className="text-gray-900">{exercise.percentage_1rm ? `${exercise.percentage_1rm}%` : '-'}</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="font-medium text-gray-600 mb-1">Kg</div>
                                <div className="text-gray-900">{exercise.kg || '-'}</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="font-medium text-gray-600 mb-1">m/s</div>
                                <div className="text-gray-900">{exercise.velocity_ms || '-'}</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="font-medium text-gray-600 mb-1">Rest</div>
                                <div className="text-gray-900">{exercise.rest || '-'}</div>
                              </div>
                            </div>
                            
                            {exercise.tempo && (
                              <div className="mt-2 text-xs text-gray-600">
                                <span className="font-medium">Tempo:</span> {exercise.tempo}
                              </div>
                            )}
                            
                            {exercise.notes && (
                              <div className="mt-1 text-xs text-gray-600 italic">
                                {exercise.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Δεν υπάρχουν ασκήσεις</p>
                    )}
                  </div>
                ))}
              </div>

              {mode === 'start' && (
                <div className="pt-4 border-t space-y-3 mt-4">
                  {!isWorkoutActive ? (
                    <Button 
                      onClick={handleStartWorkout}
                      className="w-full rounded-none"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Έναρξη Προπονήσης
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        onClick={handleCompleteWorkout}
                        disabled={loading}
                        className="w-full rounded-none"
                      >
                        {loading ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Ολοκλήρωση...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Ολοκλήρωση Προπονήσης
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleStopWorkout}
                        className="w-full rounded-none"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Διακοπή Προπονήσης
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
