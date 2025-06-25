
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Users } from "lucide-react";
import { MultipleAthleteSelection } from './MultipleAthleteSelection';
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
  const athleteUsers = users.filter(user => 
    user.role === 'athlete' || 
    user.role === 'user' || 
    !user.role
  );

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

        {/* Mode Toggle Buttons */}
        {onToggleMode && (
          <div className="space-y-2">
            <Label>Τύπος Ανάθεσης</Label>
            <div className="flex gap-2">
              <Button
                variant={!isMultipleMode ? "default" : "outline"}
                onClick={() => onToggleMode(false)}
                className="flex items-center gap-2 rounded-none"
              >
                <User className="w-4 h-4" />
                Ένας Αθλητής
              </Button>
              <Button
                variant={isMultipleMode ? "default" : "outline"}
                onClick={() => onToggleMode(true)}
                className="flex items-center gap-2 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
              >
                <Users className="w-4 h-4" />
                Πολλαπλοί Αθλητές
              </Button>
            </div>
          </div>
        )}

        {/* Single Athlete Selection */}
        {!isMultipleMode && onAthleteChange && (
          <div className="space-y-2">
            <Label>Αθλητής</Label>
            <Select value={selectedUserId || ""} onValueChange={onAthleteChange}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε αθλητή" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {athleteUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Multiple Athletes Selection */}
        {isMultipleMode && onMultipleAthleteChange && (
          <MultipleAthleteSelection
            users={athleteUsers}
            selectedUserIds={selectedUserIds}
            onUserToggle={handleUserToggle}
            onClearAll={handleClearAll}
          />
        )}
      </CardContent>
    </Card>
  );
};
