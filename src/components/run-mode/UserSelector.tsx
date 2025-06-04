
import React from 'react';
import { Button } from "@/components/ui/button";
import { X, Search, User } from "lucide-react";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserSelectorProps {
  selectedUser?: User;
  users: User[];
  searchTerm: string;
  isOpen: boolean;
  onSearchChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onUserSelect: (user: User) => void;
  onRemoveUser: () => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUser,
  users,
  searchTerm,
  isOpen,
  onSearchChange,
  onOpenChange,
  onUserSelect,
  onRemoveUser
}) => {
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedUser) {
    return (
      <div className="flex items-center justify-between bg-gray-800 p-3 border border-gray-600">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span className="font-medium text-sm">{selectedUser.name}</span>
        </div>
        <button
          onClick={onRemoveUser}
          className="text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal rounded-none bg-gray-800 border-gray-600 text-white text-sm"
        >
          <Search className="mr-2 h-4 w-4" />
          Επιλογή ασκουμένου...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 rounded-none bg-white" align="start">
        <Command className="border-0">
          <CommandInput 
            placeholder="Αναζήτηση ασκουμένου..." 
            value={searchTerm}
            onValueChange={onSearchChange}
          />
          <CommandList className="max-h-48">
            <CommandEmpty>Δεν βρέθηκε ασκούμενος</CommandEmpty>
            {filteredUsers.map(user => (
              <CommandItem
                key={user.id}
                className="cursor-pointer p-3 hover:bg-gray-100"
                onSelect={() => onUserSelect(user)}
              >
                <User className="mr-2 h-4 w-4" />
                {user.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
