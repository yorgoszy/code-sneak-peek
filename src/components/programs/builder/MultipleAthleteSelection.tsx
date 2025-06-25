
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, User, X, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { User as UserType } from '../types';

interface MultipleAthleteSelectionProps {
  users: UserType[];
  selectedUserIds: string[];
  onUserToggle: (userId: string) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

export const MultipleAthleteSelection: React.FC<MultipleAthleteSelectionProps> = ({
  users,
  selectedUserIds,
  onUserToggle,
  onClearAll,
  disabled = false
}) => {
  const [userListOpen, setUserListOpen] = React.useState(false);

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const availableUsers = users.filter(user => !selectedUserIds.includes(user.id));

  const handleUserAdd = (userId: string) => {
    onUserToggle(userId);
    // Κρατάμε το popover ανοιχτό για πολλαπλές επιλογές
  };

  return (
    <div className="space-y-4">
      {/* Add User Button */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Επιλογή Χρηστών</label>
        <Popover open={userListOpen} onOpenChange={setUserListOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal rounded-none"
              disabled={disabled || availableUsers.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              {availableUsers.length === 0 
                ? "Όλοι οι χρήστες έχουν επιλεγεί" 
                : "Προσθήκη χρήστη..."
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-2 rounded-none" align="start">
            <div className="max-h-48 overflow-y-auto">
              {availableUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Όλοι οι χρήστες έχουν επιλεγεί
                </div>
              ) : (
                <div className="space-y-1">
                  {availableUsers.map(user => (
                    <div
                      key={user.id}
                      className="cursor-pointer p-3 rounded hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                      onClick={() => handleUserAdd(user.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <div>
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
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Επιλεγμένοι Χρήστες ({selectedUsers.length})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="rounded-none text-xs"
              disabled={disabled}
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
                      <Badge variant="outline" className="mt-1 text-xs rounded-none">
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
                  disabled={disabled}
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
    </div>
  );
};
