/// <reference types="node" />
import { it } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import { filterAnnualPlanningRecipients } from './coachScope';

it('excludes other coaches users from individual and group recipients', () => {
  deepStrictEqual(filterAnnualPlanningRecipients(['own-user', 'other-user', 'own-user'], ['own-user']), ['own-user']);
});