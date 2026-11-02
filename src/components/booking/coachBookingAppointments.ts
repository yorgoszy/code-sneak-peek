import type { supabase } from '@/integrations/supabase/client';

export async function loadCoachBookingAppointments(coachId: string, client: typeof supabase, date?: string) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    let query = client.from('booking_sessions').select('*, user:app_users!user_id(id,name,email,avatar_url), section:booking_sections!section_id(name)')
      .eq('coach_id', coachId).eq('booking_type', 'gym_visit');
    if (date) query = query.eq('booking_date', date);
    const { data, error } = await query.order('booking_date').order('booking_time').order('id').range(offset, offset + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) return rows;
  }
}

export type CoachBookingAppointment = Awaited<ReturnType<typeof loadCoachBookingAppointments>>[number];

export function summarizeTodaysClasses(rows: CoachBookingAppointment[], coachId: string, date: string) {
  const appointments = rows.filter(row => row.coach_id === coachId && row.booking_type === 'gym_visit'
    && row.booking_date === date && ['pending', 'confirmed', 'completed'].includes(row.status));
  const attendees = [...new Map(appointments.map(row => [row.user_id, {
    id: row.user_id, name: row.user?.name || 'Χρήστης', avatar: row.user?.avatar_url,
  }])).values()];
  return { appointments, attendees, count: attendees.length };
}