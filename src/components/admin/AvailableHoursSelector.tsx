import React from 'react';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AvailableHoursSelectorProps {
  availableHours: Record<string, string[]>;
  onChange: (hours: Record<string, string[]>) => void;
  compact?: boolean;
}

const DAYS = {
  monday: 'Δευτέρα',
  tuesday: 'Τρίτη',
  wednesday: 'Τετάρτη', 
  thursday: 'Πέμπτη',
  friday: 'Παρασκευή',
  saturday: 'Σάββατο',
  sunday: 'Κυριακή'
};

const HOURS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00'
];

export const AvailableHoursSelector: React.FC<AvailableHoursSelectorProps> = ({
  availableHours,
  onChange,
  compact = false
}) => {
  const handleDayToggle = (day: string, hour: string, checked: boolean) => {
    const newHours = { ...availableHours };
    
    if (checked) {
      // Προσθήκη ώρας
      if (!newHours[day]) {
        newHours[day] = [];
      }
      if (!newHours[day].includes(hour)) {
        newHours[day] = [...newHours[day], hour].sort();
      }
    } else {
      // Αφαίρεση ώρας
      if (newHours[day]) {
        newHours[day] = newHours[day].filter(h => h !== hour);
      }
    }
    
    onChange(newHours);
  };

  const handleSelectAllDay = (day: string, selectAll: boolean) => {
    const newHours = { ...availableHours };
    
    if (selectAll) {
      newHours[day] = [...HOURS];
    } else {
      newHours[day] = [];
    }
    
    onChange(newHours);
  };

  const isDayFullySelected = (day: string) => {
    return availableHours[day]?.length === HOURS.length;
  };

  const isDayPartiallySelected = (day: string) => {
    return availableHours[day]?.length > 0 && availableHours[day]?.length < HOURS.length;
  };

  if (compact) return <div className="space-y-1">
    <Label className="text-xs">Ημέρες και ώρες</Label>
    <table className="w-full table-fixed border-collapse text-[10px]">
      <thead>
        <tr>
          <th scope="col" className="w-14 pb-1 text-left font-normal text-muted-foreground"></th>
          {HOURS.map(h => (
            <th key={h} scope="col" className="pb-1 text-center font-normal text-muted-foreground">
              {h.slice(0, 2)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.entries(DAYS).map(([key, label]) => {
          const selectedCount = availableHours[key]?.length || 0;
          return (
            <tr key={key}>
              <th scope="row" className="pr-2 text-left font-normal text-muted-foreground">
                <button
                  type="button"
                  title={`${label} — επιλογή όλων / καμία`}
                  aria-label={`${label} — επιλογή όλων / καμία`}
                  className="flex items-center gap-1 rounded-none text-left hover:text-foreground"
                  onClick={() => handleSelectAllDay(key, selectedCount !== HOURS.length)}
                >
                  <span className="font-medium text-foreground">{label.charAt(0)}</span>
                  {selectedCount > 0 && (
                    <span className="text-muted-foreground">{selectedCount}</span>
                  )}
                </button>
              </th>
              {HOURS.map(hour => {
                const selected = availableHours[key]?.includes(hour) || false;
                return (
                  <td key={hour} className="p-px">
                    <button
                      type="button"
                      aria-label={`${label} ${hour}`}
                      aria-pressed={selected}
                      title={`${label} ${hour}`}
                      className={`h-4 w-full rounded-none border ${selected ? 'border-transparent bg-primary' : 'border-border bg-transparent hover:bg-muted'}`}
                      onClick={() => handleDayToggle(key, hour, !selected)}
                    />
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>;

  return (
    <div className="space-y-4">
      <Label>Διαθέσιμες Ώρες ανά Ημέρα</Label>
      <div className="space-y-4">
        {Object.entries(DAYS).map(([dayKey, dayLabel]) => (
          <Card key={dayKey} className="rounded-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{dayLabel}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${dayKey}-all`}
                    checked={isDayFullySelected(dayKey)}
                    onCheckedChange={(checked) => handleSelectAllDay(dayKey, checked as boolean)}
                    className="rounded-none"
                  />
                  <Label htmlFor={`${dayKey}-all`} className="text-xs text-gray-600">
                    Επιλογή όλων
                  </Label>
                </div>
              </div>
              {isDayPartiallySelected(dayKey) && (
                <p className="text-xs text-blue-600">
                  {availableHours[dayKey]?.length || 0} από {HOURS.length} ώρες επιλεγμένες
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {HOURS.map((hour) => (
                  <div key={hour} className="flex items-center space-x-1">
                    <Checkbox
                      id={`${dayKey}-${hour}`}
                      checked={availableHours[dayKey]?.includes(hour) || false}
                      onCheckedChange={(checked) => handleDayToggle(dayKey, hour, checked as boolean)}
                      className="rounded-none"
                    />
                    <Label
                      htmlFor={`${dayKey}-${hour}`}
                      className="text-xs cursor-pointer hover:text-[#00ffba]"
                    >
                      {hour}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};