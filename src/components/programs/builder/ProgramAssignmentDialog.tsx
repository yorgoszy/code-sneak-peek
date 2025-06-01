
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, X, Users, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
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
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Υπολογισμός απαιτούμενων προπονήσεων
  const totalWeeks = program.weeks?.length || 0;
  const daysPerWeek = program.weeks?.[0]?.days?.length || 0;
  const totalRequiredSessions = totalWeeks * daysPerWeek;

  useEffect(() => {
    if (!isOpen) {
      setSelectedUserId('');
      setSelectedDates([]);
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users.find(user => user.id === selectedUserId);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    if (selectedDates.includes(dateString)) {
      // Remove date if already selected
      setSelectedDates(selectedDates.filter(d => d !== dateString));
    } else {
      // Add date if not selected and limit hasn't been reached
      if (selectedDates.length < totalRequiredSessions) {
        setSelectedDates([...selectedDates, dateString].sort());
      }
    }
  };

  const removeDate = (dateToRemove: string) => {
    setSelectedDates(selectedDates.filter(d => d !== dateToRemove));
  };

  const clearAllDates = () => {
    setSelectedDates([]);
  };

  const isDateSelected = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return selectedDates.includes(dateString);
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
            <Users className="w-5 h-5" />
            Ανάθεση Προγράμματος σε Ασκούμενο
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
                  <span className="font-medium">Εβδομάδες:</span> {totalWeeks}
                </div>
                <div>
                  <span className="font-medium">Ημέρες/Εβδομάδα:</span> {daysPerWeek}
                </div>
                <div>
                  <span className="font-medium">Συνολικές Προπονήσεις:</span> {totalRequiredSessions}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Selection */}
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle>Επιλογή Ασκούμενου</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedUser ? (
                <div className="flex items-center justify-between bg-blue-50 text-blue-700 p-3 border border-blue-200 rounded-none">
                  <span className="font-medium">{selectedUser.name}</span>
                  <button
                    onClick={() => setSelectedUserId('')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal rounded-none"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Αναζήτηση ασκούμενου...
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 rounded-none" align="start">
                    <Command className="border-0">
                      <CommandInput 
                        placeholder="Αναζήτηση ασκούμενου..." 
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandList className="max-h-48">
                        <CommandEmpty>Δεν βρέθηκε ασκούμενος</CommandEmpty>
                        {filteredUsers.map(user => (
                          <CommandItem
                            key={user.id}
                            className="cursor-pointer p-3 hover:bg-gray-100"
                            onSelect={() => handleUserSelect(user.id)}
                          >
                            {user.name}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
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
                Επιλέξτε {totalRequiredSessions} ημερομηνίες για τις προπονήσεις ({selectedDates.length}/{totalRequiredSessions})
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Calendar */}
                <div>
                  <Calendar
                    mode="single"
                    selected={undefined}
                    onSelect={handleDateSelect}
                    className="rounded-none border pointer-events-auto"
                    modifiers={{
                      selected: isDateSelected
                    }}
                    modifiersClassNames={{
                      selected: "bg-blue-500 text-white hover:bg-blue-600"
                    }}
                    disabled={(date) => {
                      // Disable past dates
                      return date < new Date(new Date().setHours(0, 0, 0, 0));
                    }}
                  />
                </div>

                {/* Selected Dates */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">
                      Επιλεγμένες Ημερομηνίες ({selectedDates.length})
                    </h4>
                    {selectedDates.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllDates}
                        className="rounded-none"
                      >
                        Καθαρισμός
                      </Button>
                    )}
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {selectedDates.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        Κάντε κλικ στο ημερολόγιο για να επιλέξετε ημερομηνίες
                      </p>
                    ) : (
                      selectedDates.map(dateString => (
                        <div
                          key={dateString}
                          className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-none"
                        >
                          <span className="text-sm">
                            {format(parseISO(dateString), 'dd/MM/yyyy - EEEE')}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDate(dateString)}
                            className="h-6 w-6 p-0 hover:bg-red-100 rounded-none"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
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
            <Users className="w-4 h-4 mr-2" />
            Ανάθεση Προγράμματος
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
