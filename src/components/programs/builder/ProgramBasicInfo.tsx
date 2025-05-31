
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { User } from '../types';

interface ProgramBasicInfoProps {
  name: string;
  description: string;
  athleteId: string;
  users: User[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAthleteChange: (athleteId: string) => void;
}

export const ProgramBasicInfo: React.FC<ProgramBasicInfoProps> = ({
  name,
  description,
  athleteId,
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

  const selectedUser = users.find(user => user.id === athleteId);

  const handleAthleteSelect = (userId: string) => {
    onAthleteChange(userId === "no-athlete" ? "" : userId);
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  const removeAthlete = () => {
    onAthleteChange('');
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-lg">Όνομα Προγράμματος *</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          className="rounded-none"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="π.χ. Πρόγραμμα Δύναμης"
        />
        
        <div>
          <Label>Περιγραφή</Label>
          <Textarea
            className="rounded-none"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Περιγραφή προγράμματος..."
          />
        </div>

        <div>
          <Label>Αθλητής (προαιρετικό)</Label>
          
          {selectedUser ? (
            <div className="flex items-center justify-between bg-blue-50 text-blue-700 p-3 border border-blue-200 rounded-none">
              <span className="font-medium">{selectedUser.name}</span>
              <button
                onClick={removeAthlete}
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
                  Αναζήτηση αθλητή...
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 rounded-none" align="start">
                <Command className="border-0">
                  <CommandInput 
                    placeholder="Αναζήτηση αθλητή..." 
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandList className="max-h-48">
                    <CommandEmpty>Δεν βρέθηκε αθλητής</CommandEmpty>
                    <CommandItem
                      className="cursor-pointer p-3 hover:bg-gray-100"
                      onSelect={() => handleAthleteSelect("no-athlete")}
                    >
                      Χωρίς συγκεκριμένο αθλητή
                    </CommandItem>
                    {filteredUsers.map(user => (
                      <CommandItem
                        key={user.id}
                        className="cursor-pointer p-3 hover:bg-gray-100"
                        onSelect={() => handleAthleteSelect(user.id)}
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
