
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, User } from "lucide-react";
import { format, parseISO, getWeek, getYear } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User as UserType } from '../types';
import type { ProgramStructure } from './hooks/useProgramBuilderState';
import { ProgramInfoCard } from './ProgramInfoCard';
import { DateSelectionCard } from './DateSelectionCard';
import { AssignmentDialogActions } from './AssignmentDialogActions';

interface ProgramAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  program: ProgramStructure;
  users: UserType[];
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
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Υπολογισμός απαιτούμενων προπονήσεων
  const totalWeeks = program.weeks?.length || 0;
  const daysPerWeek = program.weeks?.[0]?.days?.length || 0;
  const totalRequiredSessions = totalWeeks * daysPerWeek;

  const selectedUser = users.find(user => user.id === selectedUserId);

  console.log('Program in assignment dialog:', program);
  console.log('Selected user ID:', selectedUserId);
  console.log('Found user:', selectedUser);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDates([]);
      setSelectedUserId('');
    } else {
      // Αν το πρόγραμμα έχει ήδη επιλεγμένο χρήστη, τον θέτουμε ως προεπιλογή
      if (program.user_id) {
        setSelectedUserId(program.user_id);
      }
    }
  }, [isOpen, program.user_id]);

  // Βελτιωμένη λογική επιλογής ημερομηνιών
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    if (selectedDates.includes(dateString)) {
      setSelectedDates(selectedDates.filter(d => d !== dateString));
      return;
    }
    
    if (canAddDate(date)) {
      setSelectedDates([...selectedDates, dateString].sort());
    }
  };

  // Λογική για έλεγχο αν μπορούμε να προσθέσουμε μια ημερομηνία
  const canAddDate = (date: Date): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    if (selectedDates.includes(dateString)) {
      return true;
    }
    
    const weekNumber = getWeek(date, { weekStartsOn: 1, firstWeekContainsDate: 4 });
    const year = getYear(date);
    
    const datesInThisWeek = selectedDates.filter(selectedDate => {
      const selectedDateObj = parseISO(selectedDate);
      const selectedWeek = getWeek(selectedDateObj, { weekStartsOn: 1, firstWeekContainsDate: 4 });
      const selectedYear = getYear(selectedDateObj);
      return selectedWeek === weekNumber && selectedYear === year;
    });
    
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
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return true;
    }
    
    const dateString = format(date, 'yyyy-MM-dd');
    if (selectedDates.includes(dateString)) {
      return false;
    }
    
    return !canAddDate(date);
  };

  const handleAssign = () => {
    if (selectedUserId && selectedDates.length === totalRequiredSessions) {
      onAssign(selectedUserId, selectedDates);
      onClose();
    }
  };

  const canAssign = selectedUserId && selectedDates.length === totalRequiredSessions;

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
          {/* Επιλογή Ασκούμενου */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Επιλογή Ασκούμενου</h3>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε ασκούμενο">
                  {selectedUser && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {selectedUser.name}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {user.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
