import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert';
import { usesAdminUserOverview } from './overviewScope';

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