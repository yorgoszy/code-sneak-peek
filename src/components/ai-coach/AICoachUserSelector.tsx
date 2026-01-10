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

const normalizeText = (text: string): string => {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ά/g, 'α').replace(/έ/g, 'ε').replace(/ή/g, 'η')
    .replace(/ί/g, 'ι').replace(/ό/g, 'ο').replace(/ύ/g, 'υ').replace(/ώ/g, 'ω');
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
        let query = supabase.from('app_users').select('id, name, email, avatar_url, photo_url, coach_id').order('name');
        if (isUserAdmin || isUserCoach) {
          query = query.eq('coach_id', userProfile.id);
        } else {
          query = query.eq('id', userProfile.id);
        }
        const { data, error } = await query;
        if (!error) setUsers(data || []);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [userProfile?.id, roleLoading, isUserAdmin, isUserCoach]);

  useEffect(() => {
    if (!loading && !roleLoading && !selectedUserId && !canChangeUser && userProfile && !hasAutoSelected.current) {
      hasAutoSelected.current = true;
      onUserSelect(userProfile.id, userProfile.name);
    }
  }, [loading, roleLoading, selectedUserId, canChangeUser, userProfile, onUserSelect]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = normalizeText(searchQuery);
    return users.filter(u => normalizeText(u.name || '').includes(q) || normalizeText(u.email || '').includes(q));
  }, [users, searchQuery]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleUserSelect = (userId: string, userName: string) => {
    onUserSelect(userId, userName);
    setIsExpanded(false);
    setSearchQuery('');
  };

  if (loading || roleLoading) {
    return (
      <div className="h-8 flex items-center gap-2 px-2 border border-gray-200 bg-gray-50 text-xs text-gray-500">
        <div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-[#00ffba] rounded-full" />
        Φόρτωση...
      </div>
    );
  }

  if (!canChangeUser && userProfile) {
    return (
      <div className="h-8 flex items-center gap-2 px-2 border border-gray-200 bg-gray-50">
        <Avatar className="h-5 w-5 rounded-full">
          <AvatarImage src={userProfile.avatar_url || userProfile.photo_url} />
          <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba] text-xs rounded-full">{getInitials(userProfile.name || 'U')}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium truncate flex-1">{userProfile.name}</span>
        <Lock className="w-3 h-3 text-gray-400" />
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <div className="h-8 flex items-center gap-2 px-2 border border-gray-200 bg-white cursor-pointer hover:bg-gray-50" onClick={() => setIsExpanded(true)}>
        {selectedUser ? (
          <>
            <Avatar className="h-5 w-5 rounded-full">
              <AvatarImage src={selectedUser.avatar_url || selectedUser.photo_url || ''} />
              <AvatarFallback className="bg-[#00ffba] text-black text-xs rounded-full">{getInitials(selectedUser.name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate flex-1">{selectedUser.name}</span>
          </>
        ) : (
          <span className="text-sm text-gray-500 flex-1">Επιλέξτε χρήστη...</span>
        )}
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="border border-gray-200 bg-white">
      <div className="h-7 flex items-center justify-between px-2 border-b cursor-pointer hover:bg-gray-50" onClick={() => setIsExpanded(false)}>
        <span className="text-xs text-gray-600">Επιλογή χρήστη</span>
        <ChevronUp className="w-3 h-3 text-gray-400" />
      </div>
      <div className="p-1 border-b">
        <div className="relative">
          <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input placeholder="Αναζήτηση..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-6 h-6 text-xs rounded-none" autoFocus />
        </div>
      </div>
      <ScrollArea className="h-[120px]">
        {filteredUsers.length === 0 ? (
          <div className="p-2 text-center text-xs text-gray-500">Δεν βρέθηκαν</div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} onClick={() => handleUserSelect(user.id, user.name)} className={cn("flex items-center gap-2 p-1.5 cursor-pointer", selectedUserId === user.id ? "bg-[#00ffba]/20" : "hover:bg-gray-100")}>
              <Avatar className="h-5 w-5 rounded-full">
                <AvatarImage src={user.avatar_url || user.photo_url || ''} />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs rounded-full">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium truncate flex-1">{user.name}</span>
              {selectedUserId === user.id && <div className="w-1.5 h-1.5 rounded-full bg-[#00ffba]" />}
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  );
};
