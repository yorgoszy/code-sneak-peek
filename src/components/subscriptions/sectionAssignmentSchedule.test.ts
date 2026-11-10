import { describe, it } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import { normalizeSectionSchedule } from './sectionAssignmentSchedule';

describe('Section assignment selections', () => {
  it('preserves every selected weekday regardless of the remaining subscription dates', () => {
    const schedule = { monday: ['19:00'], tuesday: ['19:00'], wednesday: ['19:00'], thursday: ['19:00'], friday: ['19:00'] };
    deepStrictEqual(normalizeSectionSchedule(schedule, schedule), schedule);
  });
  it('keeps only the selected times rather than selecting the entire day', () => {
    deepStrictEqual(normalizeSectionSchedule({ monday: ['09:00'] }, { monday: ['08:00', '09:00', '10:00'] }), { monday: ['09:00'] });
  });
  it('normalizes stored seconds and rejects times removed from the section', () => {
    deepStrictEqual(normalizeSectionSchedule({ monday: ['19:00:00', '19:00', '20:00'] }, { monday: ['19:00:00'] }), { monday: ['19:00'] });
  });
});