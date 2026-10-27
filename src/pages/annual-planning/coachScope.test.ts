/// <reference types="node" />
import { it } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import { filterAnnualPlanningRecipients, scopeSavedMacrocycles } from './coachScope';

it('excludes other coaches users from individual and group recipients', () => {
  deepStrictEqual(filterAnnualPlanningRecipients(['own-user', 'other-user', 'own-user'], ['own-user']), ['own-user']);
});

it('shows only saved plans belonging to the selected coach, excluding unowned legacy plans', () => {
  const plans = [{ id: 'own', coach_id: 'georgios' }, { id: 'other', coach_id: 'other-coach' }, { id: 'legacy', coach_id: null }];
  deepStrictEqual(scopeSavedMacrocycles(plans, 'georgios', (rows, id) => rows.filter(row => row.coach_id === id)), [plans[0]]);
});