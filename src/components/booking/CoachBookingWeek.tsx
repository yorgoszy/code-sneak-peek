import { addDays, addWeeks, format, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';
import type { CoachBookingAppointment } from './coachBookingAppointments';

const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];
const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
type Section = Database['public']['Tables']['booking_sections']['Row'];

export function CoachBookingWeek({ date, sections, appointments, onSelect }: {
  date: Date; sections: Section[]; appointments: CoachBookingAppointment[];
  onSelect: (date: Date, sectionId?: string) => void;
}) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return <div className="min-w-0 space-y-3" aria-label="Εβδομαδιαίο ημερολόγιο τμημάτων">
    <div className="flex items-center justify-between gap-2">
      <Button variant="outline" size="icon" className="h-8 w-8 rounded-none" aria-label="Προηγούμενη εβδομάδα" onClick={() => onSelect(addWeeks(date, -1))}><ChevronLeft className="h-4 w-4" /></Button>
      <span className="text-sm">{format(start, 'dd/MM')} – {format(addDays(start, 6), 'dd/MM/yyyy')}</span>
      <Button variant="outline" size="icon" className="h-8 w-8 rounded-none" aria-label="Επόμενη εβδομάδα" onClick={() => onSelect(addWeeks(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
    </div>
    <div className="grid grid-cols-7 gap-0.5">
      {days.map((name, index) => {
        const day = addDays(start, index);
        const dayDate = format(day, 'yyyy-MM-dd');
        return <div key={name} className="min-w-0 space-y-1">
          <Button variant="outline" aria-label={`${name} ${format(day, 'dd/MM')}`} onClick={() => onSelect(day)} className={`h-auto w-full flex-col gap-0 rounded-none px-0 py-1 ${dayDate === format(date, 'yyyy-MM-dd') ? 'bg-accent text-accent-foreground' : ''}`}>
            <span className="text-xs font-semibold">{name.charAt(0)}</span><span className="text-[10px]">{format(day, 'dd/MM')}</span>
          </Button>
          {sections.map(section => {
            const hours = section.available_hours && typeof section.available_hours === 'object' && !Array.isArray(section.available_hours) ? section.available_hours[keys[index]] : null;
            const bookings = appointments.filter(b => b.section_id === section.id && b.booking_date === dayDate);
            const times = [...new Set([...(Array.isArray(hours) ? hours.filter((h): h is string => typeof h === 'string').map(h => h.slice(0, 5)) : []), ...bookings.map(b => b.booking_time.slice(0, 5))])].sort();
            if (!times.length) return null;
            return <Button key={section.id} variant="outline" title={section.name} onClick={() => onSelect(day, section.id)} className="h-auto w-full min-w-0 flex-col items-start gap-1 whitespace-normal rounded-none px-0.5 py-1 text-left">
              <span className="w-full break-words text-[9px] font-semibold leading-3">{section.name}</span>
              <span className="w-full text-[9px] leading-3 text-muted-foreground">{times.map(time => <span key={time} className="block">{time}</span>)}</span>
              <span className="text-[9px] text-muted-foreground">{bookings.filter(b => ['pending', 'confirmed', 'completed'].includes(b.status)).length} άτομα</span>
            </Button>;
          })}
        </div>;
      })}
    </div>
  </div>;
}