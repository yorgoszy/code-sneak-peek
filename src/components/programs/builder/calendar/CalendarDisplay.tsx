
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Trash2 } from "lucide-react";
import { parseISO } from "date-fns";
import { el } from "date-fns/locale";

interface CalendarDisplayProps {
  selectedDatesAsStrings: string[];
  totalDays: number;
  currentWeekInfo: any;
  onDateSelect: (date: Date | undefined) => void;
  onClearAllDates: () => void;
  isDateSelected: (date: Date) => boolean;
  isDateDisabled: (date: Date) => boolean;
}

export const CalendarDisplay: React.FC<CalendarDisplayProps> = ({
  selectedDatesAsStrings,
  totalDays,
  currentWeekInfo,
  onDateSelect,
  onClearAllDates,
  isDateSelected,
  isDateDisabled
}) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Επιλογή Ημερομηνιών Προπόνησης
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedDatesAsStrings.length}/{totalDays} προπονήσεις
            </span>
            {selectedDatesAsStrings.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAllDates}
                className="rounded-none"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Καθαρισμός
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {currentWeekInfo ? (
            <div className="text-sm text-gray-600">
              <p className="font-medium text-blue-700">
                Συμπληρώνετε: {currentWeekInfo.weekStructure.name}
              </p>
              <p>
                Επιλέξτε {currentWeekInfo.remainingForThisWeek} από {currentWeekInfo.weekStructure.daysCount} ημερομηνίες
              </p>
              <p className="text-xs text-green-600 mt-1">
                ✅ Έχετε επιλέξει {currentWeekInfo.alreadySelected} ημερομηνίες για αυτή την εβδομάδα
              </p>
            </div>
          ) : (
            <div className="text-sm text-green-600 font-medium">
              🎉 Όλες οι εβδομάδες έχουν ολοκληρωθεί!
            </div>
          )}
          
          <div className="flex justify-center">
            <Calendar
              mode="multiple"
              selected={selectedDatesAsStrings.map(date => parseISO(date))}
              onDayClick={onDateSelect}
              disabled={isDateDisabled}
              className="rounded-none border"
              locale={el}
              modifiers={{
                selected: (date) => isDateSelected(date)
              }}
              modifiersStyles={{
                selected: {
                  backgroundColor: '#00ffba',
                  color: '#000000'
                }
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
