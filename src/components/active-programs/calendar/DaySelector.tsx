
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Dumbbell } from "lucide-react";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface DaySelectorProps {
  assignment: EnrichedAssignment | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectDay: (weekIndex: number, dayIndex: number) => void;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  assignment,
  isOpen,
  onClose,
  onSelectDay
}) => {
  if (!assignment || !assignment.programs) return null;

  const program = assignment.programs;
  const weeks = program.program_weeks || [];

  const handleDayClick = (weekIndex: number, dayIndex: number) => {
    onSelectDay(weekIndex, dayIndex);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Επιλογή Ημέρας Προπόνησης
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Επιλέξτε ποια ημέρα του προγράμματος θέλετε να ξεκινήσετε:
          </p>

          {weeks.map((week, weekIndex) => (
            <div key={week.id} className="border border-gray-200 rounded-none">
              <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  {week.name || `Εβδομάδα ${week.week_number}`}
                </h3>
              </div>
              
              <div className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {week.program_days?.map((day, dayIndex) => (
                    <Button
                      key={day.id}
                      variant="outline"
                      onClick={() => handleDayClick(weekIndex, dayIndex)}
                      className="rounded-none justify-start h-auto p-3"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Dumbbell className="w-4 h-4 text-[#00ffba]" />
                        <div className="text-left">
                          <div className="font-medium text-sm">
                            {day.name || `Ημέρα ${day.day_number}`}
                          </div>
                          {day.estimated_duration_minutes && (
                            <div className="text-xs text-gray-500">
                              {day.estimated_duration_minutes} λεπτά
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
