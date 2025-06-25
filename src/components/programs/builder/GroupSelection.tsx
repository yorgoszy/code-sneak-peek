
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
  members?: GroupMember[];
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
}

export const GroupSelection: React.FC<GroupSelectionProps> = ({
  selectedGroupId,
  onGroupChange,
  onGroupMembersLoad
}) => {
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupMembers(selectedGroupId);
    } else {
      setGroupMembers([]);
    }
  }, [selectedGroupId]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          description,
          group_members!inner(id)
        `)
        .order('name');

      if (error) {
        console.error('Error fetching groups:', error);
        return;
      }

      // Fetch members for each group to show in dropdown
      const groupsWithMembers = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { data: membersData } = await supabase
            .from('group_members')
            .select(`
              user_id,
              app_users!inner(
                id,
                name,
                email,
                role,
                photo_url
              )
            `)
            .eq('group_id', group.id);

          const members = membersData?.map(member => ({
            id: member.app_users.id,
            name: member.app_users.name,
            email: member.app_users.email,
            role: member.app_users.role,
            photo_url: member.app_users.photo_url
          })) || [];

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            member_count: members.length,
            members
          };
        })
      );

      setGroups(groupsWithMembers);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
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
            photo_url
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
        photo_url: member.app_users.photo_url
      })) || [];

      setGroupMembers(members);
      
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

  return (
    <div className="flex gap-4">
      {/* Group Selection Box - 30% width */}
      <div className="w-[30%]">
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
                    <SelectItem key={group.id} value={group.id}>
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-2">
                          <Group className="w-4 h-4" />
                          <span className="font-medium">{group.name}</span>
                          <Badge variant="outline" className="text-xs rounded-none">
                            {group.member_count} μέλη
                          </Badge>
                        </div>
                        {group.description && (
                          <p className="text-xs text-gray-600 mb-2">{group.description}</p>
                        )}
                        {/* Show members preview in dropdown */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-700">Μέλη:</p>
                          <div className="flex flex-wrap gap-1">
                            {group.members?.slice(0, 3).map(member => (
                              <div key={member.id} className="flex items-center gap-1 bg-gray-100 px-1 py-0.5 rounded text-xs">
                                <Avatar className="w-3 h-3">
                                  <AvatarImage src={member.photo_url} alt={member.name} />
                                  <AvatarFallback className="text-xs">
                                    {getUserInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate max-w-16">{member.name.split(' ')[0]}</span>
                              </div>
                            ))}
                            {(group.members?.length || 0) > 3 && (
                              <span className="text-xs text-gray-500">+{(group.members?.length || 0) - 3}</span>
                            )}
                          </div>
                        </div>
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

      {/* Group Members Display - 70% width */}
      <div className="w-[70%]">
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              {selectedGroup ? `Μέλη ομάδας "${selectedGroup.name}" (${groupMembers.length})` : 'Μέλη Ομάδας'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedGroup ? (
              <div className="text-center text-sm text-gray-500 py-4">
                Επιλέξτε μια ομάδα για να δείτε τα μέλη της
              </div>
            ) : groupMembers.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-4">
                Η ομάδα δεν έχει μέλη
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {groupMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 bg-[#00ffba]/10 border border-[#00ffba]/20 p-2 rounded hover:bg-[#00ffba]/20 transition-colors"
                  >
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage src={member.photo_url} alt={member.name} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs truncate">{member.name}</p>
                      <p className="text-xs text-gray-600 truncate">{member.email}</p>
                      {member.role && (
                        <Badge variant="outline" className="mt-1 text-xs rounded-none h-4 px-1">
                          {member.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
