
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useState } from 'react';
import type { User } from '../types';

interface ProgramBasicInfoProps {
  name: string;
  description: string;
  selectedUserId?: string;
  users: User[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAthleteChange: (user_id: string) => void;
}

export const ProgramBasicInfo: React.FC<ProgramBasicInfoProps> = ({
  name,
  description,
  selectedUserId,
  users,
  onNameChange,
  onDescriptionChange,
  onAthleteChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users.find(user => user.id === selectedUserId);

  const handleUserSelect = (userId: string) => {
    onAthleteChange(userId);
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Βασικές Πληροφορίες Προγράμματος</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="program-name">Όνομα Προγράμματος</Label>
          <Input
            id="program-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Εισάγετε το όνομα του προγράμματος"
            className="rounded-none"
          />
        </div>

        <div>
          <Label htmlFor="program-description">Περιγραφή</Label>
          <Textarea
            id="program-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Προαιρετική περιγραφή του προγράμματος"
            className="rounded-none min-h-[100px]"
          />
        </div>

        <div>
          <Label>Επιλογή Ασκούμενου</Label>
          {selectedUser ? (
            <div className="flex items-center justify-between bg-blue-50 text-blue-700 p-3 border border-blue-200 rounded-none">
              <span className="font-medium">{selectedUser.name}</span>
              <button
                onClick={() => onAthleteChange('')}
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
        </div>
      </CardContent>
    </Card>
  );
};
