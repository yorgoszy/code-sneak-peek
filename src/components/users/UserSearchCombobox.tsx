import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  photo_url: string | null;
}

interface UserSearchComboboxProps {
  value: string;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  coachId?: string;
  /** When true, fetches ALL users with no coach filter (admin sees everyone) */
  adminOwned?: boolean;
  filterByCoach?: boolean;
  disabled?: boolean;
}

// Normalize text for search (remove accents, lowercase)
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

export const UserSearchCombobox: React.FC<UserSearchComboboxProps> = ({
  value,
  onValueChange,
  placeholder = 'Αναζήτηση χρήστη...',
  coachId,
  adminOwned = false,
  filterByCoach = true,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [selectedUserCache, setSelectedUserCache] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('app_users')
          .select('id, name, email, avatar_url, photo_url')
          .order('name');

        if (coachId) {
          query = query.eq('coach_id', coachId);
        } else if (adminOwned) {
          query = query.is('coach_id', null);
        }

        // If user is searching, use server-side ilike on name OR email (handles huge datasets)
        if (searchQuery && searchQuery.trim().length > 0) {
          const q = searchQuery.trim().replace(/[%,]/g, ' ');
          query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
        }

        const { data, error } = await query.limit(500);
        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [coachId, adminOwned, searchQuery]);

  // Ensure the selected user stays visible even if not in current page
  useEffect(() => {
    if (!value) { setSelectedUserCache(null); return; }
    const found = users.find(u => u.id === value);
    if (found) { setSelectedUserCache(found); return; }
    if (selectedUserCache?.id === value) return;
    (async () => {
      const { data } = await supabase
        .from('app_users')
        .select('id, name, email, avatar_url, photo_url')
        .eq('id', value)
        .maybeSingle();
      if (data) setSelectedUserCache(data as User);
    })();
  }, [value, users]);

  const selectedUser = users.find((u) => u.id === value) || selectedUserCache;

  // Client-side accent-insensitive filter on top of server results (Greek/English/no tones)
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const normalized = normalizeText(searchQuery);
    return (
      normalizeText(user.name || '').includes(normalized) ||
      normalizeText(user.email || '').includes(normalized)
    );
  });

  return (
    <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between rounded-none", disabled && "opacity-50 cursor-not-allowed")}
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {(selectedUser.photo_url || selectedUser.avatar_url) ? (
                  <AvatarImage src={selectedUser.photo_url || selectedUser.avatar_url || ''} alt={selectedUser.name} />
                ) : null}
                <AvatarFallback className="text-xs bg-muted">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedUser.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 rounded-none">
        <Command className="rounded-none" shouldFilter={false}>
          <CommandInput
            placeholder="Αναζήτηση με όνομα ή email..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="rounded-none"
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Φόρτωση...' : 'Δεν βρέθηκαν χρήστες'}
            </CommandEmpty>
            <CommandGroup>
              {filteredUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={() => {
                    onValueChange(user.id === value ? null : user.id);
                    setOpen(false);
                  }}
                  className="rounded-none"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === user.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Avatar className="h-6 w-6 mr-2">
                    {(user.photo_url || user.avatar_url) ? (
                      <AvatarImage src={user.photo_url || user.avatar_url || ''} alt={user.name} />
                    ) : null}
                    <AvatarFallback className="text-xs bg-muted">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
