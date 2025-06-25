
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Users, X, Plus } from "lucide-react";
import type { User as UserType } from '../types';

interface IndividualUserSelectionProps {
  selectedUserIds: string[];
  users: UserType[];
  onMultipleAthleteChange?: (userIds: string[]) => void;
}

export const IndividualUserSelection: React.FC<IndividualUserSelectionProps> = ({
  selectedUserIds,
  users,
  onMultipleAthleteChange
}) => {
  const [userListOpen, setUserListOpen] = useState(false);
  
  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const availableUsers = users.filter(user => !selectedUserIds.includes(user.id));

  const handleUserToggle = (userId: string) => {
    console.log('🔄 IndividualUserSelection - handleUserToggle called with userId:', userId);
    
    if (!onMultipleAthleteChange) {
      console.log('❌ IndividualUserSelection - onMultipleAthleteChange not available');
      return;
    }
    
    const newSelectedIds = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    
    console.log('✅ IndividualUserSelection - Updating selectedUserIds from:', selectedUserIds, 'to:', newSelectedIds);
    onMultipleAthleteChange(newSelectedIds);
    
    // Close popover after adding a user (but not when removing)
    if (!selectedUserIds.includes(userId)) {
      setUserListOpen(false);
    }
  };

  const handleClearAll = () => {
    console.log('🧹 IndividualUserSelection - Clearing all selected users');
    if (onMultipleAthleteChange) {
      onMultipleAthleteChange([]);
    }
  };

  const handleUserClick = (userId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('👆 IndividualUserSelection - User clicked:', userId);
    handleUserToggle(userId);
  };

  const handleRemoveUser = (userId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('🗑️ IndividualUserSelection - Removing user:', userId);
    handleUserToggle(userId);
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex gap-4">
      {/* User Selection Box - 30% width */}
      <div className="w-[30%]">
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4" />
              Επιλογή Χρηστών
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Popover open={userListOpen} onOpenChange={setUserListOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal rounded-none"
                    disabled={availableUsers.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {availableUsers.length === 0 
                      ? "Όλοι οι χρήστες έχουν επιλεγεί" 
                      : "Προσθήκη χρήστη..."
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 rounded-none" align="start">
                  <ScrollArea className="max-h-60">
                    <div className="p-2">
                      {availableUsers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          Όλοι οι χρήστες έχουν επιλεγεί
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {availableUsers.map(user => (
                            <div
                              key={user.id}
                              className="w-full p-3 rounded hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 cursor-pointer select-none"
                              onClick={(e) => handleUserClick(user.id, e)}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={user.photo_url} alt={user.name} />
                                    <AvatarFallback className="text-xs">
                                      {getUserInitials(user.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="text-left">
                                    <p className="font-medium text-sm">{user.name}</p>
                                    <p className="text-xs text-gray-600">{user.email}</p>
                                  </div>
                                </div>
                                <Plus className="w-4 h-4 text-[#00ffba]" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>

            {selectedUsers.length > 0 && (
              <div className="text-sm text-gray-600 bg-blue-50 p-3 border border-blue-200 rounded">
                <Users className="w-4 h-4 inline mr-2" />
                Θα δημιουργηθούν {selectedUsers.length} ατομικές αναθέσεις με τις ίδιες ημερομηνίες προπόνησης.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Users Display - 70% width */}
      <div className="w-[70%]">
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Επιλεγμένοι ({selectedUsers.length})
              </span>
              {selectedUsers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="rounded-none text-xs h-6 px-2"
                >
                  Καθαρισμός
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedUsers.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-4">
                Δεν έχουν επιλεγεί χρήστες
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {selectedUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between bg-[#00ffba]/10 border border-[#00ffba]/20 p-2 rounded hover:bg-[#00ffba]/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarImage src={user.photo_url} alt={user.name} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs truncate">{user.name}</p>
                        <p className="text-xs text-gray-600 truncate">{user.email}</p>
                        {user.role && (
                          <Badge variant="outline" className="mt-1 text-xs rounded-none h-4 px-1">
                            {user.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleRemoveUser(user.id, e)}
                      className="rounded-none p-1 h-auto text-gray-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                      title="Αφαίρεση από την επιλογή"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
