
import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Users, Save, Plus, Check, Search, X } from "lucide-react";
import { matchesSearchTerm } from "@/lib/utils";
import { SelectedUsersDisplay } from './SelectedUsersDisplay';
import { GroupSelection } from './GroupSelection';
import type { User as UserType } from '../types';

interface ProgramBasicInfoProps {
  name: string;
  description: string;
  selectedUserId?: string;
  selectedUserIds?: string[];
  selectedGroupId?: string;
  users: UserType[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAthleteChange?: (userId: string) => void;
  onMultipleAthleteChange?: (userIds: string[]) => void;
  onGroupChange?: (groupId: string) => void;
  isMultipleMode?: boolean;
  onToggleMode?: (isMultiple: boolean) => void;
  onSave?: () => Promise<void>;
  onAssignments?: () => void;
  onClose?: () => void;
  canAssign?: boolean;
  coachId?: string;
}

export const ProgramBasicInfo: React.FC<ProgramBasicInfoProps> = ({
  name,
  selectedUserIds = [],
  selectedGroupId = '',
  users,
  onNameChange,
  onMultipleAthleteChange,
  onGroupChange,
  onSave,
  onAssignments,
  onClose,
  canAssign = false,
  coachId
}) => {
  const [assignmentMode, setAssignmentMode] = useState<'individual' | 'group'>('individual');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const availableUsers = users.filter(user => !selectedUserIds.includes(user.id));

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return availableUsers;
    return availableUsers.filter(user => 
      matchesSearchTerm(user.name, searchTerm) || 
      matchesSearchTerm(user.email, searchTerm)
    );
  }, [availableUsers, searchTerm]);

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAssignmentModeChange = (mode: 'individual' | 'group') => {
    setAssignmentMode(mode);
    // Δεν καθαρίζουμε τους ήδη επιλεγμένους χρήστες όταν αλλάζουμε mode
    if (mode === 'individual' && onGroupChange) {
      onGroupChange('');
    }
  };

  const handleGroupMembersLoad = (userIds: string[]) => {
    if (onMultipleAthleteChange) {
      onMultipleAthleteChange(userIds);
    }
  };

  const handleUserToggle = (userId: string) => {
    if (!onMultipleAthleteChange) return;
    const newSelectedIds = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    onMultipleAthleteChange(newSelectedIds);
  };

  const handleUserClick = (userId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    handleUserToggle(userId);
    if (!selectedUserIds.includes(userId)) {
      setIsPopoverOpen(false);
    }
  };

  const handleClearAll = () => {
    if (onMultipleAthleteChange) {
      onMultipleAthleteChange([]);
    }
  };

  const handleRemoveUser = (userId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    handleUserToggle(userId);
  };

  return (
    <div className="space-y-1">
      {/* Row 1: Program Name, User Search, Mode Buttons, Action Buttons */}
      <div className="flex items-center gap-1 p-1 border rounded-none flex-wrap">
        {/* Program Name - flexible width with min/max */}
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Όνομα"
          className="rounded-none h-6 text-[10px] min-w-[80px] max-w-[120px] flex-shrink border border-gray-300"
        />
        
        {/* User Search Popover - 20% width */}
        {assignmentMode === 'individual' && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-6 px-2 text-[10px] rounded-none w-[120px] justify-start"
                disabled={availableUsers.length === 0}
              >
                <Plus className="w-3 h-3 mr-1" />
                {availableUsers.length === 0 ? "Όλοι επιλεγμένοι" : "Χρήστης..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0 rounded-none z-[100]" align="start" side="bottom" sideOffset={4}>
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <Input
                    placeholder="Αναζήτηση..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 rounded-none h-6 text-xs"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-scroll overscroll-contain" style={{ scrollbarWidth: 'thin' }}>
                <div className="p-1 space-y-0.5">
                  {filteredUsers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-500">
                      {availableUsers.length === 0 ? "Όλοι επιλεγμένοι" : "Δεν βρέθηκαν"}
                    </div>
                  ) : (
                    filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={(e) => handleUserClick(user.id, e)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={user.photo_url || user.avatar_url || ""} alt={user.name} />
                            <AvatarFallback className="text-[8px]">{getUserInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs truncate">{user.name}</p>
                            <p className="text-[10px] text-gray-600 truncate">{user.email}</p>
                          </div>
                        </div>
                        {selectedUserIds.includes(user.id) ? (
                          <Check className="w-3 h-3 text-[#00ffba]" />
                        ) : (
                          <Plus className="w-3 h-3 text-[#00ffba]" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Group Selection - inline compact */}
        {assignmentMode === 'group' && onGroupChange && (
          <div className="w-[120px]">
            <GroupSelection
              selectedGroupId={selectedGroupId}
              onGroupChange={onGroupChange}
              onGroupMembersLoad={handleGroupMembersLoad}
              coachId={coachId}
              compact
            />
          </div>
        )}
        
        {/* Assignment Type Buttons */}
        <div className="flex gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleAssignmentModeChange('individual')}
            className={`px-2 py-1 text-[10px] rounded-none border transition-colors flex items-center gap-1 ${
              assignmentMode === 'individual'
                ? 'bg-[#00ffba] text-black border-[#00ffba]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <User className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => handleAssignmentModeChange('group')}
            className={`px-2 py-1 text-[10px] rounded-none border transition-colors flex items-center gap-1 ${
              assignmentMode === 'group'
                ? 'bg-[#00ffba] text-black border-[#00ffba]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Users className="w-3 h-3" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-0.5 flex-shrink-0 ml-auto items-center">
          {onSave && (
            <Button
              onClick={onSave}
              variant="outline"
              size="sm"
              className="h-5 px-1.5 text-[9px] rounded-none"
            >
              <Save className="w-2.5 h-2.5" />
            </Button>
          )}
          {onAssignments && (
            <Button
              onClick={onAssignments}
              disabled={!canAssign}
              size="sm"
              className="h-5 px-1.5 text-[9px] rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              <Users className="w-2.5 h-2.5" />
            </Button>
          )}
          {onClose && (
            <Button
              onClick={onClose}
              variant="destructive"
              size="sm"
              className="h-5 px-1.5 text-[9px] rounded-none"
            >
              <X className="w-2.5 h-2.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: Selected Users Display - Always visible */}
      <SelectedUsersDisplay
        selectedUsers={selectedUsers}
        onClearAll={handleClearAll}
        onRemoveUser={handleRemoveUser}
      />
    </div>
  );
};
