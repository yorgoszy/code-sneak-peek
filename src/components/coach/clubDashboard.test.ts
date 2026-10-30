import { describe, expect, test } from 'bun:test';
import { isClubDashboardPath, usesClubDashboard } from './clubDashboard';

describe('Club dashboard scope', () => {
  test('uses the Club scope when an admin views a Club profile', () => {
    expect(usesClubDashboard('club', false)).toBe(true);
    expect(usesClubDashboard('coach', false)).toBe(false);
  });

  test('keeps athlete management', () => {
    expect(isClubDashboardPath('/dashboard/my-athletes?coachId=club-user')).toBe(true);
  });

  test('keeps groups', () => {
    expect(isClubDashboardPath('/dashboard/coach-groups')).toBe(true);
  });

  test('keeps subscriptions', () => {
    expect(isClubDashboardPath('/dashboard/coach-subscriptions')).toBe(true);
  });

  test('keeps profile and fiscal settings', () => {
    expect(isClubDashboardPath('/dashboard/coach-profile')).toBe(true);
  });

  test('excludes coach-only training features', () => {
    for (const path of ['coach-programs', 'coach-active-programs', 'coach-program-cards', 'coach-annual-planning', 'coach-progress', 'coach-athletes-progress', 'coach-health-cards', 'coach-courses']) {
      expect(isClubDashboardPath(`/dashboard/${path}`)).toBe(false);
    }
  });
});