
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { User as UserType } from '../../types';

interface Group {
  id: string;
  name: string;
  description?: string;
  member_count?: number;
}

interface GroupUserSelectionProps {
  users: UserType[];
  groups: Group[];
  selectedUserId: string;
  selectedGroupId: string;
  assignmentType: 'individual' | 'group';
  onUserChange: (userId: string) => void;
  onGroupChange: (groupId: string) => void;
  onAssignmentTypeChange: (type: 'individual' | 'group') => void;
  selectedUser: UserType | undefined;
  selectedGroup: Group | undefined;
}

export const GroupUserSelection: React.FC<GroupUserSelectionProps> = ({
  users,
  groups,
  selectedUserId,
  selectedGroupId,
  assignmentType,
  onUserChange,
  onGroupChange,
  onAssignmentTypeChange,
  selectedUser,
  selectedGroup
}) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Επιλογή Αποδέκτη
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assignment Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Τύπος Ανάθεσης</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onAssignmentTypeChange('individual')}
              className={`px-3 py-2 text-sm rounded-none border transition-colors ${
                assignmentType === 'individual'
                  ? 'bg-[#00ffba] text-black border-[#00ffba]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Ατομική
            </button>
            <button
              type="button"
              onClick={() => onAssignmentTypeChange('group')}
              className={`px-3 py-2 text-sm rounded-none border transition-colors ${
                assignmentType === 'group'
                  ? 'bg-[#00ffba] text-black border-[#00ffba]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Ομαδική
            </button>
          </div>
        </div>

        {/* Individual User Selection */}
        {assignmentType === 'individual' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Επιλογή Αθλητή</label>
            <Select value={selectedUserId} onValueChange={onUserChange}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε αθλητή..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{user.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {user.email}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedUser && (
              <div className="mt-3 p-3 bg-gray-50 rounded border">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#00ffba]" />
                  <div>
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                    {selectedUser.role && (
                      <Badge variant="outline" className="mt-1">
                        {selectedUser.role}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Group Selection */}
        {assignmentType === 'group' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Επιλογή Ομάδας</label>
            <Select value={selectedGroupId} onValueChange={onGroupChange}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε ομάδα..." />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{group.name}</span>
                      {group.member_count && (
                        <Badge variant="outline" className="text-xs">
                          {group.member_count} μέλη
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedGroup && (
              <div className="mt-3 p-3 bg-gray-50 rounded border">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#00ffba]" />
                  <div>
                    <p className="font-medium">{selectedGroup.name}</p>
                    {selectedGroup.description && (
                      <p className="text-sm text-gray-600">{selectedGroup.description}</p>
                    )}
                    {selectedGroup.member_count && (
                      <Badge variant="outline" className="mt-1">
                        {selectedGroup.member_count} μέλη
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
