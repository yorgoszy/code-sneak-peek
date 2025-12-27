
import React, { useMemo, useState } from 'react';
import type { ProgramStructure } from './hooks/useProgramBuilderState';
import { CalendarDisplay } from './calendar/CalendarDisplay';
import { SelectionProgress } from './calendar/SelectionProgress';
import { WeekProgressDisplay } from './calendar/WeekProgressDisplay';
import { useCalendarLogic } from './calendar/hooks/useCalendarLogic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { createDateForDisplay } from '@/utils/dateUtils';

interface CalendarSectionProps {
  program: ProgramStructure;
  totalDays: number; // fallback (π.χ. από τη δομή εβδομάδων)
  onTrainingDatesChange: (dates: Date[]) => void;
}

const WEEKDAY_OPTIONS = [
  { label: 'Δευ', value: 1 },
  { label: 'Τρι', value: 2 },
  { label: 'Τετ', value: 3 },
  { label: 'Πεμ', value: 4 },
  { label: 'Παρ', value: 5 },
  { label: 'Σαβ', value: 6 },
  { label: 'Κυρ', value: 0 }
];

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  program,
  totalDays,
  onTrainingDatesChange
}) => {
  // "Έξυπνη" ανάθεση: διάλεξε ημέρες εβδομάδας + εβδομάδες και γέμισε αυτόματα ημερομηνίες.
  const [startDate, setStartDate] = useState<string>('');
  const [durationWeeks, setDurationWeeks] = useState<number>(4);
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5]); // default: Δευ/Τετ/Παρ

  const computedTotalDays = useMemo(() => {
    const smartTotal = durationWeeks * weekdays.length;
    return smartTotal > 0 ? smartTotal : totalDays;
  }, [durationWeeks, weekdays.length, totalDays]);

  const {
    selectedDatesAsStrings,
    currentWeekInfo,
    weekProgress,
    handleDateSelect,
    handleClearAllDates,
    isDateSelected,
    isDateDisabled,
    getDayInfoForDate
  } = useCalendarLogic(program, computedTotalDays, onTrainingDatesChange);

  if (totalDays === 0) {
    return null;
  }

  const toggleWeekday = (day: number) => {
    setWeekdays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()));
  };

  const generateDates = () => {
    if (!startDate) return;
    if (weekdays.length === 0) return;

    // ΣΗΜΑΝΤΙΚΟ: Δημιουργούμε ημερομηνίες στο "μεσημέρι" (12:00) για να αποφύγουμε timezone/DST shift.
    const start = createDateForDisplay(startDate);
    if (Number.isNaN(start.getTime())) return;

    const end = new Date(start);
    end.setDate(end.getDate() + durationWeeks * 7 - 1);

    const result: Date[] = [];
    const cursor = new Date(start);

    while (cursor <= end && result.length < computedTotalDays) {
      if (weekdays.includes(cursor.getDay())) {
        result.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    onTrainingDatesChange(result);
  };

  return (
    <div className="w-full">
      <div className="space-y-3">
        <div className="border rounded-none p-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="pb-start-date">Έναρξη</Label>
              <Input
                id="pb-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-none"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pb-duration-weeks">Διάρκεια (εβδομάδες)</Label>
              <Input
                id="pb-duration-weeks"
                type="number"
                min={1}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(Math.max(1, Number(e.target.value || 1)))}
                className="rounded-none"
              />
            </div>

            <div className="space-y-1">
              <Label>Ημέρες προπόνησης</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_OPTIONS.map(opt => {
                  const active = weekdays.includes(opt.value);
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      onClick={() => toggleWeekday(opt.value)}
                      className={cn('rounded-none h-8 px-2 text-xs', active && 'bg-[#00ffba] text-black hover:bg-[#00ffba]/90')}
                    >
                      {opt.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              Θα δημιουργηθούν <strong>{computedTotalDays}</strong> ημερομηνίες ({durationWeeks} εβδομάδες × {weekdays.length} ημέρες/εβδομάδα)
            </div>
            <Button
              type="button"
              onClick={generateDates}
              disabled={!startDate || weekdays.length === 0}
              className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              Αυτόματη δημιουργία
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="flex-1 min-w-0">
            <CalendarDisplay
              selectedDatesAsStrings={selectedDatesAsStrings}
              totalDays={computedTotalDays}
              currentWeekInfo={currentWeekInfo}
              onDateSelect={handleDateSelect}
              onClearAllDates={handleClearAllDates}
              isDateSelected={isDateSelected}
              isDateDisabled={isDateDisabled}
              getDayInfoForDate={getDayInfoForDate}
            />
          </div>

          <div className="w-full lg:w-80 space-y-3 md:space-y-4">
            <WeekProgressDisplay weekProgress={weekProgress} />
            <SelectionProgress selectedCount={selectedDatesAsStrings.length} totalDays={computedTotalDays} />
          </div>
        </div>
      </div>
    </div>
  );
};

