export interface SectionCalendarEvent {
  id: string;
  user_id?: string;
  section_id: string;
  booking_date: string;
  booking_time: string;
  booking_type: string;
  status: string;
  attendance_status?: string | null;
  attended?: boolean;
  notes?: string | null;
  source?: 'visit' | 'booking';
}

export interface SavedSectionVisit {
  id: string;
  user_id: string;
  section_id: string | null;
  visit_date: string;
  visit_time: string;
  visit_type: string;
  notes?: string | null;
}

export function sectionVisitEvents(bookings: SectionCalendarEvent[], visits: SavedSectionVisit[], userId: string, sectionId: string) {
  const events = bookings.filter(b => b.user_id === userId && b.section_id === sectionId && b.status !== 'cancelled').map(b => ({
    ...b, source: 'booking' as const,
    attended: b.attendance_status === 'completed' || b.status === 'completed' ? true : b.attendance_status === 'missed' || b.status === 'missed' ? false : b.attended,
  }));
  return [...events, ...visits.filter(v => v.user_id === userId && v.section_id === sectionId && v.visit_type !== 'booking' && v.visit_type !== 'qr_scan').map(v => ({
    id: v.id, user_id: v.user_id, section_id: sectionId, booking_date: v.visit_date,
    booking_time: v.visit_time, booking_type: 'gym_visit', status: 'completed', attended: true,
    notes: v.notes, source: 'visit' as const,
  }))];
}