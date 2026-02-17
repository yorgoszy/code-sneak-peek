
import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X } from "lucide-react";
import type { User as UserType } from '../types';

interface SelectedUsersDisplayProps {
  selectedUsers: UserType[];
  activeUserId?: string | null;
  onClearAll: () => void;
  onRemoveUser: (userId: string, event: React.MouseEvent) => void;
  onSelectActiveUser?: (userId: string) => void;
}

export const SelectedUsersDisplay: React.FC<SelectedUsersDisplayProps> = ({
  selectedUsers,
  activeUserId,
  onClearAll,
  onRemoveUser,
  onSelectActiveUser
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
          selectedUsers.map((user) => {
            const isActive = activeUserId === user.id;
            return (
              <div
                key={user.id}
                className={`flex items-center gap-1 border px-1 py-0.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#00ffba]/20 border-[#00ffba] ring-1 ring-[#00ffba]'
                    : 'bg-white border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => onSelectActiveUser?.(user.id)}
                title={`Κλικ για προβολή δεδομένων: ${user.name}`}
              >
                <Avatar className="w-4 h-4">
                  <AvatarImage src={user.photo_url || user.avatar_url || ""} alt={user.name} />
                  <AvatarFallback className="text-[8px]">{getUserInitials(user.name)}</AvatarFallback>
                </Avatar>
                <span className={`text-[10px] truncate max-w-[40px] md:max-w-[60px] ${isActive ? 'font-semibold' : ''}`}>
                  {user.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveUser(user.id, e);
                  }}
                  className="text-gray-400 hover:text-red-500 p-0"
                  aria-label={`Αφαίρεση ${user.name}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        disabled={selectedUsers.length === 0}
        className="rounded-none text-[9px] h-4 px-1 text-gray-500 hover:text-red-600 disabled:opacity-40"
      >
        <span className="hidden md:inline">Καθαρισμός</span>
        <X className="w-3 h-3 md:hidden" />
      </Button>
    </div>
  );
};
