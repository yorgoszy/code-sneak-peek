
import React, { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Check, Search } from "lucide-react";
import { matchesSearchTerm } from "@/lib/utils";
import type { User as UserType } from '../types';

interface UserSelectionPopoverProps {
  availableUsers: UserType[];
  selectedUserIds: string[];
  onUserToggle: (userId: string) => void;
  disabled?: boolean;
}

export const UserSelectionPopover: React.FC<UserSelectionPopoverProps> = ({
  availableUsers,
  selectedUserIds,
  onUserToggle,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Φιλτράρουμε τους χρήστες βάσει του search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return availableUsers;
    
    return availableUsers.filter(user => 
      matchesSearchTerm(user.name, searchTerm) || 
      matchesSearchTerm(user.email, searchTerm)
    );
  }, [availableUsers, searchTerm]);

  const handleUserClick = (userId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onUserToggle(userId);
    
    // Κλείνουμε το popover μόνο αν προσθέτουμε χρήστη
    if (!selectedUserIds.includes(userId)) {
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal rounded-none"
          disabled={disabled}
        >
          <Plus className="mr-2 h-4 w-4" />
          {availableUsers.length === 0 
            ? "Όλοι οι χρήστες έχουν επιλεγεί" 
            : "Προσθήκη χρήστη..."
          }
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0 rounded-none bg-background border z-50" 
        align="start"
      >
        {/* Search Input */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Αναζήτηση χρήστη..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 rounded-none h-7 text-xs"
            />
          </div>
        </div>

        <ScrollArea className="h-48">
          {availableUsers.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Όλοι οι χρήστες έχουν επιλεγεί
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Δεν βρέθηκαν χρήστες
            </div>
          ) : (
            <div className="p-1 space-y-0.5">
              {filteredUsers.map(user => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={(e) => handleUserClick(user.id, e)}
                    onMouseDown={(e) => e.preventDefault()}
                    className={`flex items-center gap-2 p-1.5 cursor-pointer rounded-none transition-colors ${
                      isSelected ? 'bg-[#00ffba]/20 border border-[#00ffba]' : 'hover:bg-muted'
                    }`}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.photo_url || user.avatar_url || ""} alt={user.name} />
                      <AvatarFallback className="text-[8px]">{getUserInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                    {isSelected ? (
                      <Check className="w-3 h-3 text-[#00ffba] flex-shrink-0" />
                    ) : (
                      <Plus className="w-3 h-3 text-[#00ffba] flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
