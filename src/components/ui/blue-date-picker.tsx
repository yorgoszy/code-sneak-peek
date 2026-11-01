import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { el } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface BlueDatePickerProps {
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const BlueDatePicker = ({ value, onChange, className }: BlueDatePickerProps) => {
  const [open, setOpen] = React.useState(false);
  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const displayValue = selected && isValid(selected) ? format(selected, "dd/MM/yyyy") : "";
  const [text, setText] = React.useState(displayValue);
  React.useEffect(() => { setText(displayValue); }, [displayValue]);

  // Αυτόματη μορφοποίηση ΗΗ/ΜΜ/ΕΕΕΕ ενώ πληκτρολογεί ο χρήστης
  const maskDateInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
    return parts.join("/");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative w-full", className)}>
        <Input
          value={text}
          placeholder="ΗΗ/ΜΜ/ΕΕΕΕ"
          aria-label="Ημερομηνία"
          inputMode="numeric"
          maxLength={10}
          className="h-8 rounded-none pr-9 text-sm text-[var(--th-blue)] placeholder:text-[var(--th-blue-hover)]"
          onChange={(event) => {
            const next = maskDateInput(event.target.value);
            setText(next);
            const date = parse(next, "dd/MM/yyyy", new Date());
            const valid = /^\d{2}\/\d{2}\/\d{4}$/.test(next) && isValid(date) && format(date, "dd/MM/yyyy") === next;
            event.target.setCustomValidity(next && !valid ? "Γράψτε έγκυρη ημερομηνία ως ΗΗ/ΜΜ/ΕΕΕΕ." : "");
            if (!next) onChange("");
            else if (valid) onChange(format(date, "yyyy-MM-dd"));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.reportValidity();
            }
          }}
          ref={(input) => {
            if (input && text === displayValue) input.setCustomValidity("");
          }}
        />
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label="Άνοιγμα ημερολογίου"
          className="absolute right-0 top-0 h-8 w-8 rounded-none border-0 px-0 text-[var(--th-blue)]"
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0 rounded-none" align="start">
        <div className="text-[var(--th-blue)] [&_button]:text-[var(--th-blue)]">
          <Calendar
            mode="single"
            locale={el}
            selected={selected && isValid(selected) ? selected : undefined}
            onSelect={(date) => {
              if (date) {
                setText(format(date, "dd/MM/yyyy"));
                onChange(format(date, "yyyy-MM-dd"));
              }
              setOpen(false);
            }}
            initialFocus
            className="p-3 pointer-events-auto"
            classNames={{
              day_selected:
                "bg-[var(--th-blue)] !text-primary-foreground hover:bg-[var(--th-blue-hover)] focus:bg-[var(--th-blue)] rounded-none",
              day_today: "bg-[var(--th-blue-tint)] text-[var(--th-blue)] rounded-none",
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
