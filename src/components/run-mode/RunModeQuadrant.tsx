
import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { UserSelector } from './UserSelector';
import { UserProfileCalendar } from "@/components/user-profile/UserProfileCalendar";

interface User {
  id: string;
  name: string;
  email: string;
}

interface QuadrantData {
  id: string;
  title: string;
  selectedUser?: User;
}

interface RunModeQuadrantProps {
  quadrant: QuadrantData;
  users: User[];
  searchTerm: string;
  isPopoverOpen: boolean;
  onRemove: () => void;
  onSearchChange: (value: string) => void;
  onPopoverOpenChange: (open: boolean) => void;
  onUserSelect: (user: User) => void;
  onRemoveUser: () => void;
}

export const RunModeQuadrant: React.FC<RunModeQuadrantProps> = ({
  quadrant,
  users,
  searchTerm,
  isPopoverOpen,
  onRemove,
  onSearchChange,
  onPopoverOpenChange,
  onUserSelect,
  onRemoveUser
}) => {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-none p-4 flex flex-col h-[calc(50vh-60px)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{quadrant.title}</h2>
        <Button
          onClick={onRemove}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-white hover:bg-[#00ffba] hover:text-black rounded-none"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      {/* User Selection */}
      <div className="mb-4">
        <UserSelector
          selectedUser={quadrant.selectedUser}
          users={users}
          searchTerm={searchTerm}
          isOpen={isPopoverOpen}
          onSearchChange={onSearchChange}
          onOpenChange={onPopoverOpenChange}
          onUserSelect={onUserSelect}
          onRemoveUser={onRemoveUser}
        />
      </div>

      {/* Calendar or Empty State */}
      <div className="flex-1 bg-gray-800 rounded-none overflow-hidden">
        {quadrant.selectedUser ? (
          <div className="h-full w-full">
            <UserProfileCalendar user={quadrant.selectedUser} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-400 text-center text-sm">
              Επιλέξτε ασκούμενο για να δείτε το ημερολόγιό του
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
