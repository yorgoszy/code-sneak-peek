import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { loadCoachBookingAppointments, summarizeTodaysClasses } from '@/components/booking/coachBookingAppointments';

export function TodaysClassesWidget({ coachId, today, className }: { coachId: string; today: string; className: string }) {
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ['coach-booking-appointments', coachId, today],
    queryFn: () => loadCoachBookingAppointments(coachId, supabase, today),
    enabled: Boolean(coachId), staleTime: 0,
  });
  useEffect(() => {
    const channel = supabase.channel(`todays-classes-${coachId}-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_sessions', filter: `coach_id=eq.${coachId}` }, () => { void query.refetch(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [coachId, query.refetch]);
  const summary = summarizeTodaysClasses(query.data ?? [], coachId, today);
  return <>
    <Button variant="outline" onClick={() => setOpen(true)} className={`${className} flex flex-col items-start justify-between gap-2 text-[var(--th-blue)]`}>
      <span className="flex w-full items-center justify-between gap-2"><CalendarCheck className="h-5 w-5 shrink-0" /><span className="text-2xl font-semibold tabular-nums" aria-live="polite">{query.isError ? '—' : query.isLoading ? '…' : summary.count}</span></span>
      <span className="w-full whitespace-normal text-left text-sm font-medium">Σημερινά μαθήματα</span>
      <span className="w-full truncate text-left text-xs text-muted-foreground">
        {query.isError ? 'Δεν φορτώθηκαν τα ραντεβού' : query.isLoading ? 'Φόρτωση…' : summary.count ? `${summary.attendees.slice(0, 2).map(a => a.name).join(', ')}${summary.count > 2 ? ` +${summary.count - 2}` : ''}` : 'Δεν υπάρχουν συμμετέχοντες'}
      </span>
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader><DialogTitle>Σημερινά μαθήματα</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{today.split('-').reverse().join('/')} · {summary.count} συμμετέχοντες</p>
        {query.isError ? <p role="alert">Δεν ήταν δυνατή η φόρτωση των ραντεβού.</p> : query.isLoading ? <p role="status">Φόρτωση…</p> : summary.appointments.length ? summary.appointments.map(row => <div key={row.id} className="flex items-center gap-3 border-b border-border py-2">
          <Avatar className="h-8 w-8 shrink-0"><AvatarImage src={row.user?.avatar_url ?? undefined} /><AvatarFallback>{row.user?.name?.slice(0, 1) || 'Χ'}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{row.user?.name || 'Χρήστης'}</p><p className="break-words text-xs text-muted-foreground">{row.section?.name}</p></div>
          <span className="shrink-0 text-sm tabular-nums">{row.booking_time.slice(0, 5)}</span>
        </div>) : <p className="text-sm text-muted-foreground">Δεν υπάρχουν σημερινά μαθήματα.</p>}
      </DialogContent>
    </Dialog>
  </>;
}