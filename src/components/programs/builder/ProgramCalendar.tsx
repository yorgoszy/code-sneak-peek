
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { format, addWeeks, getDay } from "date-fns";
import { cn } from "@/lib/utils";

interface ProgramCalendarProps {
  startDate: Date | undefined;
  trainingDays: string[];
  totalWeeks: number;
  onStartDateChange: (date: Date | undefined) => void;
  onTrainingDaysChange: (days: string[]) => void;
}

const weekDays = [
  { id: 'monday', label: 'Δευτέρα', dayNumber: 1 },
  { id: 'tuesday', label: 'Τρίτη', dayNumber: 2 },
  { id: 'wednesday', label: 'Τετάρτη', dayNumber: 3 },
  { id: 'thursday', label: 'Πέμπτη', dayNumber: 4 },
  { id: 'friday', label: 'Παρασκευή', dayNumber: 5 },
  { id: 'saturday', label: 'Σάββατο', dayNumber: 6 },
  { id: 'sunday', label: 'Κυριακή', dayNumber: 0 }
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

  const handleDayClick = (date: Date) => {
    const dayOfWeek = getDay(date);
    const dayId = weekDays.find(day => day.dayNumber === dayOfWeek)?.id;
    
    if (dayId) {
      const newDays = trainingDays.includes(dayId)
        ? trainingDays.filter(d => d !== dayId)
        : [...trainingDays, dayId];
      onTrainingDaysChange(newDays);
    }
  };

  const isTrainingDay = (date: Date) => {
    const dayOfWeek = getDay(date);
    const dayId = weekDays.find(day => day.dayNumber === dayOfWeek)?.id;
    return dayId ? trainingDays.includes(dayId) : false;
  };

  const endDate = calculateEndDate();

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-lg">Χρονοδιάγραμμα Προγράμματος</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Ημερομηνίες */}
          <div className="space-y-4">
            {/* Ημερομηνία Έναρξης */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Ημερομηνία Έναρξης</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-40 justify-start text-left font-normal rounded-none h-8",
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
                    weekStartsOn={1}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Ημερομηνία Λήξης */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Ημερομηνία Λήξης</Label>
              <div className="w-40 h-8 px-3 py-2 bg-gray-100 border border-gray-300 rounded-none text-sm flex items-center">
                {endDate ? format(endDate, "dd/MM/yyyy") : "Αυτόματος υπολογισμός"}
              </div>
              {trainingDays.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {trainingDays.length} μέρες/εβδομάδα • {totalWeeks} εβδομάδες
                </p>
              )}
            </div>
          </div>

          {/* Ημερολόγιο Επιλογής Μερών */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Επιλογή Μερών Προπόνησης
              <span className="block text-xs text-gray-500 mt-1">
                Κάντε κλικ στις μέρες για να τις επιλέξετε
              </span>
            </Label>
            <div className="border border-gray-300 rounded-none p-2">
              <Calendar
                mode="multiple"
                selected={[]} // Δεν χρησιμοποιούμε την επιλογή του Calendar
                onDayClick={handleDayClick}
                className={cn("p-2 pointer-events-auto")}
                weekStartsOn={1}
                modifiers={{
                  trainingDay: isTrainingDay
                }}
                modifiersClassNames={{
                  trainingDay: "bg-blue-500 text-white hover:bg-blue-600"
                }}
                components={{
                  Caption: ({ displayMonth }) => (
                    <div className="flex justify-center items-center py-2">
                      <h4 className="text-sm font-medium">
                        {format(displayMonth, "MMMM yyyy")}
                      </h4>
                    </div>
                  )
                }}
              />
            </div>
            
            {/* Επιλεγμένες Μέρες */}
            {trainingDays.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 mb-1">Επιλεγμένες μέρες:</p>
                <div className="flex flex-wrap gap-1">
                  {trainingDays.map(dayId => {
                    const day = weekDays.find(d => d.id === dayId);
                    return day ? (
                      <span key={dayId} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {day.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
