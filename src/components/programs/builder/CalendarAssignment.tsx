
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { CalendarDays, X, Trash2 } from "lucide-react";
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Ημερολόγιο Ανάθεσης
          </CardTitle>
        </CardHeader>
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
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Ημερολόγιο Ανάθεσης
          </div>
          <Badge variant="outline" className="rounded-none">
            {selectedDates.length}/{totalDaysRequired} ημέρες
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Επιλεγμένες ημερομηνίες */}
        {selectedDates.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Επιλεγμένες Ημερομηνίες</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllDates}
                className="rounded-none"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Καθαρισμός
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {selectedDates.map((date, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-[#00ffba] text-black border border-gray-200 rounded-none text-sm"
                >
                  <span>{format(date, 'dd/MM/yyyy', { locale: el })}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDate(date)}
                    className="h-5 w-5 p-0 hover:bg-black/10 rounded-none"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ημερολόγιο - Πάντα εμφανές */}
        <div className="border border-gray-200 rounded-none p-4">
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={handleDateSelect}
            className="rounded-none w-full"
            weekStartsOn={1}
            disabled={isDateDisabled}
            modifiers={{
              selected: isDateSelected
            }}
            modifiersClassNames={{
              selected: "bg-[#00ffba] text-black hover:bg-[#00ffba]/90"
            }}
          />
          
          <div className="mt-3 text-xs text-gray-600 space-y-1">
            <p>💡 Κάντε κλικ σε μια ημερομηνία για να την επιλέξετε/αφαιρέσετε</p>
            <p>📅 Μπορείτε να επιλέξετε μέχρι {totalDaysRequired} ημερομηνίες</p>
            <p>🚫 Παλαιές ημερομηνίες είναι απενεργοποιημένες</p>
          </div>
        </div>

        {/* Μόνο κατάσταση ολοκλήρωσης */}
        {selectedDates.length === totalDaysRequired && (
          <div className="bg-green-50 p-3 rounded-none border border-green-200">
            <p className="text-sm text-green-800">
              ✅ Έχετε επιλέξει όλες τις απαραίτητες ημερομηνίες για την ανάθεση!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
