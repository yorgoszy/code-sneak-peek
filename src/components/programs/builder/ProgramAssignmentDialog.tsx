
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, getWeek, getYear } from "date-fns";
import type { User } from '../types';
import type { ProgramStructure } from './hooks/useProgramBuilderState';
import { ProgramInfoCard } from './ProgramInfoCard';
import { DateSelectionCard } from './DateSelectionCard';
import { AssignmentDialogActions } from './AssignmentDialogActions';

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
          <ProgramInfoCard
            program={program}
            selectedUser={selectedUser}
            totalWeeks={totalWeeks}
            daysPerWeek={daysPerWeek}
            totalRequiredSessions={totalRequiredSessions}
          />

          <DateSelectionCard
            selectedDates={selectedDates}
            daysPerWeek={daysPerWeek}
            totalWeeks={totalWeeks}
            totalRequiredSessions={totalRequiredSessions}
            onDateSelect={handleDateSelect}
            onClearAllDates={clearAllDates}
            isDateSelected={isDateSelected}
            isDateDisabled={isDateDisabled}
          />
        </div>

        <AssignmentDialogActions
          onClose={onClose}
          onAssign={handleAssign}
          canAssign={canAssign}
        />
      </DialogContent>
    </Dialog>
  );
};
