import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarDays, Save, X } from 'lucide-react';
import { useCoachContext } from '@/contexts/CoachContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const days = [['monday', 'Δευτέρα'], ['tuesday', 'Τρίτη'], ['wednesday', 'Τετάρτη'], ['thursday', 'Πέμπτη'], ['friday', 'Παρασκευή'], ['saturday', 'Σάββατο'], ['sunday', 'Κυριακή']];

export function CoachOnlineBooking() {
  const { coachId } = useCoachContext();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [hours, setHours] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const calendar = useQuery({
    queryKey: ['coach-booking-calendar', coachId], enabled: Boolean(coachId),
    queryFn: async () => {
      if (!coachId) throw new Error('Coach missing');
      const { data: id, error } = await supabase.rpc('ensure_coach_booking_calendar', { p_coach: coachId });
      if (error) throw error;
      const { data, error: readError } = await supabase.from('booking_sections').select('*').eq('id', id).single();
      if (readError) throw readError;
      return data;
    },
  });
  const appointments = useQuery({
    queryKey: ['coach-booking-appointments', coachId], enabled: Boolean(coachId),
    queryFn: async () => {
      if (!coachId) return [];
      const rows = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from('booking_sessions').select('*, user:app_users!user_id(id,name,email,avatar_url)')
          .eq('coach_id', coachId).eq('booking_type', 'gym_visit').order('booking_date').order('booking_time').order('id').range(offset, offset + 999);
        if (error) throw error;
        rows.push(...(data || []));
        if ((data?.length || 0) < 1000) break;
      }
      return rows;
    },
  });
  useEffect(() => {
    const stored = calendar.data?.available_hours as Record<string, string[]> | undefined;
    if (stored) setHours(Object.fromEntries(days.map(([key]) => [key, (stored[key] || []).join(', ')])));
  }, [calendar.data]);
  useEffect(() => {
    if (!coachId) return;
    const channel = supabase.channel(`coach-booking-${coachId}-${Math.random()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'booking_sessions', filter: `coach_id=eq.${coachId}` }, () => void appointments.refetch()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [coachId]);
  async function saveHours() {
    if (!calendar.data || !coachId) return;
    const parsed = Object.fromEntries(days.map(([key]) => [key, [...new Set((hours[key] || '').split(',').map(s => s.trim()).filter(Boolean))].sort()]));
    if (Object.values(parsed).some(values => values.some(value => !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)))) { toast.error('Μη έγκυρη ώρα.'); return; }
    setSaving(true);
    const { error } = await supabase.from('booking_sections').update({ available_hours: parsed }).eq('id', calendar.data.id).eq('coach_id', coachId);
    setSaving(false);
    if (error) toast.error('Δεν αποθηκεύτηκαν οι ώρες.');
    else { toast.success('Οι ώρες αποθηκεύτηκαν.'); void calendar.refetch(); }
  }
  async function cancel() {
    if (!cancelId || !coachId) return;
    const { error } = await supabase.from('booking_sessions').update({ status: 'cancelled' }).eq('id', cancelId).eq('coach_id', coachId);
    if (error) toast.error('Δεν ακυρώθηκε το ραντεβού.');
    else { toast.success('Το ραντεβού ακυρώθηκε.'); void appointments.refetch(); }
    setCancelId(null);
  }
  const selected = (appointments.data || []).filter(b => date && b.booking_date === format(date, 'yyyy-MM-dd'));
  return <section className="space-y-4 text-foreground">
    <h2 className="flex items-center gap-2 text-xl font-semibold"><CalendarDays className="h-5 w-5" />Online Booking</h2>
    {(calendar.isError || appointments.isError) && <p role="alert" className="text-destructive">Δεν φορτώθηκε το ημερολόγιο.</p>}
    <Tabs defaultValue="appointments">
      <TabsList className="rounded-none"><TabsTrigger value="appointments" className="rounded-none">Ραντεβού</TabsTrigger><TabsTrigger value="hours" className="rounded-none">Διαθέσιμες ώρες</TabsTrigger></TabsList>
      <TabsContent value="hours" className="space-y-3">
        <div className="grid max-w-2xl gap-3 sm:grid-cols-2">{days.map(([key, label]) => <div key={key}><Label htmlFor={`hours-${key}`}>{label}</Label><Input id={`hours-${key}`} value={hours[key] || ''} onChange={e => setHours(p => ({ ...p, [key]: e.target.value }))} placeholder="09:00, 10:00" className="rounded-none" /></div>)}</div>
        <Button onClick={saveHours} disabled={!calendar.data || saving} className="rounded-none"><Save className="mr-2 h-4 w-4" />Αποθήκευση</Button>
      </TabsContent>
      <TabsContent value="appointments">
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Calendar mode="single" selected={date} onSelect={setDate} className="w-fit rounded-none border border-border" modifiers={{ booked: (appointments.data || []).filter(b => ['pending', 'confirmed'].includes(b.status)).map(b => new Date(`${b.booking_date}T00:00:00`)) }} modifiersClassNames={{ booked: 'font-bold underline' }} />
          <div className="min-w-0 space-y-2"><h3 className="text-sm font-semibold">{date && format(date, 'dd/MM/yyyy')}</h3>
            {appointments.isLoading ? <p role="status">Φόρτωση…</p> : selected.length ? selected.map(b => <div key={b.id} className="flex items-center gap-3 border-b border-border py-3">
              <span className="text-sm font-semibold">{b.booking_time.slice(0, 5)}</span>
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{b.user?.name}</p><p className="truncate text-xs text-muted-foreground">{b.user?.email}</p></div>
              <span className="text-xs text-muted-foreground">{b.status === 'cancelled' ? 'Ακυρωμένο' : b.status === 'completed' ? 'Ολοκληρωμένο' : 'Κράτηση'}</span>
              {['confirmed', 'pending'].includes(b.status) && <Button variant="ghost" size="icon" title="Ακύρωση ραντεβού" className="rounded-none" onClick={() => setCancelId(b.id)}><X className="h-4 w-4" /></Button>}
            </div>) : <p className="text-sm text-muted-foreground">Δεν υπάρχουν ραντεβού.</p>}
          </div>
        </div>
      </TabsContent>
    </Tabs>
    <AlertDialog open={Boolean(cancelId)} onOpenChange={open => { if (!open) setCancelId(null); }}><AlertDialogContent className="rounded-none"><AlertDialogHeader><AlertDialogTitle>Ακύρωση ραντεβού;</AlertDialogTitle><AlertDialogDescription>Το ραντεβού θα ακυρωθεί.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-none">Επιστροφή</AlertDialogCancel><AlertDialogAction className="rounded-none" onClick={cancel}>Ακύρωση ραντεβού</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}