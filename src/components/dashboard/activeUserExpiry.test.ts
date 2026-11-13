import { it } from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert';
import {
  earliestEndDateByUser,
  sortUsersByExpiry,
  daysUntilExpiry,
} from './activeUserExpiry';

it('keeps the earliest end_date when a user has several active subscriptions', () => {
  const map = earliestEndDateByUser([
    { user_id: 'u1', end_date: '2026-12-30' },
    { user_id: 'u1', end_date: '2026-11-20' },
    { user_id: 'u2', end_date: '2026-11-25' },
    { user_id: 'u3', end_date: null },
  ]);

  strictEqual(map.get('u1'), '2026-11-20');
  strictEqual(map.get('u2'), '2026-11-25');
  strictEqual(map.has('u3'), false);
});

it('lists users expiring soonest first', () => {
  const users = [
    { id: 'late', name: 'Δημήτρης Kώτσας' },
    { id: 'soon', name: 'ΓΕΩΡΓΙΟΣ ΖΥΓΟΥΡΗΣ' },
    { id: 'middle', name: 'ΝΙΚΟΣ ΠΟΥΤΛΗΣ' },
  ];
  const dates = new Map([
    ['late', '2027-03-01'],
    ['soon', '2026-11-15'],
    ['middle', '2026-12-01'],
  ]);

  deepStrictEqual(sortUsersByExpiry(users, dates).map(u => u.id), ['soon', 'middle', 'late']);
});

it('falls back to alphabetical order on the same expiry day', () => {
  const users = [
    { id: 'b', name: 'ΒΑΣΙΛΗΣ ΤΖΕΒΕΛΕΚΗΣ' },
    { id: 'a', name: 'ΑΓΓΕΛΙΚΗ ΛΑΠΠΑ' },
  ];
  const dates = new Map([
    ['b', '2026-11-20'],
    ['a', '2026-11-20'],
  ]);

  deepStrictEqual(sortUsersByExpiry(users, dates).map(u => u.id), ['a', 'b']);
});

it('puts users without a known expiry last', () => {
  const users = [
    { id: 'nodate', name: 'ΧΩΡΙΣ ΣΥΝΔΡΟΜΗ' },
    { id: 'dated', name: 'ΜΕ ΣΥΝΔΡΟΜΗ' },
  ];
  const dates = new Map([['dated', '2030-01-01']]);

  deepStrictEqual(sortUsersByExpiry(users, dates).map(u => u.id), ['dated', 'nodate']);
});

it('counts the expiry day itself as zero days left', () => {
  const today = new Date(2026, 10, 13, 9, 0, 0);

  strictEqual(daysUntilExpiry('2026-11-13', today), 0);
  strictEqual(daysUntilExpiry('2026-11-20', today), 7);
  strictEqual(daysUntilExpiry(null, today), null);
});
