import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Video, Save } from 'lucide-react';
import { useCoachContext } from '@/contexts/CoachContext';
import { useVideocallBookings } from '@/hooks/useVideocallBookings';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VideocallBookingCard } from './VideocallBookingCard';
import { toast } from 'sonner';

const days = [['monday', 'Δευτέρα'], ['tuesday', 'Τρίτη'], ['wednesday', 'Τετάρτη'], ['thursday', 'Πέμπτη'], ['friday', 'Παρασκευή'], ['saturday', 'Σάββατο'], ['sunday', 'Κυριακή']];

export const CoachOnlineCoaching = () => {
  const { coachId } = useCoachContext();
  const { bookings, loading, fetchBookings } = useVideocallBookings(true, coachId);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [hours, setHours] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { data: calendar, isError, refetch } = useQuery({
    queryKey: ['coach-videocall-calendar', coachId],
    enabled: Boolean(coachId),
    queryFn: async () => {
      if (!coachId) throw new Error('Coach missing');
      const { data: id, error } = await supabase.rpc('ensure_coaching_calendar', { p_coach: coachId });
      if (error) throw error;
      const { data, error: readError } = await supabase.from('booking_sections').select('*').eq('id', id).single();
      if (readError) throw readError;
      return data;
    },
  });
  useEffect(() => {
    if (!calendar) return;
    const stored = calendar.available_hours as Record<string, string[]>;
    setHours(Object.fromEntries(days.map(([key]) => [key, (stored?.[key] || []).join(', ')])));
  }, [calendar]);
  useEffect(() => {
    if (!coachId) return;
    const channel = supabase.channel(`coach-calls-${coachId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_sessions', filter: `coach_id=eq.${coachId}` }, () => void fetchBookings()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [coachId]);
  const saveHours = async () => {
    if (!calendar || !coachId) return;
    const parsed = Object.fromEntries(days.map(([key]) => [key, [...new Set((hours[key] || '').split(',').map(value => value.trim()).filter(Boolean))].sort()]));
    if (Object.values(parsed).some(values => values.some(value => !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)))) {
      toast.error('Οι ώρες πρέπει να είναι στη μορφή 09:00, 10:00.'); return;
    }
    setSaving(true);
    const { error } = await supabase.from('booking_sections').update({ available_hours: parsed }).eq('id', calendar.id).eq('coach_id', coachId);
    setSaving(false);
    if (error) toast.error('Δεν αποθηκεύτηκαν οι ώρες.');
    else { toast.success('Οι ώρες αποθηκεύτηκαν.'); void refetch(); }
  };
  const now = new Date();
  const pending = bookings.filter(b => b.status === 'pending');
  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(`${b.booking_date}T${b.booking_time}`) >= now);
  const history = bookings.filter(b => !['pending', 'confirmed'].includes(b.status) || (b.status === 'confirmed' && new Date(`${b.booking_date}T${b.booking_time}`) < now));
  const selected = date ? bookings.filter(b => b.booking_date === format(date, 'yyyy-MM-dd')) : [];
  return <section className="space-y-5 text-foreground">
    <h2 className="flex items-center gap-2 text-xl font-semibold"><Video className="h-5 w-5" />Online Coaching</h2>
    {isError && <p role="alert" className="text-destructive">Δεν φορτώθηκε το ημερολόγιο.</p>}
    <Tabs defaultValue="appointments">
      <TabsList className="rounded-none"><TabsTrigger value="appointments" className="rounded-none">Ραντεβού</TabsTrigger><TabsTrigger value="hours" className="rounded-none">Διαθέσιμες ώρες</TabsTrigger></TabsList>
      <TabsContent value="hours" className="space-y-4">
        <div className="grid max-w-2xl gap-3 sm:grid-cols-2">{days.map(([key, label]) => <div key={key} className="space-y-1"><Label htmlFor={`hours-${key}`}>{label}</Label><Input id={`hours-${key}`} value={hours[key] || ''} onChange={e => setHours(previous => ({ ...previous, [key]: e.target.value }))} placeholder="09:00, 10:00" className="rounded-none" /></div>)}</div>
        <Button onClick={saveHours} disabled={!calendar || saving} className="rounded-none"><Save className="mr-2 h-4 w-4" />Αποθήκευση</Button>
      </TabsContent>
      <TabsContent value="appointments" className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <Calendar mode="single" selected={date} onSelect={setDate} className="w-fit rounded-none border border-border" modifiers={{ booked: bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).map(b => new Date(`${b.booking_date}T00:00:00`)) }} modifiersClassNames={{ booked: 'font-bold underline' }} />
          <div className="min-w-0 space-y-2"><h3 className="text-sm font-semibold">{date ? format(date, 'dd/MM/yyyy') : 'Ραντεβού'}</h3>{loading ? <p role="status">Φόρτωση…</p> : selected.length ? selected.map(b => <VideocallBookingCard key={b.id} booking={b} isAdmin onRefresh={fetchBookings} />) : <p className="text-sm text-muted-foreground">Δεν υπάρχουν ραντεβού.</p>}</div>
        </div>
        <Tabs defaultValue="pending">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-none"><TabsTrigger value="pending" className="rounded-none text-xs">Εκκρεμείς ({pending.length})</TabsTrigger><TabsTrigger value="upcoming" className="rounded-none text-xs">Επερχόμενες ({upcoming.length})</TabsTrigger><TabsTrigger value="history" className="rounded-none text-xs">Ιστορικό ({history.length})</TabsTrigger></TabsList>
          {[['pending', pending], ['upcoming', upcoming], ['history', history]].map(([key, items]) => <TabsContent key={key as string} value={key as string} className="space-y-2">{(items as typeof bookings).map(b => <VideocallBookingCard key={b.id} booking={b} isAdmin isHistoryView={key === 'history'} onRefresh={fetchBookings} />)}</TabsContent>)}
        </Tabs>
      </TabsContent>
    </Tabs>
  </section>;
};