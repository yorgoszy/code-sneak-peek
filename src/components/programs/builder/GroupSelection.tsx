
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Group } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Group {
  id: string;
  name: string;
  description?: string;
  member_count?: number;
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupMembers(selectedGroupId);
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

      const groupsWithMemberCount = groupsData?.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        member_count: group.group_members?.length || 0
      })) || [];

      setGroups(groupsWithMemberCount);
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
        .select('user_id')
        .eq('group_id', groupId);

      if (error) {
        console.error('Error fetching group members:', error);
        return;
      }

      const userIds = membersData?.map(member => member.user_id) || [];
      onGroupMembersLoad(userIds);
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const handleGroupChange = (groupId: string) => {
    onGroupChange(groupId);
  };

  const selectedGroup = groups.find(group => group.id === selectedGroupId);

  return (
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
                    {group.member_count && (
                      <Badge variant="outline" className="text-xs rounded-none">
                        {group.member_count} μέλη
                      </Badge>
                    )}
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
                  {selectedGroup.member_count && (
                    <Badge variant="outline" className="mt-1 text-xs rounded-none">
                      {selectedGroup.member_count} μέλη
                    </Badge>
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
  );
};
