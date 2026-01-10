import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { cn } from '@/lib/utils';

interface AICoachUserSelectorProps {
  selectedUserId: string | null;
  onUserSelect: (userId: string, userName: string) => void;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  photo_url: string | null;
  coach_id: string | null;
}

// Normalize text for search (remove accents, convert to lowercase)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ά/g, 'α')
    .replace(/έ/g, 'ε')
    .replace(/ή/g, 'η')
    .replace(/ί/g, 'ι')
    .replace(/ό/g, 'ο')
    .replace(/ύ/g, 'υ')
    .replace(/ώ/g, 'ω');
};

export const AICoachUserSelector: React.FC<AICoachUserSelectorProps> = ({
  selectedUserId,
  onUserSelect
}) => {
  const { userProfile, loading: roleLoading, userRoles } = useRoleCheck();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const hasFetched = useRef(false);
  const hasAutoSelected = useRef(false);

  const isUserAdmin = userRoles.includes('admin');
  const isUserCoach = userRoles.includes('coach');
  const canChangeUser = isUserAdmin || isUserCoach;

  useEffect(() => {
    const fetchUsers = async () => {
      if (roleLoading || !userProfile || hasFetched.current) return;

      hasFetched.current = true;
      setLoading(true);
      
      try {
        let query = supabase
          .from('app_users')
          .select('id, name, email, avatar_url, photo_url, coach_id')
          .order('name');

        if (isUserAdmin || isUserCoach) {
          query = query.eq('coach_id', userProfile.id);
        } else {
          query = query.eq('id', userProfile.id);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching users:', error);
          setUsers([]);
        } else {
          setUsers(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userProfile?.id, roleLoading, isUserAdmin, isUserCoach]);

  useEffect(() => {
    if (
      !loading && 
      !roleLoading && 
      !selectedUserId && 
      !canChangeUser && 
      userProfile && 
      !hasAutoSelected.current
    ) {
      hasAutoSelected.current = true;
      onUserSelect(userProfile.id, userProfile.name);
    }
  }, [loading, roleLoading, selectedUserId, canChangeUser, userProfile, onUserSelect]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const normalizedQuery = normalizeText(searchQuery);
    
    return users.filter(user => {
      const normalizedName = normalizeText(user.name || '');
      const normalizedEmail = normalizeText(user.email || '');
      
      return normalizedName.includes(normalizedQuery) || 
             normalizedEmail.includes(normalizedQuery);
    });
  }, [users, searchQuery]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleUserSelect = (userId: string, userName: string) => {
    onUserSelect(userId, userName);
    setIsExpanded(false);
    setSearchQuery('');
  };

  if (loading || roleLoading) {
    return (
      <div className="p-3 border border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-[#00ffba] rounded-full" />
          <span className="text-sm">Φόρτωση...</span>
        </div>
      </div>
    );
  }

  // Locked state for regular users
  if (!canChangeUser && userProfile) {
    return (
      <div className="p-2 border border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 rounded-full">
            <AvatarImage src={userProfile.avatar_url || userProfile.photo_url} />
            <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba] font-semibold text-xs rounded-full">
              {getInitials(userProfile.name || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{userProfile.name}</p>
          </div>
          <Lock className="w-3 h-3 text-gray-400" />
        </div>
      </div>
    );
  }

  // Collapsed state - show selected user only
  if (!isExpanded) {
    return (
      <div 
        className="p-2 border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center gap-2">
          {selectedUser ? (
            <>
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={selectedUser.avatar_url || selectedUser.photo_url || ''} />
                <AvatarFallback className="bg-[#00ffba] text-black font-semibold text-xs rounded-full">
                  {getInitials(selectedUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{selectedUser.name}</p>
              </div>
            </>
          ) : (
            <div className="flex-1">
              <p className="text-sm text-gray-500">Επιλέξτε χρήστη...</p>
            </div>
          )}
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    );
  }

  // Expanded state - show search and list
  return (
    <div className="border border-gray-200 bg-white">
      {/* Header with collapse button */}
      <div 
        className="p-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
        onClick={() => setIsExpanded(false)}
      >
        <span className="text-xs text-gray-600">Επιλογή χρήστη</span>
        <ChevronUp className="w-4 h-4 text-gray-400" />
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            placeholder="Αναζήτηση..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-sm rounded-none"
            autoFocus
          />
        </div>
      </div>

      {/* Users List */}
      <ScrollArea className="h-[150px]">
        <div className="p-1">
          {filteredUsers.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-xs">
              Δεν βρέθηκαν χρήστες
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user.id, user.name)}
                className={cn(
                  "flex items-center gap-2 p-2 cursor-pointer transition-colors",
                  selectedUserId === user.id
                    ? "bg-[#00ffba]/20"
                    : "hover:bg-gray-100"
                )}
              >
                <Avatar className="h-7 w-7 rounded-full">
                  <AvatarImage src={user.avatar_url || user.photo_url || ''} />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs rounded-full">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                {selectedUserId === user.id && (
                  <div className="w-2 h-2 rounded-full bg-[#00ffba]" />
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
