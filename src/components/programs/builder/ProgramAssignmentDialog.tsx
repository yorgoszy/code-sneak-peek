
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, getWeek, getYear } from "date-fns";
import { el } from "date-fns/locale";
import type { User } from '../types';
import type { ProgramStructure } from './hooks/useProgramBuilderState';

interface ProgramAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  program: ProgramStructure;
  users: User[];
  onAssign: (userId: string, trainingDates: string[]) => void;
}

export const ProgramAssignmentDialog: React.FC<ProgramAssignmentDialogProps> = ({
  isOpen,
  onClose,
  program,
  users,
  onAssign
}) => {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Υπολογισμός απαιτούμενων προπονήσεων
  const totalWeeks = program.weeks?.length || 0;
  const daysPerWeek = program.weeks?.[0]?.days?.length || 0;
  const totalRequiredSessions = totalWeeks * daysPerWeek;

  // Χρησιμοποιούμε τον ήδη επιλεγμένο χρήστη από το πρόγραμμα
  const selectedUserId = program.user_id || '';

  useEffect(() => {
    if (!isOpen) {
      setSelectedDates([]);
    }
  }, [isOpen]);

  // Βελτιωμένη λογική επιλογής ημερομηνιών
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    if (selectedDates.includes(dateString)) {
      // Αφαιρούμε την ημερομηνία αν είναι ήδη επιλεγμένη
      setSelectedDates(selectedDates.filter(d => d !== dateString));
      return;
    }
    
    // Ελέγχουμε αν μπορούμε να προσθέσουμε την ημερομηνία
    if (canAddDate(date)) {
      setSelectedDates([...selectedDates, dateString].sort());
    }
  };

  // Λογική για έλεγχο αν μπορούμε να προσθέσουμε μια ημερομηνία
  const canAddDate = (date: Date): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Αν η ημερομηνία είναι ήδη επιλεγμένη, επιτρέπουμε την αφαίρεση
    if (selectedDates.includes(dateString)) {
      return true;
    }
    
    // Υπολογίζουμε σε ποια εβδομάδα ανήκει η ημερομηνία
    const weekNumber = getWeek(date, { weekStartsOn: 1, firstWeekContainsDate: 4 });
    const year = getYear(date);
    
    // Μετράμε πόσες ημερομηνίες έχουμε ήδη επιλέξει για αυτή την εβδομάδα
    const datesInThisWeek = selectedDates.filter(selectedDate => {
      const selectedDateObj = parseISO(selectedDate);
      const selectedWeek = getWeek(selectedDateObj, { weekStartsOn: 1, firstWeekContainsDate: 4 });
      const selectedYear = getYear(selectedDateObj);
      return selectedWeek === weekNumber && selectedYear === year;
    });
    
    // Επιτρέπουμε προσθήκη μόνο αν δεν έχουμε φτάσει το όριο ημερών για αυτή την εβδομάδα
    return datesInThisWeek.length < daysPerWeek;
  };

  const clearAllDates = () => {
    setSelectedDates([]);
  };

  const isDateSelected = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return selectedDates.includes(dateString);
  };

  // Ελέγχουμε αν μια ημερομηνία είναι απενεργοποιημένη
  const isDateDisabled = (date: Date) => {
    // Απενεργοποιούμε παλιές ημερομηνίες
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return true;
    }
    
    // Αν η ημερομηνία είναι ήδη επιλεγμένη, την επιτρέπουμε (για αποεπιλογή)
    const dateString = format(date, 'yyyy-MM-dd');
    if (selectedDates.includes(dateString)) {
      return false;
    }
    
    // Απενεργοποιούμε αν δεν μπορούμε να προσθέσουμε την ημερομηνία
    return !canAddDate(date);
  };

  const handleAssign = () => {
    if (selectedUserId && selectedDates.length === totalRequiredSessions) {
      onAssign(selectedUserId, selectedDates);
      onClose();
    }
  };

  const canAssign = selectedUserId && selectedDates.length === totalRequiredSessions;

  const selectedUser = users.find(user => user.id === selectedUserId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] rounded-none flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Ανάθεση Προγράμματος
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6 p-6">
          {/* Program Info */}
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="text-lg">Στοιχεία Προγράμματος</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Όνομα:</span> {program.name}
                </div>
                <div>
                  <span className="font-medium">Ασκούμενος:</span> {selectedUser ? selectedUser.name : 'Δεν έχει επιλεγεί'}
                </div>
                <div>
                  <span className="font-medium">Εβδομάδες:</span> {totalWeeks}
                </div>
                <div>
                  <span className="font-medium">Ημέρες/Εβδομάδα:</span> {daysPerWeek}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Συνολικές Προπονήσεις:</span> {totalRequiredSessions}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Επιλογή Ημερομηνιών Προπόνησης
              </CardTitle>
              <p className="text-sm text-gray-600">
                Επιλέξτε {daysPerWeek} ημέρες την εβδομάδα για {totalWeeks} εβδομάδες 
                ({selectedDates.length}/{totalRequiredSessions} προπονήσεις)
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                {/* Calendar */}
                <Calendar
                  mode="single"
                  selected={undefined}
                  onSelect={handleDateSelect}
                  className="rounded-none border pointer-events-auto"
                  locale={el}
                  modifiers={{
                    selected: isDateSelected
                  }}
                  modifiersClassNames={{
                    selected: "bg-blue-500 text-white hover:bg-blue-600"
                  }}
                  disabled={isDateDisabled}
                />

                {/* Clear All Button */}
                {selectedDates.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllDates}
                    className="rounded-none"
                  >
                    Αποεπιλογή Όλων ({selectedDates.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-none"
          >
            Ακύρωση
          </Button>
          
          <Button
            onClick={handleAssign}
            disabled={!canAssign}
            className="rounded-none"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Ανάθεση Προγράμματος
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
