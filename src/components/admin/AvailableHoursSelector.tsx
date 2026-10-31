import React from 'react';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';

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

  if (compact) return <div className="space-y-3">
    <Label>Ημέρες και ώρες</Label>
    <table className="w-full table-fixed border-collapse text-xs">
      <thead>
        <tr>
          <th scope="col" className="w-12 pb-2 text-left font-normal text-muted-foreground">Ώρα</th>
          {Object.entries(DAYS).map(([key, label]) => (
            <th key={key} scope="col" title={label} className="pb-2 text-center font-medium">
              <span aria-label={label}>{label.charAt(0)}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {HOURS.map(hour => (
          <tr key={hour}>
            <th scope="row" className="pr-2 text-left font-normal text-muted-foreground">{hour}</th>
            {Object.entries(DAYS).map(([key, label]) => {
              const selected = availableHours[key]?.includes(hour) || false;
              return (
                <td key={key} className="p-0.5">
                  <Button
                    type="button"
                    variant={selected ? 'default' : 'outline'}
                    aria-label={`${label} ${hour}`}
                    aria-pressed={selected}
                    title={`${label} ${hour}`}
                    className="h-auto min-h-8 w-full aspect-square rounded-none p-0"
                    onClick={() => handleDayToggle(key, hour, !selected)}
                  />
                </td>
              );
            })}
          </tr>
        ))}
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