
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CalendarHeader } from './calendar/CalendarHeader';
import { SelectedDatesSection } from './calendar/SelectedDatesSection';
import { CalendarDisplay } from './calendar/CalendarDisplay';
import { CompletionStatus } from './calendar/CompletionStatus';
import type { ProgramStructure } from './hooks/useProgramBuilderState';

interface CalendarAssignmentProps {
  program: ProgramStructure;
  onTrainingDatesChange: (dates: Date[]) => void;
}

export const CalendarAssignment: React.FC<CalendarAssignmentProps> = ({
  program,
  onTrainingDatesChange
}) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  // Υπολογισμός συνολικού αριθμού ημερών από τις εβδομάδες
  const totalDaysRequired = program.weeks?.reduce((total, week) => {
    return total + (week.program_days?.length || 0);
  }, 0) || 0;

  console.log('📅 CalendarAssignment - Total days required:', totalDaysRequired);
  console.log('📅 CalendarAssignment - Selected dates:', selectedDates.length);

  // Συγχρονισμός με το program training_dates
  useEffect(() => {
    if (program.training_dates) {
      const dates = program.training_dates.map(date => {
        if (typeof date === 'string') {
          return new Date(date + 'T12:00:00');
        }
        return new Date(date);
      });
      setSelectedDates(dates);
    }
  }, [program.training_dates]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    console.log('📅 Date selected:', date);

    // Δημιουργία καθαρής ημερομηνίας χωρίς ώρα
    const cleanDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    const dateString = cleanDate.toISOString().split('T')[0];
    
    const isAlreadySelected = selectedDates.some(d => {
      const existingDateString = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0];
      return existingDateString === dateString;
    });

    let newDates: Date[];
    
    if (isAlreadySelected) {
      // Αφαίρεση ημερομηνίας
      newDates = selectedDates.filter(d => {
        const existingDateString = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0];
        return existingDateString !== dateString;
      });
    } else {
      // Προσθήκη ημερομηνίας (αν δεν έχουμε φτάσει το όριο)
      if (selectedDates.length >= totalDaysRequired) {
        console.log('📅 Maximum dates reached');
        return;
      }
      newDates = [...selectedDates, cleanDate].sort((a, b) => a.getTime() - b.getTime());
    }

    console.log('📅 New dates:', newDates);
    setSelectedDates(newDates);
    onTrainingDatesChange(newDates);
  };

  const removeDate = (dateToRemove: Date) => {
    console.log('📅 Removing date:', dateToRemove);
    const dateToRemoveString = new Date(dateToRemove.getFullYear(), dateToRemove.getMonth(), dateToRemove.getDate()).toISOString().split('T')[0];
    const newDates = selectedDates.filter(d => {
      const existingDateString = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0];
      return existingDateString !== dateToRemoveString;
    });
    setSelectedDates(newDates);
    onTrainingDatesChange(newDates);
  };

  const clearAllDates = () => {
    console.log('📅 Clearing all dates');
    setSelectedDates([]);
    onTrainingDatesChange([]);
  };

  const isDateSelected = (date: Date) => {
    const dateString = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0];
    return selectedDates.some(d => {
      const existingDateString = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0];
      return existingDateString === dateString;
    });
  };

  const isDateDisabled = (date: Date) => {
    // Απενεργοποίηση παλαιών ημερομηνιών
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (checkDate < today) return true;
    
    // Αν η ημερομηνία είναι ήδη επιλεγμένη, δεν την απενεργοποιούμε
    if (isDateSelected(date)) return false;
    
    // Αν έχουμε φτάσει το όριο, απενεργοποιούμε τις υπόλοιπες
    return selectedDates.length >= totalDaysRequired;
  };

  if (totalDaysRequired === 0) {
    return (
      <Card className="rounded-none">
        <CalendarHeader selectedDatesCount={0} totalDaysRequired={0} />
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Δημιουργήστε πρώτα εβδομάδες και ημέρες προπόνησης για να επιλέξετε ημερομηνίες
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CalendarHeader 
        selectedDatesCount={selectedDates.length} 
        totalDaysRequired={totalDaysRequired} 
      />
      
      <CardContent className="space-y-4">
        <SelectedDatesSection
          selectedDates={selectedDates}
          onRemoveDate={removeDate}
          onClearAllDates={clearAllDates}
        />

        <CalendarDisplay
          selectedDates={selectedDates}
          totalDaysRequired={totalDaysRequired}
          onDateSelect={handleDateSelect}
          isDateSelected={isDateSelected}
          isDateDisabled={isDateDisabled}
        />

        <CompletionStatus
          selectedDatesCount={selectedDates.length}
          totalDaysRequired={totalDaysRequired}
        />
      </CardContent>
    </Card>
  );
};
