import { Fragment } from 'react';
import { addDays, addWeeks, format, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Database } from '@/integrations/supabase/types';
import type { CoachBookingAppointment } from './coachBookingAppointments';

const letters = ['Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ', 'Κ'];
const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
type Section = Database['public']['Tables']['booking_sections']['Row'];

const hourStart = (time: string) => `${time.slice(0, 2)}:00`;
const activeStatuses = ['pending', 'confirmed', 'completed'];

export function CoachBookingWeek({ date, sections, appointments, onSelect }: {
  date: Date; sections: Section[]; appointments: CoachBookingAppointment[];
  onSelect: (date: Date, sectionId?: string, hour?: string) => void;
}) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const dayDates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const dayIndexByDate = new Map(dayDates.map((day, i) => [format(day, 'yyyy-MM-dd'), i]));

  // Cells: day index + hour -> section ids present at that hour.
  const cellSections = new Map<string, Set<string>>();
  const hourSet = new Set<string>();
  const addCell = (dayIndex: number, hour: string, sectionId: string) => {
    hourSet.add(hour);
    const key = `${dayIndex}-${hour}`;
    const set = cellSections.get(key) ?? new Set<string>();
    set.add(sectionId);
    cellSections.set(key, set);
  };
  sections.forEach(section => {
    if (!section.available_hours || typeof section.available_hours !== 'object' || Array.isArray(section.available_hours)) return;
    Object.entries(section.available_hours as Record<string, unknown>).forEach(([day, hours]) => {
      const dayIndex = keys.indexOf(day);
      if (dayIndex < 0 || !Array.isArray(hours)) return;
      hours.filter((h): h is string => typeof h === 'string').forEach(h => addCell(dayIndex, hourStart(h), section.id));
    });
  });
  // Bookings keep their section visible even outside configured hours.
  const counts = new Map<string, number>();
  appointments.filter(b => activeStatuses.includes(b.status) && dayIndexByDate.has(b.booking_date)).forEach(b => {
    const dayIndex = dayIndexByDate.get(b.booking_date)!;
    const hour = hourStart(b.booking_time);
    addCell(dayIndex, hour, b.section_id);
    const key = `${dayIndex}-${hour}-${b.section_id}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const sortedHours = [...hourSet].sort();
  const first = sortedHours[0] ?? '08:00';
  const last = sortedHours[sortedHours.length - 1] ?? '21:00';
  const hours: string[] = [];
  for (let h = parseInt(first.slice(0, 2)); h <= parseInt(last.slice(0, 2)); h++) hours.push(`${String(h).padStart(2, '0')}:00`);

  const selectedDateStr = format(date, 'yyyy-MM-dd');
  const names = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];

  const isMobile = useIsMobile();
  const selectedDayIndex = dayIndexByDate.get(selectedDateStr) ?? 0;

  return <div className="min-w-0 space-y-3" aria-label="Εβδομαδιαίο ημερολόγιο τμημάτων">
    <div className="flex items-center justify-between gap-2">
      <Button variant="outline" size="icon" className="h-8 w-8 rounded-none" aria-label="Προηγούμενη εβδομάδα" onClick={() => onSelect(addWeeks(date, -1))}><ChevronLeft className="h-4 w-4" /></Button>
      <span className="text-sm">{format(start, 'dd/MM')} – {format(addDays(start, 6), 'dd/MM/yyyy')}</span>
      <Button variant="outline" size="icon" className="h-8 w-8 rounded-none" aria-label="Επόμενη εβδομάδα" onClick={() => onSelect(addWeeks(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
    </div>
    {isMobile ? (
      <div className="space-y-3">
        <div className="grid grid-cols-7 gap-0.5">
          {dayDates.map((day, index) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            return <Button key={index} variant="outline" aria-label={`${names[index]} ${format(day, 'dd/MM')}`} onClick={() => onSelect(day)}
              className={`rounded-none h-auto px-0.5 py-0 flex flex-col gap-0 text-muted-foreground ${dayStr === selectedDateStr ? 'bg-accent text-foreground' : ''}`}>
              <span className="text-[9px] leading-[11px]">{names[index]}</span>
              <span className="text-[10px] leading-[12px] font-bold">{format(day, 'dd/MM')}</span>
            </Button>;
          })}
        </div>
        <div className="space-y-0.5">
          {hours.map(hour => {
            const ids = cellSections.get(`${selectedDayIndex}-${hour}`);
            if (!ids) return null;
            return (
              <div key={hour} className="space-y-0.5">
                {Array.from(ids).map(id => {
                  const section = sections.find(s => s.id === id);
                  if (!section) return null;
                  const count = counts.get(`${selectedDayIndex}-${hour}-${id}`) ?? 0;
                  return (
                    <div key={id} className="flex items-center gap-2 border border-border bg-muted/30 px-2 py-1">
                      <span className="text-[10px] w-10 shrink-0">{hour}</span>
                      <div className="flex-1 min-w-0">
                        <Button variant="ghost" title={`${section.name} · ${hour}`} onClick={() => onSelect(dayDates[selectedDayIndex], id, hour)}
                          className="w-full h-auto min-h-0 rounded-none border border-border px-px py-0 flex flex-col items-stretch gap-0 whitespace-normal text-left bg-muted text-foreground hover:bg-accent">
                          <span className="flex min-w-0 items-center gap-0.5 text-sm font-medium leading-5"><span className="truncate">{section.name}</span></span>
                          <span className="flex items-center gap-0.5">
                            <Progress className="h-px flex-1" value={section.max_capacity > 0 ? Math.min(100, count / section.max_capacity * 100) : 0} />
                            <span className="shrink-0 text-xs leading-4 text-muted-foreground">{count}/{section.max_capacity}</span>
                          </span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    ) : (
    <div className="w-full min-w-0">
      <div className="w-full min-w-0 rounded-none border border-border" style={{ display: 'grid', gridTemplateColumns: '26px repeat(7, minmax(0, 1fr))' }}>
        <div className="border-b border-border bg-muted/40" />
        {dayDates.map((day, index) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          return <Button key={index} variant="ghost" aria-label={`${letters[index]} ${format(day, 'dd/MM')}`} onClick={() => onSelect(day)} className={`h-auto rounded-none px-0 py-1 ${dayStr === selectedDateStr ? 'bg-accent text-accent-foreground' : ''}`}>
            <span className="text-[11px] font-semibold leading-3">{letters[index]}</span>
            <span className="text-[8px] leading-3 text-muted-foreground">{format(day, 'dd/MM')}</span>
          </Button>;
        })}
        {hours.map(hour => <Fragment key={hour}>
          <div className="flex items-start justify-center border-b border-border bg-muted/40 py-1 text-[8px] font-medium text-muted-foreground">{hour.slice(0, 2)}</div>
          {dayDates.map((day, index) => {
            const key = `${index}-${hour}`;
            const ids = cellSections.get(key);
            return <div key={`c-${index}-${hour}`} className="flex flex-col min-h-8 min-w-0 border-b border-l border-border p-px">
              {ids && Array.from(ids).map(id => {
                const section = sections.find(s => s.id === id);
                if (!section) return null;
                const count = counts.get(`${index}-${hour}-${id}`) ?? 0;
                return <Button key={id} variant="outline" title={`${section.name}${count ? ` · ${count} άτομα` : ''}`} onClick={() => onSelect(day, id, hour)} className="mb-px flex flex-1 flex-col h-auto justify-center w-full min-w-0 overflow-hidden rounded-none px-px py-0 text-left">
                  <span className="block truncate text-[8px] font-semibold leading-3">{section.name}</span>
                  <span className="block text-[7px] leading-3 text-muted-foreground">{count} άτομα</span>
                </Button>;
              })}
            </div>;
          })}
        </Fragment>)}
      </div>
    </div>
    )}
  </div>;
}
