import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, Users, X, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  photo_url?: string | null;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
}

interface MultipleRecipientSelectionProps {
  selectedUserIds: string[];
  selectedGroupIds: string[];
  onUserIdsChange: (userIds: string[]) => void;
  onGroupIdsChange: (groupIds: string[]) => void;
  disabled?: boolean;
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

export const MultipleRecipientSelection: React.FC<MultipleRecipientSelectionProps> = ({
  selectedUserIds,
  selectedGroupIds,
  onUserIdsChange,
  onGroupIdsChange,
  disabled = false
}) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, name, email, avatar_url, photo_url')
      .order('name');

    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        group_members (count)
      `)
      .order('name');

    if (!error && data) {
      const groupsWithCount = data.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        member_count: (g.group_members as any)?.[0]?.count || 0
      }));
      setGroups(groupsWithCount);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const normalized = normalizeString(userSearch);
    return users.filter(user => {
      const normalizedName = normalizeString(user.name);
      const normalizedEmail = normalizeString(user.email);
      return normalizedName.includes(normalized) || normalizedEmail.includes(normalized);
    });
  }, [users, userSearch]);

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    const normalized = normalizeString(groupSearch);
    return groups.filter(group => {
      const normalizedName = normalizeString(group.name);
      return normalizedName.includes(normalized);
    });
  }, [groups, groupSearch]);

  const selectedUsers = useMemo(() => {
    return users.filter(u => selectedUserIds.includes(u.id));
  }, [users, selectedUserIds]);

  const selectedGroups = useMemo(() => {
    return groups.filter(g => selectedGroupIds.includes(g.id));
  }, [groups, selectedGroupIds]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onUserIdsChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onUserIdsChange([...selectedUserIds, userId]);
    }
  };

  const toggleGroup = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      onGroupIdsChange(selectedGroupIds.filter(id => id !== groupId));
    } else {
      onGroupIdsChange([...selectedGroupIds, groupId]);
    }
  };

  const removeUser = (userId: string) => {
    onUserIdsChange(selectedUserIds.filter(id => id !== userId));
  };

  const removeGroup = (groupId: string) => {
    onGroupIdsChange(selectedGroupIds.filter(id => id !== groupId));
  };

  const clearAll = () => {
    onUserIdsChange([]);
    onGroupIdsChange([]);
  };

  const totalSelected = selectedUserIds.length + selectedGroupIds.length;

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium">Επιλογή Αποδεκτών</label>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between rounded-none h-8 text-xs"
            disabled={disabled}
          >
            <span className="truncate">
              {totalSelected === 0 
                ? 'Επιλέξτε χρήστες ή ομάδες...'
                : `${selectedUserIds.length} χρήστες, ${selectedGroupIds.length} ομάδες`
              }
            </span>
            <ChevronDown className="h-3 w-3 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 rounded-none" align="start">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'users' | 'groups')}>
            <TabsList className="w-full grid grid-cols-2 rounded-none h-8">
              <TabsTrigger value="users" className="rounded-none text-xs flex items-center gap-1">
                <User className="h-3 w-3" />
                Χρήστες ({selectedUserIds.length})
              </TabsTrigger>
              <TabsTrigger value="groups" className="rounded-none text-xs flex items-center gap-1">
                <Users className="h-3 w-3" />
                Ομάδες ({selectedGroupIds.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="m-0 p-2">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Αναζήτηση χρήστη..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-7 rounded-none h-7 text-xs"
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredUsers.map(user => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={`flex items-center gap-2 p-1.5 cursor-pointer rounded-none transition-colors ${
                        isSelected ? 'bg-[#00ffba]/20 border border-[#00ffba]' : 'hover:bg-muted'
                      }`}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar_url || user.photo_url || undefined} />
                        <AvatarFallback className="text-[8px]">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="groups" className="m-0 p-2">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Αναζήτηση ομάδας..."
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  className="pl-7 rounded-none h-7 text-xs"
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredGroups.map(group => {
                  const isSelected = selectedGroupIds.includes(group.id);
                  return (
                    <div
                      key={group.id}
                      onClick={() => toggleGroup(group.id)}
                      className={`flex items-center gap-2 p-1.5 cursor-pointer rounded-none transition-colors ${
                        isSelected ? 'bg-[#00ffba]/20 border border-[#00ffba]' : 'hover:bg-muted'
                      }`}
                    >
                      <div className="h-6 w-6 bg-muted flex items-center justify-center">
                        <Users className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{group.name}</p>
                        <p className="text-[10px] text-muted-foreground">{group.member_count} μέλη</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>

      {/* Selected items display */}
      {totalSelected > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedUsers.map(user => (
            <Badge
              key={user.id}
              variant="secondary"
              className="rounded-none text-[10px] py-0.5 px-1 flex items-center gap-1"
            >
              <Avatar className="h-3 w-3">
                <AvatarImage src={user.avatar_url || user.photo_url || undefined} />
                <AvatarFallback className="text-[6px]">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[60px]">{user.name}</span>
              <X 
                className="h-2.5 w-2.5 cursor-pointer hover:text-destructive" 
                onClick={(e) => { e.stopPropagation(); removeUser(user.id); }}
              />
            </Badge>
          ))}
          {selectedGroups.map(group => (
            <Badge
              key={group.id}
              variant="outline"
              className="rounded-none text-[10px] py-0.5 px-1 flex items-center gap-1 border-[#cb8954] text-[#cb8954]"
            >
              <Users className="h-2.5 w-2.5" />
              <span className="truncate max-w-[60px]">{group.name}</span>
              <X 
                className="h-2.5 w-2.5 cursor-pointer hover:text-destructive" 
                onClick={(e) => { e.stopPropagation(); removeGroup(group.id); }}
              />
            </Badge>
          ))}
          {totalSelected > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-5 px-1 text-[10px] rounded-none text-muted-foreground hover:text-destructive"
            >
              Καθαρισμός
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
