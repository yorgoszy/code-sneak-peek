
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, startOfDay, getWeek, getYear, isSameWeek } from "date-fns";
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

  // Υπολογισμός ημερών ανά εβδομάδα από τη δομή του προγράμματος
  const getWeekDaysStructure = () => {
    if (!program.weeks || program.weeks.length === 0) return [];
    
    return program.weeks.map(week => ({
      weekNumber: week.week_number,
      daysCount: week.program_days?.length || 0,
      name: week.name || `Εβδομάδα ${week.week_number}`
    }));
  };

  const weekStructure = getWeekDaysStructure();

  // Convert training_dates from Date[] to string[]
  const selectedDatesAsStrings = (program.training_dates || []).map(date => {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  });

  // Υπολογισμός του αριθμού των επιλεγμένων ημερομηνιών ανά εβδομάδα προγράμματος
  const getSelectedDatesPerProgramWeek = () => {
    const selectedDates = selectedDatesAsStrings.map(dateStr => new Date(dateStr + 'T12:00:00'));
    const weekCounts: { [key: number]: number } = {};
    
    // Ομαδοποίηση των επιλεγμένων ημερομηνιών ανά εβδομάδα προγράμματος
    selectedDates.forEach((date, index) => {
      // Υπολογισμός σε ποια εβδομάδα του προγράμματος ανήκει αυτή η ημερομηνία
      const programWeekIndex = Math.floor(index / (weekStructure[0]?.daysCount || 1));
      const programWeek = weekStructure[programWeekIndex];
      
      if (programWeek) {
        weekCounts[programWeek.weekNumber] = (weekCounts[programWeek.weekNumber] || 0) + 1;
      }
    });
    
    return weekCounts;
  };

  // Εύρεση της επόμενης εβδομάδας που χρειάζεται συμπλήρωση
  const getCurrentWeekBeingFilled = () => {
    const weekCounts = getSelectedDatesPerProgramWeek();
    
    for (const week of weekStructure) {
      const selectedForWeek = weekCounts[week.weekNumber] || 0;
      if (selectedForWeek < week.daysCount) {
        return {
          weekNumber: week.weekNumber,
          weekStructure: week,
          alreadySelected: selectedForWeek,
          remainingForThisWeek: week.daysCount - selectedForWeek
        };
      }
    }
    
    return null; // Όλες οι εβδομάδες έχουν ολοκληρωθεί
  };

  const currentWeekInfo = getCurrentWeekBeingFilled();

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !currentWeekInfo) return;
    
    const dateString = date.toISOString().split('T')[0];
    const currentDates = selectedDatesAsStrings.slice();
    
    if (currentDates.includes(dateString)) {
      // Remove date if already selected
      const newDates = currentDates.filter(d => d !== dateString);
      const datesAsObjects = newDates.map(dateStr => new Date(dateStr + 'T12:00:00'));
      onTrainingDatesChange(datesAsObjects);
    } else if (currentWeekInfo.remainingForThisWeek > 0) {
      // Add date if there's still room in the current week
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

    // If no current week is being filled, disable all dates
    if (!currentWeekInfo) return true;

    // Don't allow more selections if current week is full
    return currentWeekInfo.remainingForThisWeek <= 0;
  };

  const getWeekProgress = () => {
    const weekCounts = getSelectedDatesPerProgramWeek();
    
    return weekStructure.map((week) => ({
      weekIndex: week.weekNumber,
      weekName: week.name,
      selected: weekCounts[week.weekNumber] || 0,
      required: week.daysCount,
      completed: (weekCounts[week.weekNumber] || 0) >= week.daysCount
    }));
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
              <h4 className="font-semibold text-gray-900 mb-3">Εβδομάδες: {weekStructure.length}</h4>
              <div className="space-y-2">
                {weekStructure.map((week, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{week.name}:</span>
                    <span className="ml-2 text-gray-600">
                      {week.daysCount} ημέρες
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm font-medium text-blue-700">
                  Συνολικές ημέρες: {totalDays}
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
                      <span className="text-blue-700">{week.weekName}:</span>
                      <div className="flex items-center gap-2">
                        <span className={`${week.completed ? 'text-green-600' : week.selected > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                          {week.selected}/{week.required} προπονήσεις
                        </span>
                        {week.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : week.selected > 0 ? (
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-gray-300" />
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
