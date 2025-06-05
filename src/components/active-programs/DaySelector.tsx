
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
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
  if (!assignment?.programs?.program_weeks) return null;

  const weeks = assignment.programs.program_weeks;

  const handleDaySelect = (weekIndex: number, dayIndex: number) => {
    onSelectDay(weekIndex, dayIndex);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Επιλογή Ημέρας Προπόνησης
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {weeks.map((week, weekIndex) => (
            <div key={week.id} className="border border-gray-200 rounded-none p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                {week.name || `Εβδομάδα ${week.week_number}`}
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                {week.program_days?.map((day, dayIndex) => (
                  <Button
                    key={day.id}
                    onClick={() => handleDaySelect(weekIndex, dayIndex)}
                    variant="outline"
                    className="rounded-none text-left"
                  >
                    {day.name || `Ημέρα ${day.day_number}`}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
