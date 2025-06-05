
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";
import type { User as UserType } from '../../types';

interface UserSelectionProps {
  users: UserType[];
  selectedUserId: string;
  onUserChange: (userId: string) => void;
  selectedUser?: UserType;
}

export const UserSelection: React.FC<UserSelectionProps> = ({
  users,
  selectedUserId,
  onUserChange,
  selectedUser
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Επιλογή Ασκούμενου</h3>
      <Select value={selectedUserId} onValueChange={onUserChange}>
        <SelectTrigger className="rounded-none">
          <SelectValue placeholder="Επιλέξτε ασκούμενο">
            {selectedUser && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {selectedUser.name}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {users.map(user => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {user.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
