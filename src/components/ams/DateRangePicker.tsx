import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

interface Props {
  value: DateRange;
  onChange: (r: DateRange) => void;
}

const presets = [
  { label: "Last 7d", days: 7 },
  { label: "Last 28d", days: 28 },
  { label: "Last 90d", days: 90 },
  { label: "Season", days: 365 },
];

export const DateRangePicker: React.FC<Props> = ({ value, onChange }) => {
  const apply = (days: number) => onChange({ from: subDays(new Date(), days), to: new Date() });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="rounded-none">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(value.from, "dd MMM")} – {format(value.to, "dd MMM yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-none" align="start">
        <div className="flex">
          <div className="flex flex-col p-2 border-r border-border gap-1">
            {presets.map((p) => (
              <Button key={p.label} variant="ghost" size="sm" className="rounded-none justify-start" onClick={() => apply(p.days)}>
                {p.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={{ from: value.from, to: value.to }}
            onSelect={(r) => r?.from && r?.to && onChange({ from: r.from, to: r.to })}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
