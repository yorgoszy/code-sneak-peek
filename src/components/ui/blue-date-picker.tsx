import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { el } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface BlueDatePickerProps {
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const BlueDatePicker = ({ value, onChange, placeholder = "Επιλέξτε ημερομηνία", className }: BlueDatePickerProps) => {
  const [open, setOpen] = React.useState(false);
  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal rounded-none h-8 text-sm text-[#004aad]",
            !value && "text-[#004aad]/70",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#004aad]" />
          {value && selected && isValid(selected) ? format(selected, "dd/MM/yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-none" align="start">
        <div className="text-[#004aad] [&_button]:text-[#004aad] [&_.rdp-day_selected]:bg-[#004aad] [&_.rdp-day_selected]:text-white">
          <Calendar
            mode="single"
            locale={el}
            selected={selected && isValid(selected) ? selected : undefined}
            onSelect={(date) => {
              if (date) onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
