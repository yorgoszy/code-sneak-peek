
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import type { ProgramStructure } from './hooks/useProgramBuilderState';

interface CalendarSectionProps {
  program: ProgramStructure;
  totalDays: number;
  onTrainingDatesChange: (dates: Date[]) => void;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  program,
  totalDays,
  onTrainingDatesChange
}) => {
  if (totalDays === 0) {
    return null;
  }

  // Calculate days per week from the program structure
  const calculateDaysPerWeek = () => {
    if (!program.weeks || program.weeks.length === 0) return 2;
    
    const totalDaysInProgram = program.weeks.reduce((sum, week) => sum + (week.program_days?.length || 0), 0);
    return Math.round(totalDaysInProgram / program.weeks.length);
  };

  const daysPerWeek = calculateDaysPerWeek();
  const totalWeeks = program.weeks?.length || 0;

  // Convert training_dates from Date[] to string[]
  const selectedDatesAsStrings = (program.training_dates || []).map(date => {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = date.toISOString().split('T')[0];
    const currentDates = selectedDatesAsStrings.slice();
    
    if (currentDates.includes(dateString)) {
      // Remove date if already selected
      const newDates = currentDates.filter(d => d !== dateString);
      const datesAsObjects = newDates.map(dateStr => new Date(dateStr + 'T12:00:00'));
      onTrainingDatesChange(datesAsObjects);
    } else if (currentDates.length < totalDays) {
      // Add date if under limit
      const newDates = [...currentDates, dateString].sort();
      const datesAsObjects = newDates.map(dateStr => new Date(dateStr + 'T12:00:00'));
      onTrainingDatesChange(datesAsObjects);
    }
  };

  const handleClearAllDates = () => {
    onTrainingDatesChange([]);
  };

  const isDateSelected = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return selectedDatesAsStrings.includes(dateString);
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // If date is already selected, allow it (for deselection)
    if (isDateSelected(date)) return false;

    // Don't allow more selections if we've reached the limit
    return selectedDatesAsStrings.length >= totalDays;
  };

  const getWeekProgress = () => {
    if (selectedDatesAsStrings.length === 0) return [];
    
    const progress: Array<{weekIndex: number, selected: number, required: number}> = [];
    
    // Ομαδοποίηση των επιλεγμένων ημερομηνιών ανά εβδομάδα
    const datesByWeek = new Map<string, string[]>();
    
    selectedDatesAsStrings.forEach(dateString => {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left side - Calendar */}
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
                  onClick={handleClearAllDates}
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
              <p>Επιλέξτε {totalDays} ημερομηνίες για {totalWeeks} εβδομάδες × {daysPerWeek} ημέρες/εβδομάδα</p>
              <p className="text-xs text-blue-600 mt-1">
                💡 Κάθε εβδομάδα πρέπει να έχει ακριβώς {daysPerWeek} προπονήσεις
              </p>
            </div>
            
            <div className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={selectedDatesAsStrings.map(date => parseISO(date))}
                onDayClick={handleDateSelect}
                disabled={isDateDisabled}
                className="rounded-none border"
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

      {/* Right side - Program Details */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Απαιτήσεις Προγράμματος</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Program Stats */}
            <div className="bg-gray-50 p-4 rounded-none">
              <h4 className="font-semibold text-gray-900 mb-3">Εβδομάδες: {totalWeeks}</h4>
              <div className="space-y-2">
                {program.weeks?.map((week, index) => (
                  <div key={week.id} className="text-sm">
                    <span className="font-medium">Εβδομάδα {week.week_number}:</span>
                    <span className="ml-2 text-gray-600">
                      {week.program_days?.length || 0} ημέρες
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm font-medium text-blue-700">
                  Συνολικές ημέρες: {totalDays}
                </div>
                <div className="text-sm text-gray-600">
                  Προγραμματισμένη Δομή: {totalDays} ημέρες σε {totalWeeks} εβδομάδες
                </div>
              </div>
            </div>

            {/* Progress per week */}
            {weekProgress.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-none border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-3">Πρόοδος Επιλογής:</h4>
                <div className="space-y-2">
                  {weekProgress.map((week) => (
                    <div key={week.weekIndex} className="flex items-center justify-between text-sm">
                      <span className="text-blue-700">Εβδομάδα {week.weekIndex}:</span>
                      <div className="flex items-center gap-2">
                        <span className={`${week.selected === week.required ? 'text-green-600' : 'text-orange-600'}`}>
                          {week.selected}/{week.required} προπονήσεις
                        </span>
                        {week.selected === week.required ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected dates list */}
            {selectedDatesAsStrings.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Επιλεγμένες Ημερομηνίες:</h4>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {selectedDatesAsStrings.map((date, index) => (
                    <div 
                      key={date} 
                      className="text-xs p-2 rounded-none border bg-gray-50 border-gray-200"
                    >
                      <span>{format(parseISO(date), 'dd/MM/yyyy')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selection Progress */}
            <div className="bg-white border border-gray-200 p-3 rounded-none">
              <div className="text-sm text-gray-600 mb-2">Πρόοδος Επιλογής</div>
              <div className="text-lg font-semibold text-gray-900">
                Επιλεγμένες ημερομηνίες: {selectedDatesAsStrings.length} / {totalDays}
              </div>
              <div className="w-full bg-gray-200 rounded-none h-2 mt-2">
                <div 
                  className="bg-[#00ffba] h-2 rounded-none transition-all duration-300"
                  style={{ width: `${(selectedDatesAsStrings.length / totalDays) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
