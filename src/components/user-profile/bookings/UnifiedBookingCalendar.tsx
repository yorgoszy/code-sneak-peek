import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, addWeeks, format, startOfWeek } from 'date-fns';
import { Ban, Check, ChevronLeft, ChevronRight, Loader2, LockKeyhole, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { canBookGymSection } from '@/hooks/bookingSectionAccess';
import { supabase } from '@/integrations/supabase/client';
import { sectionVisitEvents } from './sectionVisitEvents';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  name: string;
  available_hours: Record<string, string[]>;
  max_capacity: number;
  coach_id?: string | null;
}

interface Props {
  userId: string;
  sections: Section[];
  availability: Parameters<typeof canBookGymSection>[1];
  onCreateBooking: (sectionId: string, date: string, time: string, type: string) => Promise<void>;
  onCancelBooking: (bookingId: string) => Promise<void>;
  getTimeSlotBookings: (sectionId: string, date: string, type?: string) => Promise<Record<string, number>>;
}

// Same compact time/day matrix and stacked section rows as Hyperkids Live Program.
export function UnifiedBookingCalendar({ userId, sections, availability, onCreateBooking, onCancelBooking, getTimeSlotBookings }: Props) {
  const [week, setWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState((new Date().getDay() + 6) % 7);
  const [pending, setPending] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const start = startOfWeek(week, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const from = format(start, 'yyyy-MM-dd');
  const to = format(days[6], 'yyyy-MM-dd');
  const ids = sections.map(s => s.id);
  const names = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const calendar = useQuery({
    queryKey: ['unified-section-calendar', userId, ids, from, to],
    enabled: Boolean(userId && ids.length),
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const bookings = [];
      const visits = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from('booking_sessions').select('*').eq('user_id', userId).in('section_id', ids)
          .gte('booking_date', from).lte('booking_date', to).order('id').range(offset, offset + 999);
        if (error) throw error;
        bookings.push(...(data || []));
        if ((data?.length || 0) < 1000) break;
      }
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from('user_visits').select('*').eq('user_id', userId).in('section_id', ids)
          .gte('visit_date', from).lte('visit_date', to).order('id').range(offset, offset + 999);
        if (error) throw error;
        visits.push(...(data || []));
        if ((data?.length || 0) < 1000) break;
      }
      return sections.flatMap(s => sectionVisitEvents(bookings, visits, userId, s.id));
    },
  });
  const occupancy = useQuery({
    queryKey: ['unified-section-occupancy', ids, from, calendar.data],
    enabled: Boolean(ids.length),
    refetchOnWindowFocus: false,
    queryFn: async () => Object.fromEntries(await Promise.all(sections.flatMap(section => days.map(async day => {
      const date = format(day, 'yyyy-MM-dd');
      if (section.coach_id) {
        const { data, error } = await supabase.rpc('get_coach_booking_slot_counts', { p_section: section.id, p_date: date });
        if (error) throw error;
        return [`${section.id}:${date}`, Object.fromEntries((data || []).map(s => [s.booking_time.slice(0, 5), Number(s.booking_count)]))];
      }
      return [`${section.id}:${date}`, await getTimeSlotBookings(section.id, date, 'gym_visit')];
    })))),
  });
  const closures = useQuery({
    queryKey: ['booking-closed-days', from, to],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.from('closed_days').select('closed_date, reason').gte('closed_date', from).lte('closed_date', to);
      if (error) throw error;
      return data || [];
    },
  });
  const times = [...new Set([
    ...sections.flatMap(s => Object.values(s.available_hours || {}).flat().map(t => t.slice(0, 5))),
    ...(calendar.data || []).map(b => b.booking_time.slice(0, 5)),
  ])].sort();
  const closed = (date: string) => closures.data?.find(c => c.closed_date === date);
  const slotSections = (index: number, time: string) => sections.filter(s =>
    (s.available_hours?.[dayKeys[index]] || []).some(t => t.slice(0, 5) === time) ||
    calendar.data?.some(b => b.section_id === s.id && b.booking_date === format(days[index], 'yyyy-MM-dd') && b.booking_time.slice(0, 5) === time));

  const renderSlot = (section: Section, index: number, time: string) => {
    const date = format(days[index], 'yyyy-MM-dd');
    const key = `${section.id}:${date}:${time}`;
    const booking = calendar.data?.filter(b => b.section_id === section.id && b.booking_date === date && b.booking_time.slice(0, 5) === time)
      .sort((a, b) => Number(b.attended === true) - Number(a.attended === true))[0];
    const count = occupancy.data?.[`${section.id}:${date}`]?.[time] || 0;
    const access = canBookGymSection(section.id, availability);
    const past = new Date(`${date}T${time}`) <= new Date();
    const cancel = booking?.source === 'booking' && booking.attended === undefined && new Date(`${date}T${time}`).getTime() - Date.now() > 12 * 60 * 60 * 1000;
    const disabled = Boolean(pending) || (booking ? !cancel : !access || past || Boolean(closed(date)) || count >= section.max_capacity || calendar.isLoading || calendar.isError || occupancy.isLoading || occupancy.isError || closures.isLoading || closures.isError);
    return (
      <Button key={section.id} variant="ghost" disabled={disabled}
        aria-label={`${section.name} ${date} ${time}${booking ? cancel ? ' — Ακύρωση κράτησης' : ' — Καταγεγραμμένη επίσκεψη' : !access ? ' — Χωρίς πρόσβαση' : ' — Κράτηση'}`}
        title={`${section.name} · ${time}${!access && !booking ? ' · Χωρίς πρόσβαση' : ''}`}
        className={cn('w-full h-auto min-h-0 rounded-none border border-border px-px py-0 flex flex-col items-stretch gap-0 whitespace-normal text-left disabled:opacity-100', !access && !booking ? 'bg-muted/40 text-muted-foreground' : 'bg-muted text-foreground hover:bg-accent')}
        onClick={async () => {
          if (disabled) return;
          setPending(key);
          try {
            if (booking && cancel) await onCancelBooking(booking.id);
            else if (access) await onCreateBooking(section.id, date, time, 'gym_visit');
            await calendar.refetch();
            await occupancy.refetch();
          } finally { setPending(null); }
        }}>
        <span className="flex items-center gap-0.5 text-[7px] leading-[8px] font-medium min-w-0">
          {pending === key ? <Loader2 className="h-2 w-2 shrink-0 animate-spin" /> : booking ? booking.attended === false ? <X className="h-2 w-2 shrink-0" /> : <Check className="h-2 w-2 shrink-0" /> : !access ? <LockKeyhole className="h-2 w-2 shrink-0" /> : null}
          <span className="truncate">{section.name}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <Progress className="h-px flex-1" value={section.max_capacity > 0 ? Math.min(100, count / section.max_capacity * 100) : 0} />
          <span className="text-[7px] leading-[8px] shrink-0 text-muted-foreground">{count}/{section.max_capacity}</span>
        </span>
      </Button>
    );
  };
  return (
    <div className="font-roobert space-y-3" aria-label="Ενιαίο ημερολόγιο τμημάτων">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" className="rounded-none h-8 w-8 p-0" aria-label="Προηγούμενη εβδομάδα" onClick={() => setWeek(addWeeks(week, -1))}><ChevronLeft className="h-4 w-4" /></Button>
        <p className="text-sm">{format(start, 'dd/MM')} - {format(days[6], 'dd/MM/yyyy')}</p>
        <Button variant="outline" size="sm" className="rounded-none h-8 w-8 p-0" aria-label="Επόμενη εβδομάδα" onClick={() => setWeek(addWeeks(week, 1))}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      {(calendar.isError || occupancy.isError || closures.isError) && <p className="text-sm text-destructive">Δεν φορτώθηκαν τα στοιχεία του ημερολογίου.</p>}
      <div className={cn('grid gap-0.5', isMobile ? 'grid-cols-7' : 'grid-cols-8')}>
        {!isMobile && <div />}
        {days.map((day, index) => (
          <Button key={index} variant="outline" onClick={() => setSelectedDay(index)} className={cn('rounded-none h-auto px-0.5 py-0 flex flex-col gap-0 text-muted-foreground', isMobile && selectedDay === index && 'bg-accent text-foreground')}>
            <span className="text-[9px] leading-[11px]">{names[index]}</span><span className="text-[10px] leading-[12px] font-bold">{format(day, 'dd/MM')}</span>
          </Button>
        ))}
      </div>
      <div className="space-y-0.5">
        {times.map(time => isMobile ? (
          <div key={time} className="space-y-0.5">
            {slotSections(selectedDay, time).map(section => <div key={section.id} className="flex items-center gap-2 border border-border bg-muted/30 px-2 py-1"><span className="text-[10px] w-10 shrink-0">{time}</span><div className="flex-1 min-w-0">{renderSlot(section, selectedDay, time)}</div></div>)}
          </div>
        ) : (
          <div key={time} className="grid grid-cols-8 gap-0.5">
            <div className="border border-border flex items-center justify-center px-0.5 py-0 text-[9px] leading-[12px] text-muted-foreground">{time}</div>
            {days.map((day, index) => <div key={index} className="border border-border bg-muted/30 p-px space-y-px min-w-0">
              {closed(format(day, 'yyyy-MM-dd')) && <Ban className="h-2.5 w-2.5 mx-auto text-muted-foreground" aria-label="Κλειστά" />}
              {slotSections(index, time).map(section => renderSlot(section, index, time))}
            </div>)}
          </div>
        ))}
      </div>
    </div>
  );
}