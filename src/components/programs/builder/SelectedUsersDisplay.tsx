
import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X } from "lucide-react";
import type { User as UserType } from '../types';

interface SelectedUsersDisplayProps {
  selectedUsers: UserType[];
  onClearAll: () => void;
  onRemoveUser: (userId: string, event: React.MouseEvent) => void;
}

export const SelectedUsersDisplay: React.FC<SelectedUsersDisplayProps> = ({
  selectedUsers,
  onClearAll,
  onRemoveUser
}) => {
  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex items-center gap-1 p-1 border rounded-none bg-gray-50 min-h-[24px]">
      <div className="flex flex-wrap gap-0.5 flex-1 min-w-0">
        {selectedUsers.length === 0 ? (
          <span className="text-[10px] text-gray-500">Δεν έχουν επιλεγεί χρήστες</span>
        ) : (
          selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-1 bg-white border border-gray-200 px-1 py-0.5 hover:bg-gray-100 transition-colors"
            >
              <Avatar className="w-4 h-4">
                <AvatarImage src={user.photo_url || user.avatar_url || ""} alt={user.name} />
                <AvatarFallback className="text-[8px]">{getUserInitials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] truncate max-w-[60px]">{user.name}</span>
              <button
                onClick={(e) => onRemoveUser(user.id, e)}
                className="text-gray-400 hover:text-red-500 p-0"
                aria-label={`Αφαίρεση ${user.name}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        disabled={selectedUsers.length === 0}
        className="rounded-none text-[9px] h-4 px-1 text-gray-500 hover:text-red-600 disabled:opacity-40"
      >
        Καθαρισμός
      </Button>
    </div>
  );
};
