import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sectionVisitEvents } from './sectionVisitEvents';

export function useSectionVisitCalendar(userId: string | undefined, sectionId: string, start: string, end: string) {
  return useQuery({
    queryKey: ['section-visit-calendar', userId, sectionId, start, end],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [];
      const bookings = [];
      const visits = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from('booking_sessions').select('*').eq('user_id', userId).eq('section_id', sectionId)
          .gte('booking_date', start).lte('booking_date', end).order('id').range(offset, offset + 999);
        if (error) throw error;
        bookings.push(...(data || []));
        if ((data?.length || 0) < 1000) break;
      }
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from('user_visits').select('*').eq('user_id', userId).eq('section_id', sectionId)
          .gte('visit_date', start).lte('visit_date', end).order('id').range(offset, offset + 999);
        if (error) throw error;
        visits.push(...(data || []));
        if ((data?.length || 0) < 1000) break;
      }
      return sectionVisitEvents(bookings, visits, userId, sectionId);
    },
    refetchOnWindowFocus: false,
  });
}