
import React, { useMemo, useState, useEffect } from 'react';
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
import { Calendar } from 'lucide-react';

interface CalendarSectionProps {
  program: ProgramStructure;
  totalDays: number;
  onTrainingDatesChange: (dates: Date[]) => void;
  isCoach?: boolean;
  /** όταν ολοκληρωθεί η επιλογή ημερών, εμφανίζεται κουμπί ανάθεσης */
  onAssign?: () => void;
  canAssign?: boolean;
  assignLoading?: boolean;
}

const WEEKDAY_OPTIONS = [
  { label: 'Δ', value: 1 },
  { label: 'Τ', value: 2 },
  { label: 'Τ', value: 3 },
  { label: 'Π', value: 4 },
  { label: 'Π', value: 5 },
  { label: 'Σ', value: 6 },
  { label: 'Κ', value: 0 }
];

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  program,
  totalDays,
  onTrainingDatesChange,
  isCoach = false,
  onAssign,
  canAssign = false,
  assignLoading = false
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [weekdays, setWeekdays] = useState<number[]>([]);

  // Auto-calculate weeks based on program structure
  const programWeeksCount = program.weeks?.length || 1;
  const daysPerWeek = program.weeks?.[0]?.program_days?.length || weekdays.length;

  // Compute total days from program structure
  const computedTotalDays = useMemo(() => {
    if (program.weeks && program.weeks.length > 0) {
      return program.weeks.reduce((acc, week) => acc + (week.program_days?.length || 0), 0);
    }
    return totalDays;
  }, [program.weeks, totalDays]);

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

    const start = createDateForDisplay(startDate);
    if (Number.isNaN(start.getTime())) return;

    // Calculate how many weeks we need based on total days and days per week
    const weeksNeeded = Math.ceil(computedTotalDays / weekdays.length);
    const end = new Date(start);
    end.setDate(end.getDate() + weeksNeeded * 7 + 7);

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
    <div className="border rounded-none">
      {/* Compact header with inline controls */}
      <div className="flex flex-wrap items-center gap-3 p-3 border-b bg-gray-50">
        <div className="hidden md:flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">Ημερολόγιο</span>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="pb-start-date" className="text-xs whitespace-nowrap">Έναρξη:</Label>
          <Input
            id="pb-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-none h-7 w-32 text-xs"
          />
        </div>

        <div className="flex items-center gap-1">
          {WEEKDAY_OPTIONS.map((opt, idx) => {
            const active = weekdays.includes(opt.value);
            return (
              <Button
                key={idx}
                type="button"
                variant={active ? 'default' : 'outline'}
                onClick={() => toggleWeekday(opt.value)}
                className={cn('rounded-none h-7 w-7 p-0 text-xs', active && 'bg-[#00ffba] text-black hover:bg-[#00ffba]/90')}
              >
                {opt.label}
              </Button>
            );
          })}
          <Button
            type="button"
            onClick={generateDates}
            disabled={!startDate || weekdays.length === 0}
            size="sm"
            className="rounded-none h-7 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black text-xs md:hidden ml-1"
          >
            Δημιουργία
          </Button>
        </div>

        <Button
          type="button"
          onClick={generateDates}
          disabled={!startDate || weekdays.length === 0}
          size="sm"
          className="rounded-none h-7 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black text-xs hidden md:inline-flex"
        >
          Δημιουργία ({computedTotalDays} ημέρες)
        </Button>
      </div>

      {/* Calendar content */}
      <div className="p-3">
        <div className="flex flex-col lg:flex-row gap-4">
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

          <div className="w-full lg:w-64 space-y-3">
            <WeekProgressDisplay weekProgress={weekProgress} />
            <SelectionProgress
              selectedCount={selectedDatesAsStrings.length}
              totalDays={computedTotalDays}
              onAssign={onAssign}
              canAssign={canAssign}
              loading={assignLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
