import type { SectionCalendarEvent } from './sectionVisitEvents';

interface ScheduledSection {
  id: string;
  available_hours: Record<string, string[]>;
}

const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Viewing a day depends only on its schedule, never on subscription access.
export function daySectionSchedule<T extends ScheduledSection>(sections: T[], dayIndex: number, date: string, events: SectionCalendarEvent[] = []) {
  const dayKey = dayKeys[dayIndex];
  if (!dayKey) return [];
  const hours = (section: T) => [
    ...(section.available_hours?.[dayKey] || []).map(time => time.slice(0, 5)),
    ...events.filter(event => event.section_id === section.id && event.booking_date === date).map(event => event.booking_time.slice(0, 5)),
  ];
  return [...new Set(sections.flatMap(hours))].sort().map(time => ({
    time,
    sections: sections.filter(section => hours(section).includes(time)),
  }));
}