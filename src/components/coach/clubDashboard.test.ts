import { describe, it as test } from 'node:test';
import { strictEqual } from 'node:assert';
import { isClubDashboardPath, usesClubDashboard } from './clubDashboard';

describe('Club dashboard scope', () => {
  test('uses the Club scope when an admin views a Club profile', () => {
    strictEqual(usesClubDashboard('club', false), true);
    strictEqual(usesClubDashboard('coach', false), false);
  });

  test('keeps athlete management', () => {
    strictEqual(isClubDashboardPath('/dashboard/my-athletes?coachId=club-user'), true);
  });

  test('keeps groups', () => {
    strictEqual(isClubDashboardPath('/dashboard/coach-groups'), true);
  });

  test('keeps subscriptions', () => {
    strictEqual(isClubDashboardPath('/dashboard/coach-subscriptions'), true);
  });

  test('keeps profile and fiscal settings', () => {
    strictEqual(isClubDashboardPath('/dashboard/coach-profile'), true);
  });

  test('excludes coach-only training features', () => {
    for (const path of ['coach-programs', 'coach-active-programs', 'coach-program-cards', 'coach-annual-planning', 'coach-progress', 'coach-athletes-progress', 'coach-health-cards', 'coach-courses']) {
      strictEqual(isClubDashboardPath(`/dashboard/${path}`), false);
    }
  });
});
import { isThaiHubPlanExpired, renewalPlan } from './clubDashboard';
describe('ThaiHub plan expiry and renewal', () => {
  test('a coach without an active paid subscription is locked out', () => { strictEqual(isThaiHubPlanExpired({ role: 'coach', active: false }), true); });
  test('an active coach keeps access', () => { strictEqual(isThaiHubPlanExpired({ role: 'coach', active: true }), false); });
  test('ordinary users are never locked by plan expiry', () => { strictEqual(isThaiHubPlanExpired({ role: 'general', active: false }), false); });
  test('a scheduled downgrade renews as Club', () => { strictEqual(renewalPlan({ role: 'coach', next_plan: 'club' }), 'club'); });
  test('without a downgrade the coach renews as Coach', () => { strictEqual(renewalPlan({ role: 'coach', next_plan: null }), 'coach'); });
});
