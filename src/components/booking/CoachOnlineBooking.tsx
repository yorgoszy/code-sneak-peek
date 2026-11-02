import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarDays, X } from 'lucide-react';
import { useCoachContext } from '@/contexts/CoachContext';
import { supabase } from '@/integrations/supabase/client';
import { CoachBookingWeek } from './CoachBookingWeek';
import { Button } from '@/components/ui/button';
import { BookingSectionsManagement } from '@/components/admin/BookingSectionsManagement';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { loadCoachBookingAppointments } from './coachBookingAppointments';

export function CoachOnlineBooking() {
  const { coachId } = useCoachContext();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ date: Date; sectionId: string; hour: string } | null>(null);
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
      return loadCoachBookingAppointments(coachId, supabase);
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
  const allAppointments = appointments.data || [];
  const selected = allAppointments.filter(b => date && b.booking_date === format(date, 'yyyy-MM-dd'));
  const popupSection = popup ? calendar.data?.find(s => s.id === popup.sectionId) : undefined;
  const popupBookings = popup ? (appointments.data || []).filter(b =>
    b.section_id === popup.sectionId &&
    b.booking_date === format(popup.date, 'yyyy-MM-dd') &&
    b.booking_time.slice(0, 2) === popup.hour.slice(0, 2)
  ) : [];
  return <section className="mx-auto w-full max-w-6xl space-y-4 px-2 text-foreground lg:px-6">
    <h2 className="flex items-center gap-2 text-xl font-semibold"><CalendarDays className="h-5 w-5" />Online Booking</h2>
    {(calendar.isError || appointments.isError) && <p role="alert" className="text-destructive">Δεν φορτώθηκε το ημερολόγιο.</p>}
    <Tabs defaultValue="appointments" onValueChange={() => void calendar.refetch()}>
      <TabsList className="rounded-none"><TabsTrigger value="appointments" className="rounded-none">Ραντεβού</TabsTrigger><TabsTrigger value="sections" className="rounded-none">Τμήματα</TabsTrigger></TabsList>
      <TabsContent value="sections" className="space-y-3">
        {coachId && <BookingSectionsManagement key={coachId} coachId={coachId} />}
      </TabsContent>
      <TabsContent value="appointments">
        <div className="space-y-4">
          <CoachBookingWeek date={date ?? new Date()} sections={calendar.data ?? []} appointments={allAppointments} onSelect={(day, section, hour) => { setDate(day); if (section && hour) setPopup({ date: day, sectionId: section, hour }); }} />
          <div className="min-w-0 space-y-2"><h3 className="text-sm font-semibold">{date && format(date, 'dd/MM/yyyy')}</h3>
            {appointments.isLoading ? <p role="status">Φόρτωση…</p> : (() => {
              // Group the day's bookings by section; each group sorted soonest first.
              const groups = (calendar.data ?? []).map(s => ({
                section: s,
                bookings: selected.filter(b => b.section_id === s.id && b.status !== 'cancelled')
                  .sort((a, b) => a.booking_time.localeCompare(b.booking_time)),
              })).filter(g => g.bookings.length)
                .sort((a, b) => a.bookings[0].booking_time.localeCompare(b.bookings[0].booking_time));
              if (!groups.length) return <p className="text-sm text-muted-foreground">Δεν υπάρχουν ραντεβού.</p>;
              const today = format(new Date(), 'yyyy-MM-dd');
              const nowTime = new Date().toTimeString().slice(0, 5);
              return groups.map(g => <div key={g.section.id} className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.section.name}</h4>
                {g.bookings.map(b => {
                  const passed = date && format(date, 'yyyy-MM-dd') === today && b.booking_time.slice(0, 5) <= nowTime;
                  return <div key={b.id} className={`flex items-center gap-3 border-b border-border py-2 ${passed ? 'opacity-50' : ''}`}>
                  <span className="w-12 shrink-0 text-sm font-semibold">{b.booking_time.slice(0, 5)}</span>
                  <div className="min-w-0 flex-1"><p className="truncate font-medium">{b.user?.name}</p><p className="truncate text-xs text-muted-foreground">{b.user?.email}</p></div>
                  <span className="text-xs text-muted-foreground">{b.status === 'completed' ? 'Ολοκληρωμένο' : 'Κράτηση'}</span>
                  {['confirmed', 'pending'].includes(b.status) && <Button variant="ghost" size="icon" title="Ακύρωση ραντεβού" className="rounded-none" onClick={() => setCancelId(b.id)}><X className="h-4 w-4" /></Button>}
                </div>;
                })}
              </div>);
            })()}
          </div>
        </div>
      </TabsContent>
    </Tabs>
    <Dialog open={Boolean(popup)} onOpenChange={open => { if (!open) setPopup(null); }}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle className="text-base">
            {popupSection?.name ?? 'Τμήμα'} · {popup && format(popup.date, 'dd/MM/yyyy')} · {popup?.hour}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{popupBookings.filter(b => b.status !== 'cancelled').length} άτομα</p>
          {popupBookings.length ? popupBookings.map(b => <div key={b.id} className="flex items-center gap-3 border-b border-border py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{b.user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{b.user?.email}</p>
            </div>
            <span className="text-xs text-muted-foreground">{b.status === 'cancelled' ? 'Ακυρωμένο' : b.status === 'completed' ? 'Ολοκληρωμένο' : 'Κράτηση'}</span>
            {['confirmed', 'pending'].includes(b.status) && <Button variant="ghost" size="icon" title="Ακύρωση ραντεβού" className="rounded-none" onClick={() => setCancelId(b.id)}><X className="h-4 w-4" /></Button>}
          </div>) : <p className="py-4 text-center text-sm text-muted-foreground">Δεν υπάρχουν άτομα σε αυτό το τμήμα.</p>}
        </div>
      </DialogContent>
    </Dialog>
    <AlertDialog open={Boolean(cancelId)} onOpenChange={open => { if (!open) setCancelId(null); }}><AlertDialogContent className="rounded-none"><AlertDialogHeader><AlertDialogTitle>Ακύρωση ραντεβού;</AlertDialogTitle><AlertDialogDescription>Το ραντεβού θα ακυρωθεί.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-none">Επιστροφή</AlertDialogCancel><AlertDialogAction className="rounded-none" onClick={cancel}>Ακύρωση ραντεβού</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}