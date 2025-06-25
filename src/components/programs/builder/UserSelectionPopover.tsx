
import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Check } from "lucide-react";
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

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

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
        className="w-80 p-0 rounded-none z-[100]" 
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <div 
          className="max-h-60 overflow-y-scroll overscroll-contain"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="p-2 space-y-1">
            {availableUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Όλοι οι χρήστες έχουν επιλεγεί
              </div>
            ) : (
              availableUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 cursor-pointer select-none"
                  onClick={(e) => handleUserClick(user.id, e)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage src={user.photo_url} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    </div>
                  </div>
                  {selectedUserIds.includes(user.id) ? (
                    <Check className="w-4 h-4 text-[#00ffba] flex-shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-[#00ffba] flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
