import { test } from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { thaihubPlans } from './thaihubPlans';

test('Club costs 29 EUR monthly including VAT', () => {
  strictEqual(thaihubPlans[0].name, 'Club');
  strictEqual(thaihubPlans[0].monthlyPrice, 29);
  strictEqual(thaihubPlans[0].currency, 'EUR');
  strictEqual(thaihubPlans[0].vatIncluded, true);
});

test('Coach costs 59 EUR monthly including VAT', () => {
  strictEqual(thaihubPlans[1].name, 'Coach');
  strictEqual(thaihubPlans[1].monthlyPrice, 59);
  strictEqual(thaihubPlans[1].vatIncluded, true);
});

test('Federation costs 99 EUR monthly including VAT', () => {
  strictEqual(thaihubPlans[2].name, 'Federation');
  strictEqual(thaihubPlans[2].monthlyPrice, 99);
  strictEqual(thaihubPlans[2].vatIncluded, true);
});

test('Club includes athlete management, subscriptions, income/expenses and myDATA integration', () => {
  deepStrictEqual(thaihubPlans[0].features, ['athletes', 'subscriptions', 'incomeExpenses', 'mydata']);
});

test('Coach inherits Club and adds program design, tracking, tests, profile, progress, nutrition and video analysis', () => {
  deepStrictEqual(thaihubPlans[1].features, [...thaihubPlans[0].features, 'programDesign', 'volumeIntensity', 'tests', 'athleteProfile', 'athleteProgress', 'nutrition', 'videoAnalysis']);
});

test('Federation inherits Coach and adds clubs, cards, requests, competitions, weigh-in, payments, ranking and AI analysis', () => {
  deepStrictEqual(thaihubPlans[2].features, [...thaihubPlans[1].features, 'federationClubs', 'athleteCards', 'athleteRequests', 'competitions', 'liveWeighIn', 'liveVideo', 'onlinePayments', 'ranking', 'aiVideoAnalysis']);
});