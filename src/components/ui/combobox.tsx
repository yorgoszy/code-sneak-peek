import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Normalize function to remove accents and convert to lowercase
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics/accents
};

interface ComboboxProps {
  options: { value: string; label: string; searchTerms?: string; avatarUrl?: string | null }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Επιλέξτε...",
  emptyMessage = "Δεν βρέθηκαν αποτελέσματα.",
  className
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const [buttonWidth, setButtonWidth] = React.useState<number>(0)

  React.useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth)
    }
  }, [open])

  // Filter options based on normalized search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    
    const normalizedSearch = normalizeString(searchValue);
    
    return options.filter(option => 
      normalizeString(option.searchTerms || option.label).includes(normalizedSearch)
    );
  }, [options, searchValue]);

  const selectedOption = options.find(option => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between rounded-none", className)}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {selectedOption?.avatarUrl !== undefined && (
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={selectedOption?.avatarUrl || undefined} />
                <AvatarFallback className="text-[10px]">
                  {(selectedOption?.label || " ").charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 rounded-none z-50 bg-popover text-popover-foreground"
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
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.searchTerms || option.label}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                    setSearchValue("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.avatarUrl !== undefined && (
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={option.avatarUrl || undefined} />
                      <AvatarFallback>{option.label.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
