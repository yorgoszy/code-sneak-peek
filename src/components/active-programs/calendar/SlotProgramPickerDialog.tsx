import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from 'date-fns';
import { el } from 'date-fns/locale';
import type { EnrichedAssignment } from '@/hooks/useActivePrograms/types';

interface SlotProgramPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activePrograms: EnrichedAssignment[];
  workoutCompletions: any[];
  onSelect: (assignment: EnrichedAssignment, date: Date) => void;
}

const normalize = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const WEEK_DAYS = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'];

export const SlotProgramPickerDialog: React.FC<SlotProgramPickerDialogProps> = ({
  isOpen,
  onClose,
  activePrograms,
  workoutCompletions,
  onSelect,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [search, setSearch] = useState('');

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, Array<{ assignment: EnrichedAssignment; name: string }>>();
    const q = normalize(search);
    activePrograms.forEach(assignment => {
      const name = assignment.app_users?.name || 'Χρήστης';
      const email = (assignment.app_users as any)?.email || '';
      if (q && !normalize(name).includes(q) && !normalize(email).includes(q)) return;
      (assignment.training_dates || []).forEach(date => {
        const list = map.get(date) || [];
        list.push({ assignment, name });
        map.set(date, list);
      });
    });
    return map;
  }, [activePrograms, search]);

  const statusFor = (assignmentId: string, dateStr: string) =>
    workoutCompletions.find(c => c.assignment_id === assignmentId && c.scheduled_date === dateStr)
      ?.status || 'scheduled';

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>Επιλογή προγράμματος</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Αναζήτηση χρήστη..."
              className="pl-8 rounded-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-none"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[140px] text-center">
              {format(currentMonth, 'LLLL yyyy', { locale: el })}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px mb-px">
          {WEEK_DAYS.map(d => (
            <div key={d} className="text-xs font-medium text-center py-1 text-gray-500">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px border border-gray-200 bg-gray-200">
          {days.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const entries = entriesByDate.get(dateStr) || [];
            return (
              <div
                key={dateStr}
                className={`min-h-[90px] bg-white p-1 ${
                  isSameMonth(date, currentMonth) ? '' : 'opacity-40'
                }`}
              >
                <div
                  className={`text-xs mb-1 ${
                    isToday(date) ? 'font-bold text-black underline' : 'text-gray-500'
                  }`}
                >
                  {format(date, 'd')}
                </div>
                <div className="space-y-1">
                  {entries.map(({ assignment, name }) => {
                    const status = statusFor(assignment.id, dateStr);
                    return (
                      <button
                        key={`${assignment.id}-${dateStr}`}
                        onClick={() => {
                          onSelect(assignment, date);
                          onClose();
                        }}
                        className={`w-full text-left text-[11px] px-1 py-0.5 border truncate transition-colors ${
                          status === 'completed'
                            ? 'border-[#00ffba] bg-[#00ffba]/20'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                        title={name}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
