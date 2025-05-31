
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { format, addDays, addWeeks } from "date-fns";
import { cn } from "@/lib/utils";

interface ProgramCalendarProps {
  startDate: Date | undefined;
  trainingDays: string[];
  totalWeeks: number;
  onStartDateChange: (date: Date | undefined) => void;
  onTrainingDaysChange: (days: string[]) => void;
}

const weekDays = [
  { id: 'monday', label: 'Δευτέρα' },
  { id: 'tuesday', label: 'Τρίτη' },
  { id: 'wednesday', label: 'Τετάρτη' },
  { id: 'thursday', label: 'Πέμπτη' },
  { id: 'friday', label: 'Παρασκευή' },
  { id: 'saturday', label: 'Σάββατο' },
  { id: 'sunday', label: 'Κυριακή' }
];

export const ProgramCalendar: React.FC<ProgramCalendarProps> = ({
  startDate,
  trainingDays,
  totalWeeks,
  onStartDateChange,
  onTrainingDaysChange
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const calculateEndDate = () => {
    if (!startDate || totalWeeks === 0) return null;
    return addWeeks(startDate, totalWeeks);
  };

  const handleDayToggle = (dayId: string) => {
    const newDays = trainingDays.includes(dayId)
      ? trainingDays.filter(d => d !== dayId)
      : [...trainingDays, dayId];
    onTrainingDaysChange(newDays);
  };

  const endDate = calculateEndDate();

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-lg">Χρονοδιάγραμμα Προγράμματος</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Ημερομηνία Έναρξης */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Ημερομηνία Έναρξης</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-none h-8",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Επιλέξτε ημερομηνία"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-none" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    onStartDateChange(date);
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Μέρες Προπόνησης */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Μέρες Προπόνησης</Label>
            <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto">
              {weekDays.map(day => (
                <div
                  key={day.id}
                  className={cn(
                    "flex items-center space-x-1 p-1 rounded cursor-pointer hover:bg-gray-50 text-xs",
                    trainingDays.includes(day.id) && "bg-blue-50 text-blue-700"
                  )}
                  onClick={() => handleDayToggle(day.id)}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded border",
                      trainingDays.includes(day.id)
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    )}
                  />
                  <span className="text-xs">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ημερομηνία Λήξης */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Ημερομηνία Λήξης</Label>
            <div className="w-full h-8 px-3 py-2 bg-gray-100 border border-gray-300 rounded-none text-sm flex items-center">
              {endDate ? format(endDate, "dd/MM/yyyy") : "Αυτόματος υπολογισμός"}
            </div>
            {trainingDays.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {trainingDays.length} μέρες/εβδομάδα • {totalWeeks} εβδομάδες
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
