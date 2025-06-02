
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";

interface ProgramViewerProps {
  assignment: EnrichedAssignment;
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'start';
}

export const ProgramViewer: React.FC<ProgramViewerProps> = ({ 
  assignment, 
  isOpen, 
  onClose, 
  mode 
}) => {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [completions, setCompletions] = useState<any[]>([]);
  const { getWorkoutCompletions, completeWorkout, loading } = useWorkoutCompletions();

  useEffect(() => {
    if (isOpen && assignment.id) {
      fetchCompletions();
    }
  }, [isOpen, assignment.id]);

  const fetchCompletions = async () => {
    try {
      const data = await getWorkoutCompletions(assignment.id);
      setCompletions(data);
    } catch (error) {
      console.error('Error fetching completions:', error);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!assignment.programs?.program_weeks) return;
    
    const currentWeek = assignment.programs.program_weeks[selectedWeek];
    const currentDay = currentWeek?.program_days?.[selectedDay];
    
    if (!currentWeek || !currentDay) return;

    try {
      const scheduledDate = new Date().toISOString().split('T')[0];
      await completeWorkout(
        assignment.id,
        assignment.program_id,
        currentWeek.week_number,
        currentDay.day_number,
        scheduledDate
      );
      
      await fetchCompletions();
      onClose();
    } catch (error) {
      console.error('Error completing workout:', error);
    }
  };

  const isWorkoutCompleted = (weekNumber: number, dayNumber: number) => {
    return completions.some(c => 
      c.week_number === weekNumber && 
      c.day_number === dayNumber && 
      c.status === 'completed'
    );
  };

  const currentWeek = assignment.programs?.program_weeks?.[selectedWeek];
  const currentDay = currentWeek?.program_days?.[selectedDay];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>
            {mode === 'start' ? 'Έναρξη Προπονήσης' : 'Προβολή Προγράμματος'} - {assignment.programs?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Week Selection */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Επιλογή Εβδομάδας</h3>
            <div className="flex gap-2 flex-wrap">
              {assignment.programs?.program_weeks?.map((week, index) => (
                <Button
                  key={week.id}
                  variant={selectedWeek === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedWeek(index)}
                  className="rounded-none"
                >
                  {week.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Day Selection */}
          {currentWeek && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Επιλογή Ημέρας</h3>
              <div className="flex gap-2 flex-wrap">
                {currentWeek.program_days?.map((day, index) => {
                  const completed = isWorkoutCompleted(currentWeek.week_number, day.day_number);
                  return (
                    <Button
                      key={day.id}
                      variant={selectedDay === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDay(index)}
                      className="rounded-none flex items-center gap-2"
                    >
                      {day.name}
                      {completed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Workout Details */}
          {currentDay && (
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {currentDay.name}
                  {isWorkoutCompleted(currentWeek.week_number, currentDay.day_number) && (
                    <Badge variant="secondary" className="rounded-none">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Ολοκληρωμένο
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

                {mode === 'start' && !isWorkoutCompleted(currentWeek.week_number, currentDay.day_number) && (
                  <div className="pt-4 border-t">
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
