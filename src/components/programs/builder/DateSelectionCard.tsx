
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";

interface DateSelectionCardProps {
  selectedDates: string[];
  daysPerWeek: number;
  totalWeeks: number;
  totalRequiredSessions: number;
  onDateSelect: (date: Date | undefined) => void;
  onClearAllDates: () => void;
  isDateSelected: (date: Date) => boolean;
  isDateDisabled: (date: Date) => boolean;
  completedDates?: string[];
  editMode?: boolean;
}

export const DateSelectionCard: React.FC<DateSelectionCardProps> = ({
  selectedDates,
  daysPerWeek,
  totalWeeks,
  totalRequiredSessions,
  onDateSelect,
  onClearAllDates,
  isDateSelected,
  isDateDisabled,
  completedDates = [],
  editMode = false
}) => {
  const isDateCompleted = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return completedDates.includes(dateString);
  };

  const getWeekProgress = () => {
    if (selectedDates.length === 0) return [];
    
    const progress: Array<{weekIndex: number, selected: number, required: number}> = [];
    
    // Ομαδοποίηση των επιλεγμένων ημερομηνιών ανά εβδομάδα
    const datesByWeek = new Map<string, string[]>();
    
    selectedDates.forEach(dateString => {
      const date = parseISO(dateString);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!datesByWeek.has(weekKey)) {
        datesByWeek.set(weekKey, []);
      }
      datesByWeek.get(weekKey)!.push(dateString);
    });

    // Δημιουργία στατιστικών για κάθε εβδομάδα
    Array.from(datesByWeek.entries()).forEach(([weekKey, dates], index) => {
      progress.push({
        weekIndex: index + 1,
        selected: dates.length,
        required: daysPerWeek
      });
    });

    return progress;
  };

  const weekProgress = getWeekProgress();

  const getDayContent = (date: Date) => {
    const isCompleted = isDateCompleted(date);
    const isSelected = isDateSelected(date);
    
    if (isCompleted) {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <span className="text-xs">{date.getDate()}</span>
          <CheckCircle2 className="w-3 h-3 text-green-600 absolute -top-1 -right-1" />
        </div>
      );
    }
    
    return <span>{date.getDate()}</span>;
  };

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
              {selectedDates.length}/{totalRequiredSessions} προπονήσεις
            </span>
            {selectedDates.length > 0 && (
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
          <div className="text-sm text-gray-600">
            <p>Επιλέξτε {totalRequiredSessions} ημερομηνίες για {totalWeeks} εβδομάδες × {daysPerWeek} ημέρες/εβδομάδα</p>
            <p className="text-xs text-blue-600 mt-1">
              💡 Κάθε εβδομάδα πρέπει να έχει ακριβώς {daysPerWeek} προπονήσεις
            </p>
            {editMode && completedDates.length > 0 && (
              <p className="text-green-600 mt-1">
                ✓ Πράσινες ημερομηνίες: Ολοκληρωμένες προπονήσεις
              </p>
            )}
          </div>

          {weekProgress.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-none border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Πρόοδος ανά εβδομάδα:</h4>
              <div className="space-y-1">
                {weekProgress.map((week) => (
                  <div key={week.weekIndex} className="flex items-center gap-2 text-xs">
                    <span className="text-blue-700">Εβδομάδα {week.weekIndex}:</span>
                    <span className={`${week.selected === week.required ? 'text-green-600' : 'text-orange-600'}`}>
                      {week.selected}/{week.required} προπονήσεις
                    </span>
                    {week.selected === week.required ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-orange-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-center">
            <Calendar
              mode="multiple"
              selected={selectedDates.map(date => parseISO(date))}
              onDayClick={onDateSelect}
              disabled={isDateDisabled}
              className="rounded-none border"
              components={{
                DayContent: ({ date }) => getDayContent(date)
              }}
              modifiers={{
                completed: (date) => isDateCompleted(date),
                selected: (date) => isDateSelected(date)
              }}
              modifiersStyles={{
                completed: {
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  fontWeight: 'bold'
                },
                selected: {
                  backgroundColor: '#00ffba',
                  color: '#000000'
                }
              }}
            />
          </div>

          {selectedDates.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Επιλεγμένες Ημερομηνίες:</h4>
              <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {selectedDates.map((date, index) => {
                  const isCompleted = completedDates.includes(date);
                  return (
                    <div 
                      key={date} 
                      className={`text-xs p-2 rounded-none border flex items-center justify-between ${
                        isCompleted 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span>{format(parseISO(date), 'dd/MM/yyyy')}</span>
                      {isCompleted && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
