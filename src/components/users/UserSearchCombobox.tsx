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
}

interface UserSearchComboboxProps {
  value: string;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  coachId?: string;
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
}) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('app_users')
          .select('id, name, email, avatar_url')
          .order('name');

        if (coachId) {
          query = query.eq('coach_id', coachId);
        }

        const { data, error } = await query.limit(100);
        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [coachId]);

  const selectedUser = users.find((u) => u.id === value);

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const normalized = normalizeText(searchQuery);
    return (
      normalizeText(user.name).includes(normalized) ||
      normalizeText(user.email).includes(normalized)
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between rounded-none"
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedUser.avatar_url || ''} />
                <AvatarFallback className="text-xs">
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
        <Command className="rounded-none">
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
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
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
