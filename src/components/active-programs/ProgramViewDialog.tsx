
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Dumbbell, CheckCircle } from "lucide-react";
import { ExerciseBlock } from "@/components/user-profile/daily-program/ExerciseBlock";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: EnrichedAssignment | null;
}

export const ProgramViewDialog: React.FC<ProgramViewDialogProps> = ({
  isOpen,
  onClose,
  assignment
}) => {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [completions, setCompletions] = useState<any[]>([]);
  const { getWorkoutCompletions } = useWorkoutCompletions();

  useEffect(() => {
    if (isOpen && assignment?.id) {
      fetchCompletions();
    }
  }, [isOpen, assignment?.id]);

  const fetchCompletions = async () => {
    if (!assignment?.id) return;
    try {
      const data = await getWorkoutCompletions(assignment.id);
      setCompletions(data);
    } catch (error) {
      console.error('Error fetching completions:', error);
    }
  };

  const isWorkoutCompleted = (weekNumber: number, dayNumber: number) => {
    return completions.some(c => 
      c.week_number === weekNumber && 
      c.day_number === dayNumber && 
      c.status === 'completed'
    );
  };

  const isWeekCompleted = (weekNumber: number, totalDaysInWeek: number) => {
    const completedDays = completions.filter(c => 
      c.week_number === weekNumber && 
      c.status === 'completed'
    ).length;
    return completedDays === totalDaysInWeek;
  };

  const handleDayDoubleClick = (week: any, day: any) => {
    if (isWorkoutCompleted(week.week_number, day.day_number)) {
      console.log('Η προπόνηση έχει ήδη ολοκληρωθεί');
      return;
    }
    
    console.log('Έναρξη προπόνησης:', week.name, day.name);
    // Εδώ θα πρέπει να ανοίξεις το calendar dialog με τη συγκεκριμένη ημέρα
    // Μπορείς να καλέσεις ένα callback που θα περάσει ο γονέας
  };

  if (!assignment || !assignment.programs) return null;

  const program = assignment.programs;
  const weeks = program.program_weeks || [];

  if (weeks.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle>{program.name}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-gray-500">
            Δεν υπάρχουν εβδομάδες στο πρόγραμμα
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const selectedWeek = weeks[selectedWeekIndex];
  const days = selectedWeek?.program_days || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{program.name}</span>
            <Badge variant="outline" className="rounded-none">
              {assignment.status}
            </Badge>
          </DialogTitle>
          {program.description && (
            <p className="text-sm text-gray-600">{program.description}</p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Εβδομάδες - Οριζόντια Layout */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
            {weeks.map((week, weekIndex) => {
              const isCompleted = isWeekCompleted(week.week_number, week.program_days?.length || 0);
              
              return (
                <div key={week.id} className="border border-gray-200 rounded-none">
                  <div className="bg-gray-50 p-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {isCompleted && <CheckCircle className="w-5 h-5 text-[#00ffba]" />}
                      {week.name || `Εβδομάδα ${week.week_number}`}
                    </h3>
                  </div>
                  
                  <div className="p-3">
                    {/* Ημέρες Tabs για αυτή την εβδομάδα */}
                    <Tabs defaultValue="0" className="w-full">
                      <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${week.program_days?.length || 1}, 1fr)` }}>
                        {week.program_days?.map((day, dayIndex) => {
                          const isDayCompleted = isWorkoutCompleted(week.week_number, day.day_number);
                          
                          return (
                            <TabsTrigger 
                              key={day.id} 
                              value={dayIndex.toString()} 
                              className="rounded-none text-xs flex items-center gap-1"
                              onDoubleClick={() => handleDayDoubleClick(week, day)}
                            >
                              {isDayCompleted && <CheckCircle className="w-3 h-3 text-[#00ffba]" />}
                              {day.name || `Ημέρα ${day.day_number}`}
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>

                      {week.program_days?.map((day, dayIndex) => (
                        <TabsContent key={day.id} value={dayIndex.toString()} className="mt-4">
                          <div className="bg-white border border-gray-200 rounded-none p-3">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                                  <Dumbbell className="h-4 w-4" />
                                  <span>{day.name || `Ημέρα ${day.day_number}`}</span>
                                  {isWorkoutCompleted(week.week_number, day.day_number) && (
                                    <CheckCircle className="w-4 h-4 text-[#00ffba]" />
                                  )}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">Διπλό κλικ για έναρξη προπόνησης</p>
                              </div>
                              {day.estimated_duration_minutes && (
                                <div className="flex items-center space-x-1 text-xs text-gray-600">
                                  <Clock className="h-3 w-3" />
                                  <span>{day.estimated_duration_minutes} λεπτά</span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <ExerciseBlock blocks={day.program_blocks} viewOnly={true} />
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
