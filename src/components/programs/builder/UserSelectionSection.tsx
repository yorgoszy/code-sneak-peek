
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users } from "lucide-react";
import { UserSelectionPopover } from './UserSelectionPopover';
import type { User as UserType } from '../types';

interface UserSelectionSectionProps {
  availableUsers: UserType[];
  selectedUserIds: string[];
  selectedUsersCount: number;
  onUserToggle: (userId: string) => void;
}

export const UserSelectionSection: React.FC<UserSelectionSectionProps> = ({
  availableUsers,
  selectedUserIds,
  selectedUsersCount,
  onUserToggle
}) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4" />
          Επιλογή Χρηστών
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <UserSelectionPopover
            availableUsers={availableUsers}
            selectedUserIds={selectedUserIds}
            onUserToggle={onUserToggle}
            disabled={availableUsers.length === 0}
          />
        </div>

        {selectedUsersCount > 0 && (
          <div className="text-sm text-gray-600 bg-blue-50 p-3 border border-blue-200 rounded">
            <Users className="w-4 h-4 inline mr-2" />
            Θα δημιουργηθούν {selectedUsersCount} ατομικές αναθέσεις με τις ίδιες ημερομηνίες προπόνησης.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
