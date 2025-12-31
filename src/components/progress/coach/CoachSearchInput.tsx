import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { X, Search, ChevronsUpDown, Check } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

// Normalize function to remove accents and convert to lowercase
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

interface CoachSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  usersMap?: Map<string, { name: string; email: string; avatar_url?: string | null }>;
}

export const CoachSearchInput: React.FC<CoachSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Αναζήτηση (όνομα, email)...",
  usersMap
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [buttonWidth, setButtonWidth] = React.useState<number>(0);

  React.useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [open]);

  // Build options from usersMap
  const options = useMemo(() => {
    if (!usersMap) return [];
    return Array.from(usersMap.entries()).map(([id, user]) => ({
      value: id,
      label: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
      searchTerms: `${user.name} ${user.email || ''}`
    }));
  }, [usersMap]);

  // Filter options based on normalized search
  const filteredOptions = useMemo(() => {
    if (!searchValue) return options;
    
    const normalizedSearch = normalizeString(searchValue);
    
    return options.filter(option => 
      normalizeString(option.searchTerms).includes(normalizedSearch)
    );
  }, [options, searchValue]);

  // If no usersMap, show "All" option to clear filter
  const hasUserSelected = value !== '';
  const selectedUser = usersMap?.get(value);

  return (
    <div className="relative w-full sm:w-[280px] mb-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between rounded-none"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              {hasUserSelected && selectedUser ? (
                <>
                  <Avatar className="h-5 w-5 shrink-0">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">{selectedUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{selectedUser.name}</span>
                </>
              ) : (
                <span className="text-muted-foreground truncate">{placeholder}</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {hasUserSelected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('');
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 rounded-none z-50 bg-white" 
          style={{ width: buttonWidth || 'auto' }}
          align="start"
        >
          <Command>
            <CommandInput 
              placeholder="Αναζήτηση..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>Δεν βρέθηκαν αποτελέσματα.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {/* Show "All" option to clear filter */}
                <CommandItem
                  value="__all__"
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === '' ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="text-muted-foreground">Όλοι οι αθλητές</span>
                </CommandItem>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.searchTerms}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                      setSearchValue("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={option.avatarUrl || undefined} />
                      <AvatarFallback className="text-[10px]">{option.label.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate">{option.label}</span>
                      {option.email && (
                        <span className="text-[10px] text-muted-foreground truncate">{option.email}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
