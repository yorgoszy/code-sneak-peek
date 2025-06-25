
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Group, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GroupType {
  id: string;
  name: string;
  description?: string;
  member_count?: number;
  members?: GroupMember[];
}

interface GroupMember {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface GroupSelectionProps {
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  onGroupMembersLoad: (userIds: string[]) => void;
}

export const GroupSelection: React.FC<GroupSelectionProps> = ({
  selectedGroupId,
  onGroupChange,
  onGroupMembersLoad
}) => {
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroupsWithMembers();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      const selectedGroup = groups.find(group => group.id === selectedGroupId);
      if (selectedGroup?.members) {
        const userIds = selectedGroup.members.map(member => member.id);
        onGroupMembersLoad(userIds);
      }
    }
  }, [selectedGroupId, groups, onGroupMembersLoad]);

  const fetchGroupsWithMembers = async () => {
    setLoading(true);
    try {
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          description,
          group_members!inner(
            user_id,
            app_users!inner(
              id,
              name,
              email,
              role
            )
          )
        `)
        .order('name');

      if (error) {
        console.error('Error fetching groups with members:', error);
        return;
      }

      const groupsWithMembers = groupsData?.map(group => {
        const members = group.group_members?.map(member => ({
          id: member.app_users.id,
          name: member.app_users.name,
          email: member.app_users.email,
          role: member.app_users.role
        })) || [];

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          member_count: members.length,
          members
        };
      }) || [];

      setGroups(groupsWithMembers);
    } catch (error) {
      console.error('Error fetching groups with members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = (groupId: string) => {
    onGroupChange(groupId);
  };

  const selectedGroup = groups.find(group => group.id === selectedGroupId);

  return (
    <div className="space-y-4">
      {/* Groups Overview Section */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            Επισκόπηση Ομάδων
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {groups.map((group) => (
              <div
                key={group.id}
                className="border border-gray-200 rounded p-3 bg-gray-50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Group className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-sm">{group.name}</span>
                  <Badge variant="outline" className="text-xs rounded-none">
                    {group.member_count} μέλη
                  </Badge>
                </div>
                
                {group.description && (
                  <p className="text-xs text-gray-600 mb-2">{group.description}</p>
                )}
                
                {group.members && group.members.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700">Μέλη:</p>
                    <div className="grid grid-cols-1 gap-1">
                      {group.members.map(member => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 p-1 bg-white rounded border"
                        >
                          <User className="w-3 h-3 text-gray-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{member.name}</p>
                            <p className="text-xs text-gray-500 truncate">{member.email}</p>
                          </div>
                          {member.role && (
                            <Badge variant="outline" className="text-xs rounded-none h-4 px-1">
                              {member.role}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Group Selection Section */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Group className="w-4 h-4" />
            Επιλογή Ομάδας
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Select value={selectedGroupId} onValueChange={handleGroupChange} disabled={loading}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε ομάδα..." />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <Group className="w-4 h-4" />
                      <span>{group.name}</span>
                      <Badge variant="outline" className="text-xs rounded-none">
                        {group.member_count} μέλη
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedGroup && (
              <div className="mt-3 p-3 bg-[#00ffba]/10 border border-[#00ffba]/20 rounded">
                <div className="flex items-center gap-2">
                  <Group className="w-5 h-5 text-[#00ffba]" />
                  <div>
                    <p className="font-medium text-sm">{selectedGroup.name}</p>
                    {selectedGroup.description && (
                      <p className="text-xs text-gray-600">{selectedGroup.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedGroup && (
              <div className="text-sm text-gray-600 bg-blue-50 p-3 border border-blue-200 rounded">
                <Users className="w-4 h-4 inline mr-2" />
                Θα δημιουργηθούν {selectedGroup.member_count} ατομικές αναθέσεις για όλα τα μέλη της ομάδας.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
