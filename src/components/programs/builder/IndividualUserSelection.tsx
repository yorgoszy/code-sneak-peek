
import React from 'react';
import { UserSelectionSection } from './UserSelectionSection';
import { SelectedUsersDisplay } from './SelectedUsersDisplay';
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
  };

  const handleClearAll = () => {
    console.log('🧹 IndividualUserSelection - Clearing all selected users');
    if (onMultipleAthleteChange) {
      onMultipleAthleteChange([]);
    }
  };

  const handleRemoveUser = (userId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('🗑️ IndividualUserSelection - Removing user:', userId);
    handleUserToggle(userId);
  };

  return (
    <div className="flex gap-4">
      {/* User Selection Box - 30% width */}
      <div className="w-[30%]">
        <UserSelectionSection
          availableUsers={availableUsers}
          selectedUserIds={selectedUserIds}
          selectedUsersCount={selectedUsers.length}
          onUserToggle={handleUserToggle}
        />
      </div>

      {/* Selected Users Display - 70% width */}
      <div className="w-[70%]">
        <SelectedUsersDisplay
          selectedUsers={selectedUsers}
          onClearAll={handleClearAll}
          onRemoveUser={handleRemoveUser}
        />
      </div>
    </div>
  );
};
