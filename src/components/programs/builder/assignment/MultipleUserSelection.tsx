
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, User, X } from "lucide-react";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { User as UserType } from '../../types';

interface MultipleUserSelectionProps {
  users: UserType[];
  selectedUserIds: string[];
  onUserToggle: (userId: string) => void;
  onClearAll: () => void;
}

export const MultipleUserSelection: React.FC<MultipleUserSelectionProps> = ({
  users,
  selectedUserIds,
  onUserToggle,
  onClearAll
}) => {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (userId: string) => {
    onUserToggle(userId);
    // Don't close the popover, allow multiple selections
    setSearchTerm('');
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Επιλογή Πολλαπλών Αθλητών
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Search/Add */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Προσθήκη/Αφαίρεση Αθλητών</label>
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal rounded-none"
              >
                <Users className="mr-2 h-4 w-4" />
                Κλικ για επιλογή αθλητών...
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 rounded-none" align="start">
              <Command>
                <CommandInput 
                  placeholder="Αναζήτηση αθλητών..." 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList className="max-h-48">
                  <CommandEmpty>Δεν βρέθηκε αθλητής</CommandEmpty>
                  {filteredUsers.map(user => (
                    <CommandItem
                      key={user.id}
                      className={`cursor-pointer p-3 hover:bg-gray-100 ${
                        selectedUserIds.includes(user.id) ? 'bg-[#00ffba]/20 border-l-4 border-[#00ffba]' : ''
                      }`}
                      onSelect={() => handleUserSelect(user.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        {selectedUserIds.includes(user.id) ? (
                          <span className="text-[#00ffba] font-bold text-lg">✓</span>
                        ) : (
                          <span className="text-gray-400 font-bold text-lg">+</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Selected Users Display */}
        {selectedUsers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Επιλεγμένοι Αθλητές ({selectedUsers.length})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                className="rounded-none text-xs"
              >
                Καθαρισμός Όλων
              </Button>
            </div>
            
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {selectedUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between bg-[#00ffba]/10 border border-[#00ffba]/20 p-3 rounded hover:bg-[#00ffba]/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#00ffba]" />
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                      {user.role && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {user.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUserToggle(user.id)}
                    className="rounded-none p-1 h-auto text-gray-500 hover:text-red-600 hover:bg-red-50"
                    title="Αφαίρεση από την επιλογή"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedUsers.length > 0 && (
          <div className="text-sm text-gray-600 bg-blue-50 p-3 border border-blue-200 rounded">
            <Users className="w-4 h-4 inline mr-2" />
            Θα δημιουργηθούν {selectedUsers.length} ατομικές αναθέσεις με τις ίδιες ημερομηνίες προπόνησης.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
