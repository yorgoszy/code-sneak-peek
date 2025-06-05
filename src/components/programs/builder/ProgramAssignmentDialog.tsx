
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

  // Υπολογισμός απαιτούμενων προπονήσεων ανά εβδομάδα
  const getWeekTrainingCount = (weekIndex: number): number => {
    const week = program.weeks?.[weekIndex];
    return week?.days?.length || 0;
  };

  // Συνολικές απαιτούμενες προπονήσεις
  const totalRequiredSessions = program.weeks?.reduce((total, week) => {
    return total + (week.days?.length || 0);
  }, 0) || 0;

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
      if (editingAssignment) {
        setSelectedUserId(editingAssignment.user_id);
        if (!isReassignment) {
          setSelectedDates(editingAssignment.training_dates || []);
        }
      } else if (program.user_id) {
        setSelectedUserId(program.user_id);
      }
    }
  }, [isOpen, program.user_id, editingAssignment, isReassignment]);

  const removeSelectedDate = (dateToRemove: string) => {
    if (!completedDates.includes(dateToRemove)) {
      setSelectedDates(selectedDates.filter(date => date !== dateToRemove));
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    if (completedDates.includes(dateString) && !isReassignment) {
      return;
    }
    
    if (selectedDates.includes(dateString)) {
      setSelectedDates(selectedDates.filter(d => d !== dateString));
      return;
    }
    
    if (canAddDate(date)) {
      setSelectedDates([...selectedDates, dateString].sort());
    }
  };

  const canAddDate = (date: Date): boolean => {
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
    
    // Βρίσκουμε σε ποια εβδομάδα του προγράμματος είμαστε
    const programStartWeek = program.weeks?.[0] ? 1 : 1; // Assuming first week
    const programWeekIndex = Math.max(0, weekNumber - programStartWeek);
    const maxDaysForThisWeek = getWeekTrainingCount(programWeekIndex);
    
    return datesInThisWeek.length < maxDaysForThisWeek;
  };

  const clearAllDates = () => {
    if (!isReassignment) {
      setSelectedDates(selectedDates.filter(date => completedDates.includes(date)));
    } else {
      setSelectedDates([]);
    }
  };

  const handleReassignmentToggle = (checked: boolean) => {
    setIsReassignment(checked);
    if (checked) {
      setSelectedDates([]);
    } else if (editingAssignment) {
      setSelectedDates(editingAssignment.training_dates || []);
    }
  };

  const isDateSelected = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return selectedDates.includes(dateString);
  };

  const isDateDisabled = (date: Date) => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return true;
    }
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    if (selectedDates.includes(dateString)) {
      return false;
    }

    if (completedDates.includes(dateString) && !isReassignment) {
      return true;
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
            totalWeeks={program.weeks?.length || 0}
            daysPerWeek={0} // Θα υπολογίζεται δυναμικά
            totalRequiredSessions={totalRequiredSessions}
          />

          <DateSelectionCard
            selectedDates={selectedDates}
            daysPerWeek={0} // Θα υπολογίζεται δυναμικά
            totalWeeks={program.weeks?.length || 0}
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
