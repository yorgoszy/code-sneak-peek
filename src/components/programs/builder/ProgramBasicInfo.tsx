
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Users, X, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { User as UserType } from '../types';

interface ProgramBasicInfoProps {
  name: string;
  description: string;
  selectedUserId?: string;
  selectedUserIds?: string[];
  users: UserType[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAthleteChange?: (userId: string) => void;
  onMultipleAthleteChange?: (userIds: string[]) => void;
  isMultipleMode?: boolean;
  onToggleMode?: (isMultiple: boolean) => void;
}

export const ProgramBasicInfo: React.FC<ProgramBasicInfoProps> = ({
  name,
  description,
  selectedUserId,
  selectedUserIds = [],
  users,
  onNameChange,
  onDescriptionChange,
  onAthleteChange,
  onMultipleAthleteChange,
  isMultipleMode = false,
  onToggleMode
}) => {
  const [userListOpen, setUserListOpen] = useState(false);
  
  // Φιλτράρουμε όλους τους χρήστες από το app_users table
  const allUsers = users;
  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const availableUsers = users.filter(user => !selectedUserIds.includes(user.id));

  const handleUserToggle = (userId: string) => {
    if (!onMultipleAthleteChange) return;
    
    const newSelectedIds = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    
    onMultipleAthleteChange(newSelectedIds);
  };

  const handleClearAll = () => {
    if (onMultipleAthleteChange) {
      onMultipleAthleteChange([]);
    }
  };

  const handleUserAdd = (userId: string) => {
    handleUserToggle(userId);
    // Κρατάμε το popover ανοιχτό για πολλαπλές επιλογές
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Βασικές Πληροφορίες Προγράμματος</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="program-name">Όνομα Προγράμματος</Label>
          <Input
            id="program-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Εισάγετε το όνομα του προγράμματος"
            className="rounded-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="program-description">Περιγραφή</Label>
          <Textarea
            id="program-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Προαιρετική περιγραφή του προγράμματος"
            className="rounded-none"
            rows={3}
          />
        </div>

        {/* User Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Επιλογή Χρηστών</label>
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
                  onClick={handleClearAll}
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
                          <Badge variant="outline" className="mt-1 text-xs rounded-none">
                            {user.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUserToggle(user.id)}
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
        </div>
      </CardContent>
    </Card>
  );
};
