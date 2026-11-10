import { describe, it } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import { adminAssignmentSections } from './adminAssignmentSections';

describe('Admin assignment section scope', () => {
  it('includes legacy global gym sections while excluding coach calendars and videocalls', () => {
    const rows = [
      { name: 'Muay Thai αγωνιστικο', is_active: true, coach_id: null, booking_type: null },
      { name: 'New gym', is_active: true, coach_id: null, booking_type: 'gym_visit' },
      { name: 'BOXING', is_active: true, coach_id: 'coach', booking_type: 'gym_visit' },
      { name: 'Video', is_active: true, coach_id: null, booking_type: 'videocall' },
      { name: 'Inactive', is_active: false, coach_id: null, booking_type: null },
    ];
    let selected = rows;
    const query = {
      eq(column: string, value: boolean) {
        selected = selected.filter(row => row[column as keyof typeof row] === value);
        return this;
      },
      is(column: string, value: null) {
        selected = selected.filter(row => row[column as keyof typeof row] === value);
        return this;
      },
      or(filter: string) {
        const clauses = filter.split(',');
        selected = selected.filter(row => clauses.some(clause => {
          const [column, operation, value] = clause.split('.');
          const actual = row[column as keyof typeof row];
          return operation === 'is' ? actual === null && value === 'null' : actual === value;
        }));
        return this;
      },
    };
    adminAssignmentSections(query);
    deepStrictEqual(selected.map(row => row.name), ['Muay Thai αγωνιστικο', 'New gym']);
  });
});