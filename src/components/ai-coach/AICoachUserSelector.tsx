import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Lock } from "lucide-react";
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
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
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
  const { isAdmin, isCoach, userProfile, loading: roleLoading, userRoles } = useRoleCheck();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const hasAutoSelected = useRef(false);

  // Determine if user can change selection - compute once based on roles
  const isUserAdmin = userRoles.includes('admin');
  const isUserCoach = userRoles.includes('coach');
  const canChangeUser = isUserAdmin || isUserCoach;

  useEffect(() => {
    const fetchUsers = async () => {
      // Only fetch once when we have userProfile and roles are loaded
      if (roleLoading || !userProfile || hasFetched.current) return;

      hasFetched.current = true;
      setLoading(true);
      
      try {
        let query = supabase
          .from('app_users')
          .select('id, name, email, avatar_url, photo_url, coach_id')
          .order('name');

        if (isUserAdmin) {
          // Admin sees all users - no additional filter
        } else if (isUserCoach) {
          // Coach sees only their users
          query = query.eq('coach_id', userProfile.id);
        } else {
          // Regular user sees only themselves
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

  // Auto-select current user if no selection and not admin/coach (separate effect)
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

  // Filter users based on search query
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

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get selected user
  const selectedUser = users.find(u => u.id === selectedUserId);

  if (loading || roleLoading) {
    return (
      <div className="p-4 border border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-[#00ffba] rounded-full" />
          <span className="text-sm">Φόρτωση χρηστών...</span>
        </div>
      </div>
    );
  }

  // If user can't change, show locked state
  if (!canChangeUser && userProfile) {
    return (
      <div className="p-3 border border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-full">
            <AvatarImage src={userProfile.avatar_url || userProfile.photo_url} />
            <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba] font-semibold rounded-full">
              {getInitials(userProfile.name || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-sm">{userProfile.name}</p>
            <p className="text-xs text-gray-500">{userProfile.email}</p>
          </div>
          <Lock className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200">
      {/* Selected User Display */}
      {selectedUser && (
        <div className="p-3 bg-[#00ffba]/10 border-b border-gray-200">
          <Label className="text-xs text-gray-600 mb-1 block">Επιλεγμένος χρήστης</Label>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 rounded-full">
              <AvatarImage src={selectedUser.avatar_url || selectedUser.photo_url || ''} />
              <AvatarFallback className="bg-[#00ffba] text-black font-semibold rounded-full">
                {getInitials(selectedUser.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{selectedUser.name}</p>
              <p className="text-xs text-gray-500">{selectedUser.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Αναζήτηση χρήστη..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm rounded-none"
          />
        </div>
      </div>

      {/* Users List */}
      <ScrollArea className="h-[200px]">
        <div className="p-1">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Δεν βρέθηκαν χρήστες
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => onUserSelect(user.id, user.name)}
                className={cn(
                  "flex items-center gap-3 p-2 cursor-pointer transition-colors",
                  selectedUserId === user.id
                    ? "bg-[#00ffba]/20"
                    : "hover:bg-gray-100"
                )}
              >
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src={user.avatar_url || user.photo_url || ''} />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs rounded-full">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.name}</p>
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
