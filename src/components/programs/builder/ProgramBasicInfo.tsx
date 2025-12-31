
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramBasicInfoFields } from './ProgramBasicInfoFields';
import { AssignmentTypeSelector } from './AssignmentTypeSelector';
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
  coachId?: string; // Optional: filter groups by coach
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
      // Clear individual selections when switching to group mode
      onMultipleAthleteChange([]);
    }
    if (mode === 'individual' && onGroupChange) {
      // Clear group selection when switching to individual mode
      onGroupChange('');
    }
  };

  const handleGroupMembersLoad = (userIds: string[]) => {
    if (onMultipleAthleteChange) {
      onMultipleAthleteChange(userIds);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Βασικές Πληροφορίες Προγράμματος</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 p-3 md:p-6">
        <ProgramBasicInfoFields
          name={name}
          description={description}
          onNameChange={onNameChange}
          onDescriptionChange={onDescriptionChange}
        />

        {/* Assignment Type Selection */}
        <div className="space-y-3 md:space-y-4">
          <AssignmentTypeSelector
            assignmentMode={assignmentMode}
            onAssignmentModeChange={handleAssignmentModeChange}
          />

          {/* Individual User Selection */}
          {assignmentMode === 'individual' && (
            <IndividualUserSelection
              selectedUserIds={selectedUserIds}
              users={users}
              onMultipleAthleteChange={onMultipleAthleteChange}
            />
          )}

          {/* Group Selection - Responsive width */}
          {assignmentMode === 'group' && onGroupChange && (
            <div className="w-full md:w-[50%] lg:w-[30%]">
              <GroupSelection
                selectedGroupId={selectedGroupId}
                onGroupChange={onGroupChange}
                onGroupMembersLoad={handleGroupMembersLoad}
                coachId={coachId}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
