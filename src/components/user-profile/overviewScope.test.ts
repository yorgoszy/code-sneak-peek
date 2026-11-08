import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert';
import { usesAdminUserOverview, showsAthleteOverviewCards } from './overviewScope';

describe('Athlete overview additions', () => {
  it('includes athletes in the additional athlete cards', () => {
    strictEqual(showsAthleteOverviewCards('athlete', false, false), true);
  });
  it('keeps general non-athletes without athlete additions', () => {
    strictEqual(showsAthleteOverviewCards('general', false, false), false);
  });
  it('recognizes users explicitly marked as athletes', () => {
    strictEqual(showsAthleteOverviewCards('general', true, false), true);
  });
  it('waits for the owner scope to resolve', () => {
    strictEqual(showsAthleteOverviewCards('athlete', true, true), false);
  });
});

describe('Admin athlete/general overview scope', () => {
  it('applies to admin-owned athletes', () => {
    strictEqual(usesAdminUserOverview('athlete', false, 'admin'), true);
  });
  it('applies to global general users', () => {
    strictEqual(usesAdminUserOverview('general', false, null), true);
  });
  it('preserves coach-owned user overviews', () => {
    strictEqual(usesAdminUserOverview('athlete', true, 'coach'), false);
    strictEqual(usesAdminUserOverview('general', true, 'coach'), false);
  });
  it('preserves club-owned user overviews', () => {
    strictEqual(usesAdminUserOverview('athlete', true, 'club'), false);
    strictEqual(usesAdminUserOverview('general', true, 'club'), false);
  });
  it('does not change other account roles or federation-owned users', () => {
    strictEqual(usesAdminUserOverview('parent', false, null), false);
    strictEqual(usesAdminUserOverview('coach', false, null), false);
    strictEqual(usesAdminUserOverview('athlete', false, 'federation'), false);
  });
});