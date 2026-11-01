import { it } from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { daySectionSchedule } from './daySectionSchedule';
import { canBookGymSection } from '../../../hooks/bookingSectionAccess';

it('all scheduled sections are visible on the clicked day without booking access', () => {
  const sections = [
    { id: 'open-gym', available_hours: { thursday: ['10:00'] } },
    { id: 'muay-thai', available_hours: { thursday: ['10:00', '18:00:00'] } },
    { id: 'monday-only', available_hours: { monday: ['09:00'] } },
  ];
  const schedule = daySectionSchedule(sections, 3, '2026-11-05');
  deepStrictEqual(schedule.map(slot => [slot.time, slot.sections.map(section => section.id)]), [
    ['10:00', ['open-gym', 'muay-thai']], ['18:00', ['muay-thai']],
  ]);
  strictEqual(canBookGymSection('muay-thai', { type: 'none' }), false);
});

it('selecting another day displays that day rather than the previous selection', () => {
  const sections = [{ id: 'gym', available_hours: { monday: ['09:00'], thursday: ['18:00'] } }];
  deepStrictEqual(daySectionSchedule(sections, 0, '2026-11-02').map(slot => slot.time), ['09:00']);
  deepStrictEqual(daySectionSchedule(sections, 3, '2026-11-05').map(slot => slot.time), ['18:00']);
  deepStrictEqual(daySectionSchedule(sections, 6, '2026-11-08'), []);
});