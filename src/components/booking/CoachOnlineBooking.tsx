import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarDays, X } from 'lucide-react';
import { useCoachContext } from '@/contexts/CoachContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { BookingSectionsManagement } from '@/components/admin/BookingSectionsManagement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export function CoachOnlineBooking() {
  const { coachId } = useCoachContext();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [sectionId, setSectionId] = useState('all');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const calendar = useQuery({
    queryKey: ['coach-booking-calendar', coachId], enabled: Boolean(coachId),
    queryFn: async () => {
      if (!coachId) throw new Error('Coach missing');
      const { data, error } = await supabase.from('booking_sections').select('*').eq('coach_id', coachId).eq('booking_type', 'gym_visit').order('name');
      if (error) throw error;
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
    if (!coachId) return;
    const channel = supabase.channel(`coach-booking-${coachId}-${Math.random()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'booking_sessions', filter: `coach_id=eq.${coachId}` }, () => void appointments.refetch()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [coachId]);
  async function cancel() {
    if (!cancelId || !coachId) return;
    const { error } = await supabase.from('booking_sessions').update({ status: 'cancelled' }).eq('id', cancelId).eq('coach_id', coachId);
    if (error) toast.error('Δεν ακυρώθηκε το ραντεβού.');
    else { toast.success('Το ραντεβού ακυρώθηκε.'); void appointments.refetch(); }
    setCancelId(null);
  }
  const scopedAppointments = (appointments.data || []).filter(b => sectionId === 'all' || b.section_id === sectionId);
  const selected = scopedAppointments.filter(b => date && b.booking_date === format(date, 'yyyy-MM-dd'));
  return <section className="space-y-4 text-foreground">
    <h2 className="flex items-center gap-2 text-xl font-semibold"><CalendarDays className="h-5 w-5" />Online Booking</h2>
    {(calendar.isError || appointments.isError) && <p role="alert" className="text-destructive">Δεν φορτώθηκε το ημερολόγιο.</p>}
    <Tabs defaultValue="appointments" onValueChange={() => void calendar.refetch()}>
      <TabsList className="rounded-none"><TabsTrigger value="appointments" className="rounded-none">Ραντεβού</TabsTrigger><TabsTrigger value="sections" className="rounded-none">Τμήματα</TabsTrigger></TabsList>
      <TabsContent value="sections" className="space-y-3">
        {coachId && <BookingSectionsManagement key={coachId} coachId={coachId} />}
      </TabsContent>
      <TabsContent value="appointments">
        <Select value={sectionId} onValueChange={setSectionId}><SelectTrigger className="mb-4 max-w-sm rounded-none"><SelectValue placeholder="Τμήμα" /></SelectTrigger><SelectContent><SelectItem value="all">Όλα τα τμήματα</SelectItem>{(calendar.data || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Calendar mode="single" selected={date} onSelect={setDate} className="w-fit rounded-none border border-border" modifiers={{ booked: scopedAppointments.filter(b => ['pending', 'confirmed'].includes(b.status)).map(b => new Date(`${b.booking_date}T00:00:00`)) }} modifiersClassNames={{ booked: 'font-bold underline' }} />
          <div className="min-w-0 space-y-2"><h3 className="text-sm font-semibold">{date && format(date, 'dd/MM/yyyy')}</h3>
            {appointments.isLoading ? <p role="status">Φόρτωση…</p> : selected.length ? selected.map(b => <div key={b.id} className="flex items-center gap-3 border-b border-border py-3">
              <span className="text-sm font-semibold">{b.booking_time.slice(0, 5)}</span>
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{b.user?.name}</p><p className="truncate text-xs text-muted-foreground">{b.user?.email}</p><p className="text-xs text-muted-foreground">{calendar.data?.find(s => s.id === b.section_id)?.name}</p></div>
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