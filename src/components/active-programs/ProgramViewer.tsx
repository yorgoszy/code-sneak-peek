
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, Play, Square, XCircle } from "lucide-react";
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

  // Φιλτράρουμε μόνο τις μη ολοκληρωμένες εβδομάδες και ημέρες για mode 'start'
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

  const filteredWeeks = getFilteredWeeks();
  const currentWeek = filteredWeeks[currentSelectedWeek];
  const currentDay = currentWeek?.program_days?.[currentSelectedDay];

  const title = mode === 'start' 
    ? `Έναρξη Προπονήσης - ${currentWeek?.name} - ${currentDay?.name}`
    : `Προβολή Προγράμματος - ${assignment.programs?.name}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {mode === 'view' && (
            <>
              {/* Week Selection - Only in view mode */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Επιλογή Εβδομάδας</h3>
                <div className="flex gap-2 flex-wrap">
                  {filteredWeeks.map((week, index) => (
                    <Button
                      key={week.id}
                      variant={currentSelectedWeek === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentSelectedWeek(index)}
                      className="rounded-none"
                    >
                      {week.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Day Selection - Only in view mode */}
              {currentWeek && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Επιλογή Ημέρας</h3>
                  <div className="flex gap-2 flex-wrap">
                    {currentWeek.program_days?.map((day, index) => {
                      const completed = isWorkoutCompleted(currentWeek.week_number, day.day_number);
                      const missed = isWorkoutMissed(currentWeek.week_number, day.day_number);
                      
                      return (
                        <Button
                          key={day.id}
                          variant={currentSelectedDay === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentSelectedDay(index)}
                          className={`rounded-none flex items-center gap-2 ${
                            missed ? 'opacity-60' : ''
                          }`}
                        >
                          {day.name}
                          {completed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          {missed && <XCircle className="w-4 h-4 text-red-500" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'start' && (
            <>
              {/* Week Selection για start mode - μόνο μη ολοκληρωμένες */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Επιλογή Εβδομάδας</h3>
                <div className="flex gap-2 flex-wrap">
                  {filteredWeeks.map((week, index) => (
                    <Button
                      key={week.id}
                      variant={currentSelectedWeek === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentSelectedWeek(index)}
                      className="rounded-none"
                    >
                      {week.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Day Selection για start mode - μόνο μη ολοκληρωμένες */}
              {currentWeek && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Επιλογή Ημέρας</h3>
                  <div className="flex gap-2 flex-wrap">
                    {currentWeek.program_days?.map((day, index) => {
                      const missed = isWorkoutMissed(currentWeek.week_number, day.day_number);
                      
                      return (
                        <Button
                          key={day.id}
                          variant={currentSelectedDay === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentSelectedDay(index)}
                          className={`rounded-none flex items-center gap-2 ${
                            missed ? 'opacity-60 border-red-300' : ''
                          }`}
                        >
                          {day.name}
                          {missed && <XCircle className="w-4 h-4 text-red-500" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Workout Timer Display */}
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
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {currentDay.name}
                  {isWorkoutMissed(currentWeek.week_number, currentDay.day_number) && (
                    <Badge variant="destructive" className="rounded-none">
                      <XCircle className="w-4 h-4 mr-1" />
                      Χαμένη
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentDay.program_blocks?.map((block) => (
                  <div key={block.id} className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">{block.name}</h4>
                    <div className="space-y-2">
                      {block.program_exercises?.map((exercise) => (
                        <div key={exercise.id} className="border p-3 rounded-none bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{exercise.exercises?.name}</p>
                              <p className="text-sm text-gray-600">
                                {exercise.sets} series × {exercise.reps} επαναλήψεις
                                {exercise.kg && ` - ${exercise.kg} kg`}
                                {exercise.percentage_1rm && ` (${exercise.percentage_1rm}% 1RM)`}
                              </p>
                              {exercise.rest && (
                                <p className="text-xs text-gray-500">Ανάπαυση: {exercise.rest}</p>
                              )}
                            </div>
                          </div>
                          {exercise.notes && (
                            <p className="text-xs text-gray-600 mt-2">{exercise.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {mode === 'start' && (
                  <div className="pt-4 border-t space-y-3">
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
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
