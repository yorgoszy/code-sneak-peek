
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, X } from "lucide-react";
import { format, addDays, isSameWeek, startOfWeek } from "date-fns";

interface ProgramCalendarProps {
  selectedDates: Date[];
  onDatesChange: (dates: Date[]) => void;
  totalDays: number;
  weeks?: any[]; // Δομή των εβδομάδων του προγράμματος
}

export const ProgramCalendar: React.FC<ProgramCalendarProps> = ({
  selectedDates,
  onDatesChange,
  totalDays,
  weeks = []
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [currentWeekDayCount, setCurrentWeekDayCount] = useState(0);

  // Υπολογίζουμε τη δομή των εβδομάδων από το πρόγραμμα
  const weekStructure = weeks.map(week => ({
    weekNumber: week.week_number || 1,
    daysCount: week.days?.length || 0
  }));

  console.log('📅 Δομή εβδομάδων:', weekStructure);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateExists = selectedDates.some(d => 
      d.toDateString() === date.toDateString()
    );
    
    if (dateExists) {
      // Αφαίρεση ημερομηνίας
      const newDates = selectedDates.filter(d => 
        d.toDateString() !== date.toDateString()
      );
      onDatesChange(newDates);
      
      // Επαναυπολογισμός του index εβδομάδας
      recalculateWeekIndex(newDates);
      return;
    }

    // Έλεγχος αν έχουμε φτάσει το όριο
    if (selectedDates.length >= totalDays) {
      console.log(`⚠️ Μπορείς να επιλέξεις μόνο ${totalDays} ημερομηνίες`);
      return;
    }

    // Λογική για επιλογή ημερομηνιών βάσει δομής εβδομάδων
    if (weekStructure.length > 0) {
      const canAddToCurrentWeek = validateWeekSelection(date);
      if (!canAddToCurrentWeek) {
        console.log('⚠️ Πρέπει να ολοκληρώσεις τις ημέρες της τρέχουσας εβδομάδας πρώτα');
        return;
      }
    }
    
    // Προσθήκη ημερομηνίας
    const newDates = [...selectedDates, date].sort((a, b) => a.getTime() - b.getTime());
    onDatesChange(newDates);
    
    // Ενημέρωση του index εβδομάδας
    updateWeekIndex(newDates);
  };

  const validateWeekSelection = (newDate: Date): boolean => {
    if (weekStructure.length === 0) return true;
    if (selectedDates.length === 0) return true;

    const currentWeek = weekStructure[currentWeekIndex];
    if (!currentWeek) return false;

    // Αν δεν έχουμε επιλέξει καμία ημερομηνία ακόμη, επιτρέπουμε οποιαδήποτε
    if (selectedDates.length === 0) {
      return true;
    }

    // Βρίσκουμε τις ημερομηνίες της τρέχουσας εβδομάδας που επεξεργαζόμαστε
    const currentWeekDates = getCurrentWeekDates();
    
    // Αν η τρέχουσα εβδομάδα δεν έχει συμπληρωθεί
    if (currentWeekDates.length < currentWeek.daysCount) {
      // Ελέγχουμε αν η νέα ημερομηνία είναι στην ίδια εβδομάδα με τις τρέχουσες
      if (currentWeekDates.length > 0) {
        const firstDateOfCurrentWeek = currentWeekDates[0];
        return isSameWeek(newDate, firstDateOfCurrentWeek, { weekStartsOn: 1 });
      }
      return true;
    }

    // Αν η τρέχουσα εβδομάδα έχει συμπληρωθεί, πάμε στην επόμενη
    return true;
  };

  const getCurrentWeekDates = (): Date[] => {
    if (selectedDates.length === 0) return [];
    
    let totalProcessedDays = 0;
    for (let i = 0; i < currentWeekIndex; i++) {
      totalProcessedDays += weekStructure[i]?.daysCount || 0;
    }
    
    const currentWeekStartIndex = totalProcessedDays;
    const currentWeek = weekStructure[currentWeekIndex];
    const currentWeekEndIndex = currentWeekStartIndex + (currentWeek?.daysCount || 0);
    
    return selectedDates.slice(currentWeekStartIndex, currentWeekEndIndex);
  };

  const updateWeekIndex = (dates: Date[]) => {
    if (weekStructure.length === 0) return;
    
    let totalDays = 0;
    let weekIndex = 0;
    
    for (let i = 0; i < weekStructure.length; i++) {
      const weekDays = weekStructure[i].daysCount;
      if (dates.length <= totalDays + weekDays) {
        weekIndex = i;
        break;
      }
      totalDays += weekDays;
      weekIndex = i + 1;
    }
    
    setCurrentWeekIndex(Math.min(weekIndex, weekStructure.length - 1));
  };

  const recalculateWeekIndex = (dates: Date[]) => {
    updateWeekIndex(dates);
  };

  const removeDate = (dateToRemove: Date) => {
    const newDates = selectedDates.filter(d => 
      d.toDateString() !== dateToRemove.toDateString()
    );
    onDatesChange(newDates);
    recalculateWeekIndex(newDates);
  };

  const clearAllDates = () => {
    onDatesChange([]);
    setCurrentWeekIndex(0);
    setCurrentWeekDayCount(0);
  };

  // Ενημέρωση για την τρέχουσα εβδομάδα
  const getCurrentWeekInfo = () => {
    if (weekStructure.length === 0) return null;
    
    const currentWeek = weekStructure[currentWeekIndex];
    const currentWeekDates = getCurrentWeekDates();
    
    return {
      weekNumber: currentWeek?.weekNumber || currentWeekIndex + 1,
      remainingDays: (currentWeek?.daysCount || 0) - currentWeekDates.length,
      totalDaysInWeek: currentWeek?.daysCount || 0,
      selectedInWeek: currentWeekDates.length
    };
  };

  const weekInfo = getCurrentWeekInfo();

  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Ημερολόγιο Προπόνησης
          </CardTitle>
          <div className="text-sm text-gray-600">
            Επιλεγμένες: {selectedDates.length} / Απαιτούμενες: {totalDays}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Week Info */}
        {weekInfo && weekStructure.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-none p-3">
            <h4 className="font-medium text-blue-800 mb-1">
              Εβδομάδα {weekInfo.weekNumber}
            </h4>
            <p className="text-sm text-blue-700">
              Επιλεγμένες: {weekInfo.selectedInWeek} / {weekInfo.totalDaysInWeek} ημέρες
            </p>
            {weekInfo.remainingDays > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                Απομένουν {weekInfo.remainingDays} ημέρες για αυτή την εβδομάδα
              </p>
            )}
          </div>
        )}

        {/* Selected Dates Display */}
        {selectedDates.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Επιλεγμένες Ημερομηνίες:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllDates}
                className="text-red-600 hover:text-red-800 rounded-none"
              >
                Καθαρισμός όλων
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedDates.map((date, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  {format(date, 'dd/MM/yyyy')}
                  <button
                    onClick={() => removeDate(date)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Toggle */}
        <Button
          variant="outline"
          onClick={() => setCalendarOpen(!calendarOpen)}
          className="w-full rounded-none"
        >
          {calendarOpen ? 'Απόκρυψη Ημερολογίου' : 'Εμφάνιση Ημερολογίου'}
        </Button>

        {/* Calendar */}
        {calendarOpen && (
          <div className="border rounded-none p-4">
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={(dates) => {
                if (dates) {
                  const datesArray = Array.isArray(dates) ? dates : [dates];
                  if (datesArray.length <= totalDays) {
                    onDatesChange(datesArray);
                  }
                }
              }}
              className="rounded-none"
              disabled={(date) => {
                // Απενεργοποίηση παλαιών ημερομηνιών
                if (date < new Date()) return true;
                
                // Αν δεν έχουμε δομή εβδομάδων, χρησιμοποιούμε την παλιά λογική
                if (weekStructure.length === 0) {
                  const isSelected = selectedDates.some(d => d.toDateString() === date.toDateString());
                  return !isSelected && selectedDates.length >= totalDays;
                }
                
                // Νέα λογική βάσει δομής εβδομάδων
                const isSelected = selectedDates.some(d => d.toDateString() === date.toDateString());
                if (isSelected) return false;
                
                return !validateWeekSelection(date);
              }}
            />
          </div>
        )}

        {/* Warning if not enough dates */}
        {selectedDates.length < totalDays && (
          <div className="text-orange-600 text-sm p-2 bg-orange-50 border border-orange-200 rounded-none">
            Προειδοποίηση: Χρειάζεστε {totalDays - selectedDates.length} ακόμη ημερομηνίες για να καλύψετε όλες τις ημέρες προπόνησης.
          </div>
        )}

        {/* Success message when limit reached */}
        {selectedDates.length === totalDays && (
          <div className="text-green-600 text-sm p-2 bg-green-50 border border-green-200 rounded-none">
            ✓ Έχετε επιλέξει όλες τις απαραίτητες ημερομηνίες προπόνησης!
          </div>
        )}

        {/* Week Structure Debug Info */}
        {weekStructure.length > 0 && (
          <details className="text-xs text-gray-500">
            <summary>Δομή Εβδομάδων</summary>
            <pre className="mt-2 bg-gray-100 p-2 rounded">
              {JSON.stringify(weekStructure, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
};
