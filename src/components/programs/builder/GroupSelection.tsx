
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, Group, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GroupType {
  id: string;
  name: string;
  description?: string;
  member_count?: number;
}

interface GroupMember {
  id: string;
  name: string;
  email: string;
  role?: string;
  photo_url?: string;
}

interface GroupSelectionProps {
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  onGroupMembersLoad: (userIds: string[]) => void;
  coachId?: string;
  compact?: boolean;
}

export const GroupSelection: React.FC<GroupSelectionProps> = ({
  selectedGroupId,
  onGroupChange,
  onGroupMembersLoad,
  coachId,
  compact = false
}) => {
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [allGroupsMembers, setAllGroupsMembers] = useState<{[key: string]: GroupMember[]}>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [coachId]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupMembers(selectedGroupId);
    }
  }, [selectedGroupId]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('groups')
        .select(`
          id,
          name,
          description,
          coach_id,
          group_members(id)
        `)
        .order('name');

      if (coachId) {
        query = query.eq('coach_id', coachId);
      }

      const { data: groupsData, error } = await query;

      if (error) {
        console.error('Error fetching groups:', error);
        return;
      }

      const groupsWithMemberCount = groupsData?.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        member_count: group.group_members?.length || 0
      })) || [];

      setGroups(groupsWithMemberCount);
      
      if (!compact) {
        await fetchAllGroupsMembers(groupsWithMemberCount);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllGroupsMembers = async (groupsList: GroupType[]) => {
    const membersMap: {[key: string]: GroupMember[]} = {};
    
    for (const group of groupsList) {
      try {
        const { data: membersData, error } = await supabase
          .from('group_members')
          .select(`
            user_id,
            app_users!inner(
              id,
              name,
              email,
              role,
              photo_url,
              avatar_url
            )
          `)
          .eq('group_id', group.id)
          .limit(3);

        if (!error && membersData) {
          const members = membersData.map(member => ({
            id: member.app_users.id,
            name: member.app_users.name,
            email: member.app_users.email,
            role: member.app_users.role,
            photo_url: member.app_users.photo_url || member.app_users.avatar_url
          }));
          membersMap[group.id] = members;
        }
      } catch (error) {
        console.error(`Error fetching members for group ${group.id}:`, error);
      }
    }
    
    setAllGroupsMembers(membersMap);
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data: membersData, error } = await supabase
        .from('group_members')
        .select(`
          user_id,
          app_users!inner(
            id,
            name,
            email,
            role,
            photo_url,
            avatar_url
          )
        `)
        .eq('group_id', groupId);

      if (error) {
        console.error('Error fetching group members:', error);
        return;
      }

      const members = membersData?.map(member => ({
        id: member.app_users.id,
        name: member.app_users.name,
        email: member.app_users.email,
        role: member.app_users.role,
        photo_url: member.app_users.photo_url || member.app_users.avatar_url
      })) || [];

      const userIds = members.map(member => member.id);
      onGroupMembersLoad(userIds);
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const handleGroupChange = (groupId: string) => {
    onGroupChange(groupId);
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const selectedGroup = groups.find(group => group.id === selectedGroupId);

  // Compact mode - just a small select
  if (compact) {
    return (
      <Select value={selectedGroupId} onValueChange={handleGroupChange} disabled={loading}>
        <SelectTrigger className="rounded-none h-6 text-[10px]">
          <SelectValue placeholder="Ομάδα..." />
        </SelectTrigger>
        <SelectContent className="rounded-none">
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id} className="rounded-none text-xs">
              {group.name} ({group.member_count})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="w-full">
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
              <SelectContent className="rounded-none">
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id} className="rounded-none">
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <Group className="w-4 h-4" />
                        <span className="font-medium">{group.name}</span>
                        <Badge variant="outline" className="text-xs rounded-none">
                          {group.member_count} μέλη
                        </Badge>
                      </div>
                      
                      {allGroupsMembers[group.id] && allGroupsMembers[group.id].length > 0 && (
                        <div className="mt-2 pl-6">
                          <p className="text-xs text-gray-500 mb-1">Μέλη:</p>
                          <div className="space-y-1">
                            {allGroupsMembers[group.id].slice(0, 3).map(member => (
                              <div key={member.id} className="flex items-center gap-1 text-xs">
                                <Avatar className="w-4 h-4">
                                  <AvatarImage src={member.photo_url} alt={member.name} />
                                  <AvatarFallback className="text-xs text-[10px]">
                                    {getUserInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate max-w-[120px]">{member.name}</span>
                              </div>
                            ))}
                            {group.member_count && group.member_count > 3 && (
                              <div className="text-xs text-gray-400">
                                +{group.member_count - 3} ακόμη...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
