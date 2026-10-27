/// <reference types="node" />
import { it } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import { scopeAnnualPlanningUsers, scopeAnnualPlanningPhases, filterAnnualPlanningRecipients } from './coachScope';

it('scopes users and assigned plans to the viewed coach', () => {
  const filters: string[][] = [];
  const query = { eq(column: string, value: string) { filters.push([column, value]); return this; } };
  scopeAnnualPlanningUsers(query, 'coach-georgios');
  scopeAnnualPlanningPhases(query, 'coach-georgios');
  deepStrictEqual(filters, [['coach_id', 'coach-georgios'], ['app_users.coach_id', 'coach-georgios']]);
});

it('excludes other coaches users from individual and group recipients', () => {
  deepStrictEqual(filterAnnualPlanningRecipients(['own-user', 'other-user', 'own-user'], ['own-user']), ['own-user']);
});