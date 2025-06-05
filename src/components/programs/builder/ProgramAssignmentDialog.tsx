
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, User, AlertTriangle, X } from "lucide-react";
import { format, parseISO, getWeek, getYear } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  editingAssignment?: {
    user_id: string;
    training_dates: string[];
    completedDates?: string[];
  };
}

export const ProgramAssignmentDialog: React.FC<ProgramAssignmentDialogProps> = ({
  isOpen,
  onClose,
  program,
  users,
  onAssign,
  editingAssignment
}) => {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isReassignment, setIsReassignment] = useState(false);

  // Υπολογισμός απαιτούμενων προπονήσεων
  const totalWeeks = program.weeks?.length || 0;
  const daysPerWeek = program.weeks?.[0]?.days?.length || 0;
  const totalRequiredSessions = totalWeeks * daysPerWeek;

  const selectedUser = users.find(user => user.id === selectedUserId);
  const completedDates = editingAssignment?.completedDates || [];

  console.log('Program in assignment dialog:', program);
  console.log('Selected user ID:', selectedUserId);
  console.log('Found user:', selectedUser);
  console.log('Editing assignment:', editingAssignment);
  console.log('Total required sessions:', totalRequiredSessions);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDates([]);
      setSelectedUserId('');
      setIsReassignment(false);
    } else {
      // Αν επεξεργαζόμαστε ήδη υπάρχουσα ανάθεση
      if (editingAssignment) {
        setSelectedUserId(editingAssignment.user_id);
        if (!isReassignment) {
          setSelectedDates(editingAssignment.training_dates || []);
        }
      } else if (program.user_id) {
        // Αν το πρόγραμμα έχει ήδη επιλεγμένο χρήστη, τον θέτουμε ως προεπιλογή
        setSelectedUserId(program.user_id);
      }
    }
  }, [isOpen, program.user_id, editingAssignment, isReassignment]);

  // Αφαίρεση επιλεγμένης ημερομηνίας
  const removeSelectedDate = (dateToRemove: string) => {
    // Μόνο αν δεν είναι ολοκληρωμένη ημερομηνία
    if (!completedDates.includes(dateToRemove)) {
      setSelectedDates(selectedDates.filter(date => date !== dateToRemove));
    }
  };

  // Βελτιωμένη λογική επιλογής ημερομηνιών
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Αν είναι ολοκληρωμένη ημερομηνία και δεν είναι επανα-ανάθεση, δεν επιτρέπουμε αλλαγή
    if (completedDates.includes(dateString) && !isReassignment) {
      return;
    }
    
    // ΑΠΛΗ ΛΟΓΙΚΗ: Αν η ημερομηνία είναι ήδη επιλεγμένη, την αφαιρούμε
    if (selectedDates.includes(dateString)) {
      setSelectedDates(prev => prev.filter(d => d !== dateString));
      return;
    }
    
    // Αλλιώς, ελέγχουμε αν μπορούμε να την προσθέσουμε
    if (canAddDate(date)) {
      setSelectedDates(prev => [...prev, dateString].sort());
    }
  };

  // Λογική για έλεγχο αν μπορούμε να προσθέσουμε μια ημερομηνία
  const canAddDate = (date: Date): boolean => {
    // Αν έχουμε φτάσει το όριο των συνολικών προπονήσεων
    if (selectedDates.length >= totalRequiredSessions) {
      return false;
    }
    
    const weekNumber = getWeek(date, { weekStartsOn: 1, firstWeekContainsDate: 4 });
    const year = getYear(date);
    
    const datesInThisWeek = selectedDates.filter(selectedDate => {
      const selectedDateObj = parseISO(selectedDate);
      const selectedWeek = getWeek(selectedDateObj, { weekStartsOn: 1, firstWeekContainsDate: 4 });
      const selectedYear = getYear(selectedDateObj);
      return selectedWeek === weekNumber && selectedYear === year;
    });
    
    // Δεν επιτρέπουμε περισσότερες από daysPerWeek προπονήσεις την εβδομάδα
    return datesInThisWeek.length < daysPerWeek;
  };

  const clearAllDates = () => {
    // Κρατάμε μόνο τις ολοκληρωμένες ημερομηνίες αν δεν είναι επανα-ανάθεση
    if (!isReassignment) {
      setSelectedDates(selectedDates.filter(date => completedDates.includes(date)));
    } else {
      setSelectedDates([]);
    }
  };

  const handleReassignmentToggle = (checked: boolean) => {
    setIsReassignment(checked);
    if (checked) {
      // Καθαρίζουμε τις ημερομηνίες για νέα ανάθεση
      setSelectedDates([]);
    } else if (editingAssignment) {
      // Επαναφέρουμε τις αρχικές ημερομηνίες
      setSelectedDates(editingAssignment.training_dates || []);
    }
  };

  const isDateSelected = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return selectedDates.includes(dateString);
  };

  // Ελέγχουμε αν μια ημερομηνία είναι απενεργοποιημένη
  const isDateDisabled = (date: Date) => {
    // Παρελθόν ημερομηνίες είναι πάντα απενεργοποιημένες
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return true;
    }
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Αν η ημερομηνία είναι ήδη επιλεγμένη, ΠΟΤΕ δεν είναι disabled (για αποεπιλογή)
    if (selectedDates.includes(dateString)) {
      return false;
    }

    // Αν είναι ολοκληρωμένη ημερομηνία και δεν είναι επανα-ανάθεση, είναι disabled
    if (completedDates.includes(dateString) && !isReassignment) {
      return true;
    }
    
    // Για μη επιλεγμένες ημερομηνίες, ελέγχουμε αν μπορούμε να τις προσθέσουμε
    return !canAddDate(date);
  };

  const handleAssign = () => {
    console.log('Attempting to assign with:', {
      selectedUserId,
      selectedDatesLength: selectedDates.length,
      totalRequiredSessions,
      selectedDates
    });

    if (!selectedUserId) {
      console.log('No user selected');
      return;
    }

    if (selectedDates.length === 0) {
      console.log('No dates selected');
      return;
    }

    if (selectedDates.length !== totalRequiredSessions) {
      console.log('Incorrect number of dates selected');
      return;
    }

    console.log('Calling onAssign with:', selectedUserId, selectedDates);
    onAssign(selectedUserId, selectedDates);
  };

  const canAssign = selectedUserId && selectedDates.length > 0 && selectedDates.length === totalRequiredSessions;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] rounded-none flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {editingAssignment ? 'Επεξεργασία Ανάθεσης' : 'Ανάθεση Προγράμματος'}
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

          {/* Επανα-ανάθεση επιλογή */}
          {editingAssignment && completedDates.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-none p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800 mb-2">Επανα-ανάθεση Προγράμματος</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Υπάρχουν {completedDates.length} ολοκληρωμένες προπονήσεις. Μπορείτε να κάνετε επανα-ανάθεση για να διαγράψετε τον τρέχοντα προγραμματισμό και να ξεκινήσετε από την αρχή.
                  </p>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="reassignment"
                      checked={isReassignment}
                      onCheckedChange={handleReassignmentToggle}
                    />
                    <label htmlFor="reassignment" className="text-sm font-medium text-yellow-800">
                      Επανα-ανάθεση (διαγραφή όλου του προγραμματισμού)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Επιλεγμένες Ημερομηνίες με δυνατότητα αφαίρεσης */}
          {editingAssignment && selectedDates.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Επιλεγμένες Ημερομηνίες</h3>
              <div className="flex flex-wrap gap-2">
                {selectedDates.map(date => {
                  const isCompleted = completedDates.includes(date);
                  const canRemove = !isCompleted || isReassignment;
                  
                  return (
                    <div
                      key={date}
                      className={`flex items-center gap-2 px-3 py-1 rounded-none border ${
                        isCompleted 
                          ? 'bg-green-100 border-green-300 text-green-800' 
                          : 'bg-blue-100 border-blue-300 text-blue-800'
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {format(parseISO(date), 'dd/MM/yyyy')}
                      </span>
                      {isCompleted && (
                        <span className="text-xs">(Ολοκληρωμένη)</span>
                      )}
                      {canRemove && (
                        <button
                          onClick={() => removeSelectedDate(date)}
                          className="p-0.5 hover:bg-black/10 rounded-none"
                          title="Αφαίρεση ημερομηνίας"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
            completedDates={isReassignment ? [] : completedDates}
            editMode={!!editingAssignment}
          />
        </div>

        <AssignmentDialogActions
          onClose={onClose}
          onAssign={handleAssign}
          canAssign={canAssign}
          editMode={!!editingAssignment}
          isReassignment={isReassignment}
        />
      </DialogContent>
    </Dialog>
  );
};
