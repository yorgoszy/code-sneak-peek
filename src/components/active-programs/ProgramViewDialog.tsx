
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Clock, Dumbbell } from "lucide-react";
import { ExerciseBlock } from "@/components/user-profile/daily-program/ExerciseBlock";
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
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto rounded-none">
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
          {/* Εβδομάδες Tabs */}
          <Tabs value={selectedWeekIndex.toString()} onValueChange={(value) => setSelectedWeekIndex(parseInt(value))}>
            <TabsList className="grid grid-cols-auto w-full rounded-none">
              {weeks.map((week, index) => (
                <TabsTrigger key={week.id} value={index.toString()} className="rounded-none">
                  {week.name || `Εβδομάδα ${week.week_number}`}
                </TabsTrigger>
              ))}
            </TabsList>

            {weeks.map((week, weekIndex) => (
              <TabsContent key={week.id} value={weekIndex.toString()} className="mt-4">
                {/* Ημέρες Tabs */}
                <Tabs defaultValue="0" className="w-full">
                  <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                    {days.map((day, dayIndex) => (
                      <TabsTrigger key={day.id} value={dayIndex.toString()} className="rounded-none">
                        {day.name || `Ημέρα ${day.day_number}`}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {days.map((day, dayIndex) => (
                    <TabsContent key={day.id} value={dayIndex.toString()} className="mt-4">
                      <div className="bg-white border border-gray-200 rounded-none p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                              <Dumbbell className="h-5 w-5" />
                              <span>{day.name || `Ημέρα ${day.day_number}`}</span>
                            </h3>
                          </div>
                          {day.estimated_duration_minutes && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{day.estimated_duration_minutes} λεπτά</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <ExerciseBlock blocks={day.program_blocks} />
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
