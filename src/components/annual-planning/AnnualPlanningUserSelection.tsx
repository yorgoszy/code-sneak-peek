
import React, { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Users, Plus, Check, Search, X, Group } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AppUser {
  id: string;
  name: string;
  email: string;
  photo_url?: string | null;
  avatar_url?: string | null;
  coach_id?: string | null;
}

interface GroupType {
  id: string;
  name: string;
  description?: string;
  member_count?: number;
}

interface AnnualPlanningUserSelectionProps {
  selectedUserIds: string[];
  selectedGroupIds: string[];
  onUserIdsChange: (userIds: string[]) => void;
  onGroupIdsChange: (groupIds: string[]) => void;
  disabled?: boolean;
  coachId?: string;
}

const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ά]/g, 'α')
    .replace(/[έ]/g, 'ε')
    .replace(/[ή]/g, 'η')
    .replace(/[ί]/g, 'ι')
    .replace(/[ό]/g, 'ο')
    .replace(/[ύ]/g, 'υ')
    .replace(/[ώ]/g, 'ω');
};

const matchesSearchTerm = (text: string, searchTerm: string): boolean => {
  const normalizedText = normalizeString(text);
  const normalizedSearch = normalizeString(searchTerm);
  return normalizedText.includes(normalizedSearch);
};

export const AnnualPlanningUserSelection: React.FC<AnnualPlanningUserSelectionProps> = ({
  selectedUserIds,
  selectedGroupIds,
  onUserIdsChange,
  onGroupIdsChange,
  disabled = false,
  coachId
}) => {
  const [assignmentMode, setAssignmentMode] = useState<'individual' | 'group'>('individual');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, [coachId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('app_users')
        .select('id, name, email, photo_url, avatar_url, coach_id')
        .order('name');

      if (coachId) {
        query = query.eq('coach_id', coachId);
      }

      const { data, error } = await query;
      if (!error && data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
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

      const { data, error } = await query;
      if (!error && data) {
        const groupsWithMemberCount = data.map(group => ({
          id: group.id,
          name: group.name,
          description: group.description,
          member_count: group.group_members?.length || 0
        }));
        setGroups(groupsWithMemberCount);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

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
    if (mode === 'individual') {
      onGroupIdsChange([]);
    }
  };

  const handleUserToggle = (userId: string) => {
    const newSelectedIds = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    onUserIdsChange(newSelectedIds);
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
    onUserIdsChange([]);
    onGroupIdsChange([]);
  };

  const handleRemoveUser = (userId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    handleUserToggle(userId);
  };

  const handleGroupChange = async (groupId: string) => {
    onGroupIdsChange([groupId]);

    // Fetch group members and add them to selectedUserIds
    try {
      const { data: membersData, error } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (!error && membersData) {
        const memberIds = membersData.map(m => m.user_id);
        onUserIdsChange(memberIds);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  return (
    <div className="space-y-1">
      {/* Row 1: User Search, Mode Buttons */}
      <div className="flex items-center gap-1 p-1 border rounded-none">
        {/* User Search Popover */}
        {assignmentMode === 'individual' && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-6 px-2 text-[10px] rounded-none w-[120px] justify-start"
                disabled={disabled || availableUsers.length === 0}
              >
                <Plus className="w-3 h-3 mr-1" />
                {availableUsers.length === 0 ? "Όλοι επιλεγμένοι" : "Χρήστης..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 p-0 rounded-none z-[100]"
              align="start"
              side="bottom"
              sideOffset={4}
              onWheelCapture={(e) => e.stopPropagation()}
              onTouchMoveCapture={(e) => e.stopPropagation()}
            >
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
              <ScrollArea className="h-48">
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
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}

        {/* Group Selection */}
        {assignmentMode === 'group' && (
          <div className="w-[120px]">
            <Select 
              value={selectedGroupIds[0] || ''} 
              onValueChange={handleGroupChange} 
              disabled={disabled || loading}
            >
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
          </div>
        )}
        
        {/* Assignment Type Buttons */}
        <div className="flex gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleAssignmentModeChange('individual')}
            disabled={disabled}
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
            disabled={disabled}
            className={`px-2 py-1 text-[10px] rounded-none border transition-colors flex items-center gap-1 ${
              assignmentMode === 'group'
                ? 'bg-[#00ffba] text-black border-[#00ffba]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Users className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Row 2: Selected Users Display */}
      <div className="flex items-center gap-1 p-1 border rounded-none bg-gray-50 min-h-[24px]">
        <div className="flex flex-wrap gap-0.5 flex-1 min-w-0">
          {selectedUsers.length === 0 ? (
            <span className="text-[10px] text-gray-500">Δεν έχουν επιλεγεί χρήστες</span>
          ) : (
            selectedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-1 bg-white border border-gray-200 px-1 py-0.5 hover:bg-gray-100 transition-colors"
              >
                <Avatar className="w-4 h-4">
                  <AvatarImage src={user.photo_url || user.avatar_url || ""} alt={user.name} />
                  <AvatarFallback className="text-[8px]">{getUserInitials(user.name)}</AvatarFallback>
                </Avatar>
                <span className="text-[10px] truncate max-w-[40px] md:max-w-[60px]">{user.name}</span>
                <button
                  onClick={(e) => handleRemoveUser(user.id, e)}
                  className="text-gray-400 hover:text-red-500 p-0"
                  aria-label={`Αφαίρεση ${user.name}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          disabled={selectedUsers.length === 0}
          className="rounded-none text-[9px] h-4 px-1 text-gray-500 hover:text-red-600 disabled:opacity-40"
        >
          <span className="hidden md:inline">Καθαρισμός</span>
          <X className="w-3 h-3 md:hidden" />
        </Button>
      </div>
    </div>
  );
};
