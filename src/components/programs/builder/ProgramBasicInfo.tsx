
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Users } from "lucide-react";
import { IndividualUserSelection } from './IndividualUserSelection';
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
  coachId?: string;
}

export const ProgramBasicInfo: React.FC<ProgramBasicInfoProps> = ({
  name,
  description,
  selectedUserId,
  selectedUserIds = [],
  selectedGroupId = '',
  users,
  onNameChange,
  onDescriptionChange,
  onAthleteChange,
  onMultipleAthleteChange,
  onGroupChange,
  isMultipleMode = false,
  onToggleMode,
  coachId
}) => {
  const [assignmentMode, setAssignmentMode] = useState<'individual' | 'group'>('individual');

  const handleAssignmentModeChange = (mode: 'individual' | 'group') => {
    setAssignmentMode(mode);
    if (mode === 'group' && onMultipleAthleteChange) {
      onMultipleAthleteChange([]);
    }
    if (mode === 'individual' && onGroupChange) {
      onGroupChange('');
    }
  };

  const handleGroupMembersLoad = (userIds: string[]) => {
    if (onMultipleAthleteChange) {
      onMultipleAthleteChange(userIds);
    }
  };

  return (
    <div className="border rounded-none p-2 md:p-3 space-y-2 md:space-y-3">
      {/* Row 1: Program Name, Description & Assignment Type */}
      <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-3">
        <div className="flex-1 space-y-1">
          <Label htmlFor="program-name" className="text-xs">Όνομα</Label>
          <Input
            id="program-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Όνομα προγράμματος"
            className="rounded-none h-8 text-sm"
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor="program-description" className="text-xs">Περιγραφή</Label>
          <Input
            id="program-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Προαιρετική περιγραφή"
            className="rounded-none h-8 text-sm"
          />
        </div>
        
        {/* Assignment Type Buttons */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleAssignmentModeChange('individual')}
            className={`px-2 py-1.5 text-xs rounded-none border transition-colors flex items-center gap-1 ${
              assignmentMode === 'individual'
                ? 'bg-[#00ffba] text-black border-[#00ffba]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <User className="w-3 h-3" />
            <span className="hidden sm:inline">Ατομική</span>
          </button>
          <button
            type="button"
            onClick={() => handleAssignmentModeChange('group')}
            className={`px-2 py-1.5 text-xs rounded-none border transition-colors flex items-center gap-1 ${
              assignmentMode === 'group'
                ? 'bg-[#00ffba] text-black border-[#00ffba]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Users className="w-3 h-3" />
            <span className="hidden sm:inline">Ομαδική</span>
          </button>
        </div>
      </div>

      {/* Row 2: User/Group Selection */}
      {assignmentMode === 'individual' && (
        <IndividualUserSelection
          selectedUserIds={selectedUserIds}
          users={users}
          onMultipleAthleteChange={onMultipleAthleteChange}
        />
      )}

      {assignmentMode === 'group' && onGroupChange && (
        <GroupSelection
          selectedGroupId={selectedGroupId}
          onGroupChange={onGroupChange}
          onGroupMembersLoad={handleGroupMembersLoad}
          coachId={coachId}
        />
      )}
    </div>
  );
};
