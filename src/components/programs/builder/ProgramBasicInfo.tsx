
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Users, Save } from "lucide-react";
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
  onSave?: () => Promise<void>;
  onAssignments?: () => void;
  canAssign?: boolean;
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
  onSave,
  onAssignments,
  canAssign = false,
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
    <div className="space-y-0">
      {/* Row 1: Program Name & Buttons - No border, compact */}
      <div className="flex items-center gap-1 p-1 border rounded-none">
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Όνομα προγράμματος"
          className="rounded-none h-6 text-xs flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        
        {/* Assignment Type Buttons */}
        <div className="flex gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleAssignmentModeChange('individual')}
            className={`px-1 py-0.5 text-[9px] rounded-none border transition-colors flex items-center gap-0.5 ${
              assignmentMode === 'individual'
                ? 'bg-[#00ffba] text-black border-[#00ffba]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <User className="w-2 h-2" />
          </button>
          <button
            type="button"
            onClick={() => handleAssignmentModeChange('group')}
            className={`px-1 py-0.5 text-[9px] rounded-none border transition-colors flex items-center gap-0.5 ${
              assignmentMode === 'group'
                ? 'bg-[#00ffba] text-black border-[#00ffba]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Users className="w-2 h-2" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-0.5 flex-shrink-0">
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
        </div>
      </div>

      {/* Row 2: User/Group Selection - Compact, no gaps */}
      <div className="border border-t-0 rounded-none p-1.5">
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
    </div>
  );
};
